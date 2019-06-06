import { createReadStream } from 'fs'
import retry from 'async-retry'
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
    uploadList[sha] = retry(async (bail): Promise<any> => {
      const file = files.get(sha)

      if (!file) {
        return bail(new Error(`File ${sha} is undefined`))
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
        const res = await fetch(API_FILES, token, {
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

        if (res.status === 200) {
          return {
            type: 'file-uploaded',
            payload: { sha, file }
          }
        } else if (res.status > 200 && res.status < 500) {
          // If something is wrong with our request, we don't retry
          const { error } = await res.json()
          
          return bail(new DeploymentError(error))
        } else {
          // If something is wrong with the server, we retry
          const { error } = await res.json()
    
          throw new DeploymentError(error)
        }
      } catch (e) {
        stream.close()
        return bail(new Error(e))
      }
    },
    {
      retries: 3,
      randomize: true
    }
    )
  })
  
  while (Object.keys(uploadList).length > 0) {
    try {
      const event = await Promise.race(Object.keys(uploadList).map((key): Promise<any> => uploadList[key]))
      
      delete uploadList[event.payload.sha]
      yield event
    } catch (e) {
      return yield { type: 'error', payload: e }
    }
  }

  return
}