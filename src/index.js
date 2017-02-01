const path = require('path')
const os = require('os')

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
      const configPath = path.join(os.homedir(), '.now.json')
      token = require(configPath).token // eslint-disable-line global-require, import/no-dynamic-require
    } catch (err) {
      console.error(`Error: ${err}`)
    }
  }

  return token
}

const handleError = err => new Promise((resolve, reject) => reject(err))

class Now {
  constructor(token = _getToken()) {
    if (!token) {
      console.error(
        'No token found! ' +
        'Supply it as argument or use the NOW_TOKEN env variable. ' +
        '`~/.now.json` will be used, if it\'s found in your home directory.'
      )
    }

    this.request = request.defaults({
      baseUrl: 'https://api.zeit.co',
      timeout: 30000,
      json: true,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }

  async handleRequest(config, selector) {
    let res
    try {
      res = await this.request(config)
    } catch (err) {
      let errData
      if (err.data && err.data.err) {
        errData = err.data.err
      } else if (err.data) {
        errData = err.data
      } else {
        errData = err.toString()
      }
      throw errData
    }

    const data = selector ? res[selector] : res
    return data
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
      data: recordData
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
