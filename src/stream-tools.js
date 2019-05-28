const noop = () => {}

const read = (file, binary) => new Promise(resolve => {
  const reader = new FileReader()

  reader.onload = resolve

  if (binary) {
    reader.readAsArrayBuffer(file)
  } else {
    reader.readAsText(file)
  }
})

/**
 * Read file in chunks as a stream
 *
 * @export
 * @param {File} file - File object
 * @param {object} options - Read options
 * @returns {ReadableStream}
 */
export function readFile(file, options = {}) {
  const {
    chunkSize = 1024,
    binary = true,
    onChunkError = noop,
    onSuccess = noop,
  } = options

  if (file.size <= chunkSize) {
    return read(file, binary)
  }

  let offset = 0

  const stream = new ReadableStream({
    start(controller) {
      // Read slice of the file and pass it to the handler
      const readBlock = (_offset, length, _file) => {
        const reader = new FileReader()
        const blob = _file.slice(_offset, length + _offset)
        
        reader.onload = onChunkHandler
        
        if (binary) {
          reader.readAsArrayBuffer(blob)
        } else {
          reader.readAsText(blob)
        }
      }

      // Handle chunk
      const onChunkHandler = evt => {
        if (evt.target.error == null) {
          offset += evt.target.result.length || evt.target.result.byteLength
          controller.enqueue(evt.target.result)
        } else {
          onChunkError(evt.target.error)
          return
        }
        if (offset >= file.size) {
          // If we're done reading the file, fire a success callback and close the stream
          onSuccess(file)
          controller.close()

          return
        }

        readBlock(offset, chunkSize, file)
      }

      readBlock(offset, chunkSize, file)
    }
  })

  return stream
}

/**
 * Concatenate two ArrayBuffers
 *
 * @export
 * @param {ArrayBuffer} buffer1
 * @param {ArrayBuffer} buffer2
 * @returns
 */
export function concatArrayBuffers(buffer1, buffer2) {
  if (!buffer1) {
    return buffer2
  } else if (!buffer2) {
    return buffer1
  }

  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)

  tmp.set(new Uint8Array(buffer1), 0)
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength)

  return tmp.buffer
}
