import { EventEmitter } from 'events'
import { parse as parseUrl } from 'url'
import { createReadStream } from 'fs-extra'
import retry from 'async-retry'
import qs from 'querystring'
import { fetch } from 'fetch-h2'
import { DeploymentFile } from './utils/hashes'
import { API_FILES, parseNowJSON, API_DEPLOYMENTS } from './utils'
import { DeploymentError } from './'
import pkg from '../package.json'
import { isDone } from './utils/ready-state';

const getDefaultName = (files: Map<string, DeploymentFile>): string => {
  const filePath = Array.from(files.values())[0].names[0]
  const segments = filePath.split('/')

  return segments[segments.length - 1]
}

export default class Deployment extends EventEmitter {
  constructor(files: Map<string, DeploymentFile>, { token, teamId, defaultName, isDirectory, path, ...metadata }: DeploymentOptions) {
    super()

    this.files = files
    this.token = token as string
    this.teamId = teamId
    this.defaultName = defaultName
    this.metadata = metadata || {}
    this.totalFiles = [...files.keys()].length
    this.isDirectory = isDirectory
    this.path = path

    this.emit('hashes-calculated', files)
  }

  token: string
  teamId?: string
  defaultName?: string
  metadata: DeploymentOptions
  files: Map<string, DeploymentFile>
  totalFiles: number;
  isDirectory?: boolean;
  path?: string | string[];
  _data?: ZEITDeployment;
  poll?: NodeJS.Timeout;

  builds: { [key: string]: DeploymentBuild } = {}

  upload = (): Promise<void> => new Promise((resolve): void => {
    Promise.all(
      Array.from(this.files.keys()).map((sha: string): Promise<void> => retry(
        async (bail): Promise<void> => {
          const file = this.files.get(sha)

          if (!file) {
            return
          }

          const fPath = file.names[0]
          const stream = createReadStream(fPath)
          const { data } = file

          const fstreamPush = stream.push

          let uploadedSoFar = 0

          stream.push = (chunk: any): boolean => {
            // If we're about to push the last chunk, then don't do it here
            // But instead, we'll "hang" the progress bar and do it on 200
            if (chunk && uploadedSoFar + chunk.length < data.length) {
              this.emit('upload-progress', chunk.length)
              uploadedSoFar += chunk.length
            }
            return fstreamPush.call(stream, chunk)
          }

          // @ts-ignore
          const res = await this._fetch(API_FILES, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'x-now-digest': sha,
              'x-now-length': data.length,
            },
            body: stream,
            teamId: this.teamId
          })

          if (res.status === 200) {
            // What we want
            this.emit('upload-progress', file.data.length - uploadedSoFar)
            this.emit('file-uploaded', file)
          } else if (res.status > 200 && res.status < 500) {
            // If something is wrong with our request, we don't retry
            const { error } = await res.json()

            return bail(new DeploymentError(error))
          } else {
            // If something is wrong with the server, we retry
            const { error } = await res.json()

            throw new DeploymentError(error)
          }
        },
        {
          retries: 3,
          randomize: true
        }
      )
      ))
      .then((): void => {
        this.emit('all-files-uploaded')
        resolve()
      })
      .catch((e: any): boolean => this.emit('error', e))
  })

  deploy = async (): Promise<void> => {
    await this.upload()

    const nowJson: DeploymentFile | undefined = Array.from(this.files.values()).find((file: DeploymentFile): boolean => {
      return Boolean(file.names.find((name: string): boolean => name.includes('now.json')))
    })
    const nowJsonMetadata = parseNowJSON(nowJson)
    const metadata = { ...nowJsonMetadata, ...this.metadata }

    // Check if we should default to a static deployment
    if (!metadata.builds && !metadata.version && !metadata.name) {
      metadata.builds = [{ src: "**", use: "@now/static" }]
      metadata.version = 2
      metadata.name = this.totalFiles === 1 ? 'file' : getDefaultName(this.files)

      this.emit('default-to-static', metadata)
    }

    if (!metadata.name) {
      metadata.name = this.defaultName || getDefaultName(this.files)
    }

    if (metadata.version !== 2) {
      this.emit('error', { code: 'unsupported_version', message: 'Only Now 2.0 deployments are supported. Specify `version: 2` in your now.json and try again' })

      return
    }

    const { deployment, error } = await this.createDeployment(metadata)

    if (!deployment || error) {
      this.emit('error', error || { code: 'unexpected_error', message: 'An unexpected error has occurred' })
      return
    }

    this.emit('created', deployment)
    this.emit('deployment-created', deployment) // Event alias
    this.emit('deployment-state-changed', deployment)

    this._data = deployment

    if (deployment.readyState === 'READY') {
      this.emit('ready', deployment)

      // Don't proceed if the deployment is ready right away
      return
    }

    this.poll = setTimeout((): void => {
      this.checkDeploymentStatus()
    }, 3000)
  }

  createDeployment = async (metadata: DeploymentOptions): Promise<{ deployment?: ZEITDeployment; error?: any }> => {
    interface PreparedFile {
      file: string;
      sha: string;
      size: number;
    }

    const files: PreparedFile[] = []

    this.files.forEach((file, sha): void => {
      let name
      
      if (this.isDirectory) {
        // Directory
        name = this.path ? file.names[0].replace(`${this.path}/`, '') : file.names[0]
      } else {
        // Array of files or single file
        const segments = file.names[0].split('/')
        name = segments[segments.length - 1]
      }

      files.push({
        file: name,
        size: file.data.byteLength || file.data.length,
        sha,
      })
    })

    const dpl = await this._fetch(`${API_DEPLOYMENTS}${this.teamId ? `?teamId=${this.teamId}` : ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        ...metadata,
        files
      })
    })

    const json = await dpl.json()

    if (!dpl.ok)  {
      // Return error object
      return json
    }

    return { deployment: json }
  }

  checkDeploymentStatus = async (): Promise<void> => {
    if (!this._data) {
      return
    }

    // Get builds and deployment status
    const buildsData = await this._fetch(`${API_DEPLOYMENTS}/${this._data.id}/builds${this.teamId ? `?teamId=${this.teamId}` : ''}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      }
    })

    const { builds = [] } = await buildsData.json()

    // Fire listeners for build status changes if needed
    builds.forEach((build: DeploymentBuild): void => {
      const prevState = this.builds[build.id]

      if (!prevState || prevState.readyState !== build.readyState) {
        this.emit('build-state-changed', build)
      }

      this.builds[build.id] = build
    })

    let allBuildsCompleted = true
    Object.keys(this.builds).forEach((key: string): void => {
      const build = this.builds[key]

      if (isDone(build)) {
        allBuildsCompleted = false
      }
    })

    if (allBuildsCompleted) {
      const deploymentData = await this._fetch(`${API_DEPLOYMENTS}/${this._data.id}${this.teamId ? `?teamId=${this.teamId}` : ''}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        }
      })
      const deploymentUpdate = await deploymentData.json()
  
      // Fire deployment state change listeners if needed
      if (deploymentUpdate.readyState !== this._data.readyState) {
        this.emit('deployment-state-changed', deploymentUpdate)
      }
  
      this._data = deploymentUpdate
  
      if (isDone(this._data as ZEITDeployment)) {
        this.emit('ready', deploymentUpdate)
  
        // If the deployment is ready or failed, peace out
        return
      }
  
      // Otherwise continue polling
      setTimeout((): void => {
        this.checkDeploymentStatus()
      }, 3000)
    } else {
      setTimeout((): void => {
        this.checkDeploymentStatus()
      }, 3000)
    }
  }

  _fetch = (url: string, opts: any = {}): Promise<any> => {
    if (opts.teamId) {
      const parsedUrl = parseUrl(url, true)
      const query = parsedUrl.query

      query.teamId = opts.teamId
      url = `${parsedUrl.pathname}?${qs.encode(query)}`
      delete opts.teamId
    }

    opts.headers = opts.headers || {}
    // @ts-ignore
    opts.headers.authorization = `Bearer ${this.token}`
    // @ts-ignore
    opts.headers['user-agent'] = `now-client-v${pkg.version}`

    return fetch(url, opts)
  }
}
