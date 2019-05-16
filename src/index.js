import sha1 from 'js-sha1'

const _ = Symbol('Deployment')

const ALLOWED_EVENTS = new Set([
  'deployment-state-changed',
  'build-state-changed',
  'created',
  'ready',
  'error'
])

const API = 'https://api.zeit.co/v8/now/deployments'

/**
 * Read file contents and return a promise
 *
 * @param {Blob} file - file to read
 * @returns {Promise}
 */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
  
    reader.onerror = reject
    reader.onload = (e) => {
      resolve({
        name: file.name,
        data: e.target.result,
      })
    }
  
    if (file.name === 'now.json') {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

function getFileName(file) {
  if (!file.webkitRelativePath || file.webkitRelativePath.length === 0) {
    return file.name
  }
  
  const [, ...path] = file.webkitRelativePath.split('/')

  return path.join('/')
}

/**
 * Prepare files for upload, calculate SHA, get metadata from now.json
 *
 * @param {*} files
 * @returns {Promise}
 */
function prepareFiles(files) {
  return new Promise(async (resolve, reject) => {
    try {
      const promises = []

      for (let i = 0; i < files.length; i++) {
        const file = files.item(i)

        promises.push(readFile(file))
      }

      const loadedFiles = await Promise.all(promises)
      const prepFiles = []
      
      loadedFiles.forEach(file => {
        const sha = sha1(file.data)
  
        prepFiles.push({
          ...file,
          name: getFileName(file),
          sha
        })
      })
  
      let nowJson = prepFiles.find(({ name }) => name === 'now.json')
      let metadata = {}
      
      if (nowJson) {
        metadata = JSON.parse(nowJson.data)
      }
  
      resolve([prepFiles, metadata])
    } catch (e) {
      reject(e)
    }
  })
} 

/**
 * Upload prepared files to Now
 *
 * @param {*} files - Prepared files
 * @param {string} token - ZEIT API token
 * @returns
 */
function upload(files, token) {
  return Promise.all(files.map(async file => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(file.data)
        controller.close()
      }
    })

    const res = await fetch('https://api.zeit.co/v2/now/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Length': file.data.length,
        'x-now-digest': file.sha,
      },
      body: stream
    })

    return res.json()
  }))
}


/**
 * Create a deployment with prepared and uploaded files
 *
 * @param {Object} files - Prepared files
 * @param {string} token - ZEIT API token
 * @param {Object} metadata - Deployment metadata (see https://zeit.co/docs/api#endpoints/deployments/create-a-new-deployment)
 * @returns
 */
async function createDeployment(files, token, metadata_) {
  // Extract teamId from the metadata
  const { teamId = null, ...metadata } = metadata_

  const dpl = await fetch(`${API}${teamId ? `?teamId=${teamId}` : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...metadata,
      files: files.map(file => ({
        file: file.name,
        sha: file.sha,
        size: file.data.length || file.data.byteLength
      }))
    })
  })

  const json = await dpl.json()

  if (!dpl.ok)  {
    // Return error object
    return json
  }

  return { deployment: json }
}


/**
 * Deployment class that handles uploading files, creating deployments and watching status changes
 *
 * @export
 * @class Deployment
 */
export default class Deployment {
  /**
   * Creates an instance of Deployment.
   * @param {FileList} files - Files received from input or drop event
   * @param {string} [token=null] - ZEIT API token
   * @param {Object} [metadata={}] - Deployment metadata (see https://zeit.co/docs/api#endpoints/deployments/create-a-new-deployment)
   * @memberof Deployment
   */
  constructor(files, token = null, metadata = {}) {
    this.metadata = metadata
    this.files = files
    this.preparedFiles = []

    if (token && typeof token !== 'string') {
      const err = { code: 'invalid_token', message: 'Token must be a string' }
      this.fireListeners('error', err)

      throw new DeploymentError(err)
    }

    this[_] = {
      listeners: new Set(),
      token,
    }
  }

  // Should you need to override metadata
  setMetadata = (metadata) => {
    this.metadata = metadata
  }

  // Should you need to override files
  setFiles = (files) => {
    this.files = files
  }

  // Add event listener
  on = (event, handler) => {
    if (ALLOWED_EVENTS.has(event)) {
      this[_].listeners.add({ event, handler })
    }
  }

  // Remove event listener
  off = (event, handler) => {
    if (ALLOWED_EVENTS.has(event)) {
      this[_].listeners.delete({ event, handler })
    }
  }

  // Set the token
  authenticate = (token) => {
    if (typeof token !== 'string') {
      const err = { code: 'invalid_token', message: 'Token must be a string' }
      this.fireListeners('error', err)

      throw new DeploymentError(err)
    }

    this[_].token = token
  }
   
  // Main deployment method
  deploy = async () => {
    if (!this[_].token) {
      const err = { code: 'no_token', message: 'Token not provided. Make sure you run `authenticate()` method or provide the token to the class constructor' }
      this.fireListeners('error', err)

      throw new DeploymentError(err)  
    }
    if (!this.files || !this.files.length || this.files.length === 0) {
      const err = { code: 'no_files', message: 'No files were provided' }
      this.fireListeners('error', err)

      throw new DeploymentError(err)
    }

    try {
      const [files, metadata] = await prepareFiles(this.files)

      // Merge now.json metadata and provided metadata if any
      const finalMetadata = { ...metadata, ...this.metadata }

      if (Object.keys(finalMetadata).length === 0) {
        finalMetadata.builds = [{ src: "**", use: "@now/static" }]
        finalMetadata.version = 2
        finalMetadata.name = files[0].name
      }

      if (finalMetadata.version !== 2) {
        const err = { code: 'unsupported_version', message: 'Only Now 2.0 deployments are supported. Specify `version: 2` in your now.json and try again' }
        this.fireListeners('error', err)

        throw new DeploymentError(err)
      }

      await upload(files, this[_].token)
      const { deployment, error } = await createDeployment(files, this[_].token, finalMetadata)
      
      if (error) {
        // A deployment error occurred
        this.fireListeners('error', error)

        throw new DeploymentError(error)
      }

      this.fireListeners('created', deployment)

      if (deployment.readyState === 'READY') {
        this.fireListeners('ready', deployment)
        
        // Don't proceed if the deployment is ready right away
        return
      }

      // Set up polling to watch for status changes
      this.deployment = deployment
      this.poll = setTimeout(() => this.checkDeploymentStatus(), 3000)
      
      return deployment
    } catch (e) {
      const err = { code: 'unexpected_error', message: e.toString() }
      this.fireListeners('error', err)
    }
  }

  builds = {}

  checkDeploymentStatus = async () => {
    const { token } = this[_]
    const teamId = this.deployment.team ? this.deployment.team.id : null

    // Get fresh states of the deployment and builds
    const [deploymentData, buildsData] = await Promise.all([
      fetch(`${API}/${this.deployment.id}${teamId ? `?teamId=${teamId}` : ''}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }),
      fetch(`${API}/${this.deployment.id}/builds${teamId ? `?teamId=${teamId}` : ''}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }),
    ])

    const [deploymentUpdate, { builds }] = await Promise.all([
      deploymentData.json(),
      buildsData.json()
    ])

    // Fire listeners for build status changes if needed
    builds.forEach(build => {
      const prevState = this.builds[build.id]
      
      if (!prevState || prevState.readyState !== build.readyState) {
        this.fireListeners('build-state-changed', build)
      }

      this.builds[build.id] = build
    })
    
    // Fire deployment state change listeners if needed
    if (deploymentUpdate.readyState !== this.deployment.readyState) {
      this.fireListeners('deployment-state-changed', deploymentUpdate)
    }

    this.deployment = deploymentUpdate

    if (this.deployment.readyState === 'READY') {
      this.fireListeners('ready', deploymentUpdate)

      // If the deployment is ready, peace out
      return
    }

    // Otherwise continue polling
    setTimeout(this.checkDeploymentStatus, 3000)
  }

  fireListeners = (event, data) => {
    this[_].listeners.forEach(listener => {
      if (listener.event === event) {
        listener.handler(data)
      }
    })
  }
}

class DeploymentError extends Error {
  constructor(err) {
    super(err.message)
    this.code = err.code
    this.name = 'DeploymentError'
  }
}
