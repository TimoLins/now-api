const path = require('path')
const os = require('os')
const fs = require('fs')

module.exports = function () {
  let token = process.env.NOW_TOKEN

  if (!token) {
    try {
      const configPath = path.join(os.homedir(), '.now.json')
      const nowFileString = fs.readFileSync(configPath)
      token = JSON.parse(nowFileString).token
    } catch (err) {
      console.error(`Error: ${err}`)
    }
  }

  return token
}
