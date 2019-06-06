import { DeploymentFile } from './hashes'
import { parse as parseUrl } from 'url'
import { fetch as fetch_ } from 'fetch-h2'
import retry from 'async-retry'
import { readFile } from 'fs-extra'
import { join } from 'path'
import qs from 'querystring'
import pkg from '../../package.json'
import { DeploymentError } from '..'

export const API_FILES = 'https://api.zeit.co/v2/now/files'
export const API_DEPLOYMENTS = 'https://api.zeit.co/v9/now/deployments'

export const EVENTS = new Set([
  // File events
  'hashes-calculated',
  'file-uploaded',
  'all-files-uploaded',
  // Deployment events
  'default-to-static',
  'created',
  'deployment-state-changed',
  'ready',
  'error',
  // Build events
  'build-state-changed',
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
  let ignores: string[] = [
    '.hg',
    '.git',
    '.gitmodules',
    '.svn',
    '.cache',
    '.next',
    '.now',
    '.npmignore',
    '.dockerignore',
    '.gitignore',
    '.*.swp',
    '.DS_Store',
    '.wafpicke-*',
    '.lock-wscript',
    '.env',
    '.env.build',
    '.venv',
    'npm-debug.log',
    'config.gypi',
    'node_modules',
    '__pycache__/',
    'venv/',
    'CVS',
  ]

  await Promise.all(files.map(async (file: string): Promise<void> => {
    if (file.includes('.nowignore')) {
      const filePath = Array.isArray(path)
        ? file
        : file.includes(path)
          ? file
          : join(path, file)
      const nowIgnore = await readFile(filePath)

      nowIgnore
        .toString()
        .split('\n')
        .filter((s: string): boolean => s.length > 0)
        .forEach((entry: string): number => ignores.push(entry))
    }
  }))

  return ignores
}

export const fetch = (url: string, token: string, opts: any = {}): Promise<any> => {
  if (opts.teamId) {
    const parsedUrl = parseUrl(url, true)
    const query = parsedUrl.query

    query.teamId = opts.teamId
    url = `${parsedUrl.href}?${qs.encode(query)}`
    delete opts.teamId
  }

  opts.headers = opts.headers || {}
  // @ts-ignore
  opts.headers.authorization = `Bearer ${token}`
  // @ts-ignore
  opts.headers['user-agent'] = `now-client-v${pkg.version}`

  return retry(async (bail): Promise<any> => {
    const res = await fetch_(url, opts)

    if (res.status === 200) {
      return res
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
}