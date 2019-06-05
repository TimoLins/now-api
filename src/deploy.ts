import upload from './upload'
import { DeploymentFile } from './utils/hashes';
import { parseNowJSON, fetch, API_DEPLOYMENTS } from './utils';

interface Options {
  metadata: DeploymentOptions;
  totalFiles: number;
  path: string | string[];
  token: string;
  teamId?: string;
  isDirectory?: boolean;
  defaultName?: string;
}

async function* createDeployment (metadata: DeploymentOptions, files: Map<string, DeploymentFile>, options: Options): AsyncIterableIterator<{ type: string; payload: any }> {
  interface PreparedFile {
    file: string;
    sha: string;
    size: number;
  }

  const preparedFiles: PreparedFile[] = []

  files.forEach((file, sha): void => {
    let name

    if (options.isDirectory) {
      // Directory
      name = options.path ? file.names[0].replace(`${options.path}/`, '') : file.names[0]
    } else {
      // Array of files or single file
      const segments = file.names[0].split('/')
      name = segments[segments.length - 1]
    }

    preparedFiles.push({
      file: name,
      size: file.data.byteLength || file.data.length,
      sha,
    })
  })

  const dpl = await fetch(`${API_DEPLOYMENTS}${options.teamId ? `?teamId=${options.teamId}` : ''}`, options.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.token}`,
    },
    body: JSON.stringify({
      ...metadata,
      files: preparedFiles
    })
  })

  const json = await dpl.json()

  if (!dpl.ok)  {
    // Return error object
    yield { type: 'error', payload: json }
  }
  
  if (json.error) {
    yield { type: 'error', payload: json.error }
  } else {
    yield { type: 'created', payload: json }
  }
}


const getDefaultName = (path: string | string[] | undefined, isDirectory: boolean | undefined, files: Map<string, DeploymentFile>): string => {
  if (isDirectory && typeof path === 'string') {
    const segments = path.split('/')

    return segments[segments.length - 1]
  } else {
    const filePath = Array.from(files.values())[0].names[0]
    const segments = filePath.split('/')

    return segments[segments.length - 1]
  }
}

export default async function* deploy(files: Map<string, DeploymentFile>, options: Options): AsyncIterableIterator<{ type: string; payload: any }> {
  // @ts-ignore
  for await(const event of upload(this.files, this.token, this.teamId)) {
    yield event
  }

  const nowJson: DeploymentFile | undefined = Array.from(files.values()).find((file: DeploymentFile): boolean => {
    return Boolean(file.names.find((name: string): boolean => name.includes('now.json')))
  })
  const nowJsonMetadata = parseNowJSON(nowJson)

  const meta = options.metadata || {}
  const metadata = { ...nowJsonMetadata, ...meta }

  // Check if we should default to a static deployment
  if (!metadata.builds && !metadata.version && !metadata.name) {
    metadata.builds = [{ src: "**", use: "@now/static" }]
    metadata.version = 2
    metadata.name = options.totalFiles === 1 ? 'file' : getDefaultName(options.path, options.isDirectory, files)

    yield { type: 'default-to-static', payload: metadata }
  }

  if (!metadata.name) {
    metadata.name = options.defaultName || getDefaultName(options.path, options.isDirectory, files)
  }

  if (metadata.version !== 2) {
    yield {
      type: 'error',
      payload: { code: 'unsupported_version', message: 'Only Now 2.0 deployments are supported. Specify `version: 2` in your now.json and try again' }
    }

    return
  }

  for await(const event of createDeployment(metadata, files, options)) {
    yield event
  }

  // TODO: State change polling
}
