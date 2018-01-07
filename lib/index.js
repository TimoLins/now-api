// Native
const path = require('path')
const os = require('os')

// Packages
const request = require('request-promise-native')

const ERROR = {
  MISSING_ID: {
    code: 'missing_id',
    message: 'Missing `id` parameter'
  },
  MISSING_FILE_ID: {
    code: 'missing_file_id',
    message: 'Missing `fileId` parameter'
  },
  MISSING_BODY: {
    code: 'missing_body',
    message: 'Missing `body` parameter'
  },
  MISSING_CN: {
    code: 'missing_cn',
    message: 'Missing `cn` parameter'
  },
  MISSING_ALIAS: {
    code: 'missing_body',
    message: 'Missing `alias` parameter'
  },
  MISSING_NAME: {
    code: 'missing_name',
    message: 'Missing `name` parameter'
  },
  MISSING_VALUE: {
    code: 'missing_value',
    message: 'Missing `value` parameter'
  }
}

function _getToken() {
  let token = process.env.NOW_TOKEN

  if (!token) {
    try {
      const configPath = path.join(os.homedir(), '.now/auth.json')
      const { credentials } = require(configPath) // eslint-disable-line global-require, import/no-dynamic-require
      token = credentials.find(item => item.provider === 'sh').token
    } catch (err) {
      console.error(`Error: ${err}`)
    }
  }

  return token
}

const handleError = err => new Promise((resolve, reject) => reject(err))

class Now {
  constructor(token = _getToken(), teamId) {
    if (!token) {
      console.error(
        'No token found! ' +
        'Supply it as argument or use the NOW_TOKEN env variable. ' +
        '`~/.now/auth.json` will be used, if it\'s found in your home directory.'
      )
    }

    this.request = request.defaults({
      baseUrl: 'https://api.zeit.co',
      timeout: 30000,
      json: true,
      qs: {
        teamId
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }
  handleRequest(config, selector) {
    return new Promise((resolve, reject) => {
      this.request(config)
        .then(res => {
          const data = selector ? res[selector] : res
          resolve(data)
        })
        .catch(err => {
          let errData
          if (err.data && err.data.err) {
            errData = err.data.err
          } else if (err.data) {
            errData = err.data
          } else {
            errData = err.toString()
          }
          reject(errData)
        })
    })
  }
  getDeployments() {
    return this.handleRequest({
      url: '/now/deployments',
      method: 'get'
    }, 'deployments')
  }

  getDeployment(id) {
    if (!id) {
      return handleError(ERROR.MISSING_ID)
    }

    return this.handleRequest({
      url: `/now/deployments/${id}`,
      method: 'get'
    })
  }

  createDeployment(body) {
    if (!body) {
      return handleError(ERROR.MISSING_BODY)
    }

    return this.handleRequest({
      url: '/now/deployments',
      method: 'post',
      body
    })
  }

  deleteDeployment(id) {
    if (!id) {
      return handleError(ERROR.MISSING_ID)
    }

    return this.handleRequest({
      url: `/now/deployments/${id}`,
      method: 'delete'
    })
  }

  getFiles(id) {
    if (!id) {
      return handleError(ERROR.MISSING_ID)
    }

    return this.handleRequest({
      url: `/now/deployments/${id}/files`,
      method: 'get'
    })
  }

  getFile(id, fileId) {
    if (!id) {
      return handleError(ERROR.MISSING_ID)
    }

    if (!fileId) {
      return handleError(ERROR.MISSING_FILE_ID)
    }

    return this.handleRequest({
      url: `/now/deployments/${id}/files/${fileId}`,
      method: 'get'
    })
  }

  getDomains() {
    return this.handleRequest({
      url: '/domains',
      method: 'get'
    }, 'domains')
  }

  addDomain(domain) {
    if (typeof domain.name !== 'string') {
      return handleError(ERROR.MISSING_NAME)
    }

    return this.handleRequest({
      url: '/domains',
      method: 'post',
      body: {
        name: domain.name,
        isExternal: domain.isExternalDNS
      }
    })
  }

  deleteDomain(name) {
    if (typeof name !== 'string') {
      return handleError(ERROR.MISSING_NAME)
    }

    return this.handleRequest({
      url: `/domains/${name}`,
      method: 'delete'
    })
  }

  getDomainRecords(domain) {
    return this.handleRequest({
      url: `/domains/${domain}/records`,
      method: 'get'
    }, 'records')
  }

  addDomainRecord(domain, recordData) {
    return this.handleRequest({
      url: `/domains/${domain}/records`,
      method: 'post',
      body: recordData
    })
  }

  deleteDomainRecord(domain, recordId) {
    return this.handleRequest({
      url: `/domains/${domain}/records/${recordId}`,
      method: 'delete'
    })
  }

  getCertificates(cn) {
    let url = '/certs'

    if (cn) {
      url += `/now/${cn}`
    }

    return this.handleRequest({
      url,
      method: 'get'
    }, 'certs')
  }

  createCertificate(cn) {
    if (typeof cn !== 'string') {
      return handleError(ERROR.MISSING_CN, cn)
    }

    return this.handleRequest({
      url: '/now/certs',
      method: 'post',
      body: {
        domains: [cn]
      }
    })
  }

  renewCertificate(cn) {
    if (typeof cn !== 'string') {
      return handleError(ERROR.MISSING_CN, cn)
    }

    return this.handleRequest({
      url: '/now/certs',
      method: 'post',
      body: {
        domains: [cn],
        renew: true
      }
    })
  }

  replaceCertificate(cn, cert, key, ca) {
    return this.handleRequest({
      url: '/now/certs',
      method: 'put',
      body: {
        domains: [cn],
        ca,
        cert,
        key
      }
    }, 'created')
  }

  deleteCertificate(cn) {
    if (typeof cn !== 'string') {
      return handleError(ERROR.MISSING_CN, cn)
    }

    return this.handleRequest({
      url: `/now/certs/${cn}`,
      method: 'delete'
    })
  }

  getAliases(id) {
    let url = '/now/aliases'

    if (id) {
      url = `/now/deployments/${id}/aliases`
    }

    return this.handleRequest({
      url,
      method: 'get'
    }, 'aliases')
  }

  createAlias(id, alias) {
    if (!id) {
      return handleError(ERROR.MISSING_ID)
    }

    if (!alias) {
      return handleError(ERROR.MISSING_ALIAS)
    }

    return this.handleRequest({
      url: `/now/deployments/${id}/aliases`,
      method: 'post',
      body: {
        alias
      }
    })
  }

  deleteAlias(id) {
    if (!id) {
      return handleError(ERROR.MISSING_ID)
    }

    return this.handleRequest({
      url: `/now/aliases/${id}`,
      method: 'delete'
    })
  }

  getSecrets() {
    return this.handleRequest({
      url: '/now/secrets',
      method: 'get'
    }, 'secrets')
  }

  createSecret(name, value) {
    if (!name) {
      return handleError(ERROR.MISSING_NAME)
    }

    if (!value) {
      return handleError(ERROR.MISSING_VALUE)
    }

    return this.handleRequest({
      url: '/now/secrets',
      method: 'post',
      body: {
        name,
        value
      }
    })
  }

  renameSecret(id, name) {
    if (!id) {
      return handleError(ERROR.MISSING_ID)
    }

    if (!name) {
      return handleError(ERROR.MISSING_NAME)
    }

    return this.handleRequest({
      url: `/now/secrets/${id}`,
      method: 'patch',
      body: {
        name
      }
    })
  }

  deleteSecret(id) {
    if (!id) {
      return handleError(ERROR.MISSING_ID)
    }

    return this.handleRequest({
      url: `/now/secrets/${id}`,
      method: 'delete'
    })
  }
}

module.exports = Now
