import { createHash } from 'crypto'
import fs from 'fs-extra'

export interface DeploymentFile {
  names: string[];
  data: Buffer;
}

/**
 * Computes a hash for the given buf.
 *
 * @param {Buffer} file data
 * @return {String} hex digest
 */
function hash(buf: Buffer): string {
  return createHash('sha1')
    .update(buf)
    .digest('hex')
}

/**
  * Computes hashes for the contents of each file given.
  *
  * @param {Array} of {String} full paths
  * @return {Map}
  */
async function hashes(files: string[]): Promise<Map<string, DeploymentFile>> {
  const map = new Map()

  await Promise.all(
    files.map(async (name: string): Promise<void> => {
      const data = await fs.readFile(name)

      const h = hash(data)
      const entry = map.get(h)

      if (entry) {
        entry.names.push(name)
      } else {
        map.set(hash(data), { names: [name], data })
      }
    })
  )

  return map
}

export default hashes