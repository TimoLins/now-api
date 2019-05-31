import { DeploymentFile } from "./hashes"
import { readFile } from "fs-extra"
import { join } from "path"

export const API_FILES = 'https://api.zeit.co/v2/now/files'
export const API_DEPLOYMENTS = 'https://api.zeit.co/v8/now/deployments'

export const EVENTS = new Set([
  // File events
  'hashes-calculated',
  'upload-progress',
  'file-uploaded',
  'all-files-uploaded',
  // Deployment events
  'default-to-static',
  'created',
  'deployment-created',
  'deployment-state-changed',
  'ready',
  'error',
  // Build events
  'build-state-changed',
  'build-ready',
])

export function parseNowJSON(file?: DeploymentFile): object {
  if (!file) {
    return {}
  }

  try {
    const jsonString = file.data.toString()

    return JSON.parse(jsonString)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)

    return {}
  }
}

export async function getNowIgnore(files: string[], path: string | string[]): Promise<string[]> {
  let ignores: string[] = []

  await Promise.all(files.map(async (file: string): Promise<void> => {
    if (file.includes('.nowignore')) {
      const filePath = Array.isArray(path)
        ? file
        : file.includes(path)
          ? file
          : join(path, file)
      const nowIgnore = await readFile(filePath)

      ignores = nowIgnore.toString().split('\n')
    }
  }))

  return ignores
}
