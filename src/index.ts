import { join } from 'path'
import { readdir as readRootFolder, readFile, lstatSync } from 'fs-extra'

import readdir from 'recursive-readdir'
import hashes from './utils/hashes'
import Deployment from './deployment';

export class DeploymentError extends Error {
  constructor(err: { code: string; message: string }) {
    super(err.message)
    this.code = err.code
    this.name = 'DeploymentError'
  }

  code: string
}

export default async function createDeployment(path: string, options: DeploymentOptions = {}): Promise<Deployment> {
  if (typeof path !== 'string' || !Array.isArray(path)) {
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

  // Get .nowignore
  const rootFiles = await readRootFolder(path)
  let ignores: string[] = []

  if (rootFiles.includes('.nowignore')) {
    const nowIgnore = await readFile(join(path, '.nowignore'))
    ignores = nowIgnore.toString().split('\n')
  }

  const isDirectory = !Array.isArray(path) || lstatSync(path).isDirectory()
  let fileList

  if (isDirectory) {
    fileList = await readdir(path, ignores)
  } else {
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
