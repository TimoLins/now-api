import { createReadStream } from 'fs'
import { DeploymentFile } from './utils/hashes'
import { API_FILES, fetch } from './utils'
import { DeploymentError } from '.'

export default async function* upload(files: Map<string, DeploymentFile>, token: string, teamId?: string): AsyncIterableIterator<any> {
  if (!files && !token && !teamId) {
    return
  }

  const shas = [...files.keys()]
  const uploadList: { [key: string]: Promise<any> } = {}

  shas.map((sha: string): void => {
    uploadList[sha] = new Promise(async (resolve): Promise<void> => {
      const file = files.get(sha)

      if (!file) {
        return
      }

      const fPath = file.names[0]
      const stream = createReadStream(fPath)
      const { data } = file

      const fstreamPush = stream.push

      let uploadedSoFar = 0
      // let lastEvent = 0

      stream.push = (chunk: any): boolean => {
        // If we're about to push the last chunk, then don't do it here
        // But instead, we'll "hang" the progress bar and do it on 200
        if (chunk && uploadedSoFar + chunk.length < data.length) {
          uploadedSoFar += chunk.length
          // semaphore.release()
        }

        return fstreamPush.call(stream, chunk)
      }

      // while (uploadedSoFar !== file.data.length) {
      //   await semaphore.acquire()
      
      //   lastEvent = uploadedSoFar;
      //   yield uploadedSoFar;
      // }

      try {
        await fetch(API_FILES, token, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-now-digest': sha,
            'x-now-length': data.length,
          },
          body: stream,
          teamId
        })

        stream.close()
        
        resolve({
          type: 'file-uploaded',
          payload: { sha, file }
        })
      } catch (e) {
        stream.close()
        throw new DeploymentError(e)
      }
    })
  })
  
  while (Object.keys(uploadList).length > 0) {
    const event = await Promise.race(Object.keys(uploadList).map((key): Promise<any> => uploadList[key]))
    
    delete uploadList[event.payload.sha]
    yield event
  }

  return
}