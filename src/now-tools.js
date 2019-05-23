import ignore from 'ignore'

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
  
    reader.onerror = reject
    reader.onload = (e) => {
      resolve(e.target.result)
    }
  
    reader.readAsText(file)
  })
}

export function parseNowJSON(data) {
  try {
    const jsonString = String.fromCharCode.apply(null, new Uint8Array(data))

    return JSON.parse(jsonString)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)

    return {}
  }
}

export async function getNowIgnore(files) {
  const isArray = Array.isArray(files)
  for (let i = 0; i < files.length; i++) {
    const file = isArray ? files[i] : files.item(i)
    if (file.name === '.nowignore') {
      const contents = await readFile(file)

      const ig = ignore().add(contents.split('\n'))

      return ig
    }
  }

  return () => false
}