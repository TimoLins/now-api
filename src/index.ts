import { readdir as readRootFolder, lstatSync } from 'fs-extra'

import readdir from 'recursive-readdir'
import hashes from './utils/hashes'
import Deployment from './deployment';
import { getNowIgnore } from './utils';

export class DeploymentError extends Error {
  constructor(err: { code: string; message: string }) {
    super(err.message)
    this.code = err.code
    this.name = 'DeploymentError'
  }

  code: string
}

export default async function createDeployment(path: string | string[], options: DeploymentOptions = {}): Promise<Deployment> {
  if (typeof path !== 'string' && !Array.isArray(path)) {
    throw new DeploymentError({
      code: 'missing_path',
      message: 'Path not provided'
    })
  }

  if (typeof options.token !== 'string') {
    throw new DeploymentError({
      code: 'token_not_provided',
      message: 'Options object must include a `token`'
    })
  }

  const isDirectory = !Array.isArray(path) && lstatSync(path).isDirectory()

  // Get .nowignore
  let rootFiles
  
  if (isDirectory && !Array.isArray(path)) {
    rootFiles = await readRootFolder(path)
  } else if (Array.isArray(path)) {
    rootFiles = path
  } else {
    rootFiles = [path]
  }
  
  let ignores: string[] = await getNowIgnore(rootFiles, path)

  let fileList

  if (isDirectory && !Array.isArray(path)) {
    // Directory path
    fileList = await readdir(path, ignores)
  } else if (Array.isArray(path)) {
    // Array of file paths
    fileList = path
  } else {
    // Single file
    fileList = [path]
  }

  const files = await hashes(fileList)

  const deployment = new Deployment(files, {
    ...options,
    path,
    isDirectory
  })

  deployment.deploy()

  return deployment
}
