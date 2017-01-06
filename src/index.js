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

/**
 * Tries to obtain the API token and returns it.
 * If NOW_TOKEN isn't defined, it will search in the user's home directory
 * @return {String} – now API Token
 */
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

/**
 * Initializes the API. Looks for token in ~/.now.json if none is provided.
 * @constructor
 * @param {String} [token] - Your now API token.
 */
function Now(token = _getToken()) {
  if (!token) {
    return console.error(
      'No token found! ' +
      'Supply it as argument or use the NOW_TOKEN env variable. ' +
      '`~/.now.json` will be used, if it\'s found in your home directory.'
    )
  }

  if (!(this instanceof Now)) {
    return new Now(token)
  }

  this.token = token

  this.request = request.defaults({
    baseUrl: 'https://api.zeit.co',
    timeout: 30000,
    json: true,
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

Now.prototype = {
  // Handles errors with a Promise
  handleError(err) {
    return new Promise((resolve, reject) => {
      reject(err)
    })
  },

  // Processes requests
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
  },

  /**
   * Returns an array with all deployments.
   * @return {Promise}
   * @see https://zeit.co/api#list-endpoint
   */
  getDeployments() {
    return this.handleRequest({
      url: '/now/deployments',
      method: 'get'
    }, 'deployments')
  },

  /**
   * Returns an object with deployment data.
   * @return {Promise}
   * @param  {String} id     ID of deployment
   * @see https://zeit.co/api#get-endpoint
   */
  getDeployment(id) {
    if (!id) {
      return this.handleError(ERROR.MISSING_ID)
    }

    return this.handleRequest({
      url: `/now/deployments/${id}`,
      method: 'get'
    })
  },

  /**
   * Creates a new deployment and returns its data.
   * @return {Promise}
   * @param  {Object} body
   * The keys should represent a file path, with their respective values
   * containing the file contents.
   * @see https://zeit.co/api#instant-endpoint
   */
  createDeployment(body) {
    if (!body) {
      return this.handleError(ERROR.MISSING_BODY)
    }

    return this.handleRequest({
      url: '/now/deployments',
      method: 'post',
      body
    })
  },

  /**
   * Deletes a deployment and returns its data.
   * @return {Promise}
   * @param  {String} id     ID of deployment
   * @see https://zeit.co/api#rm-endpoint
   */
  deleteDeployment(id) {
    if (!id) {
      return this.handleError(ERROR.MISSING_ID)
    }

    return this.handleRequest({
      url: `/now/deployments/${id}`,
      method: 'delete'
    })
  },

  /**
   * Returns an array with the file structure.
   * @return {Promise}
   * @param  {String} id     ID of deployment
   * @see https://zeit.co/api#file-structure-endpoint
   */
  getFiles(id) {
    if (!id) {
      return this.handleError(ERROR.MISSING_ID)
    }

    return this.handleRequest({
      url: `/now/deployments/${id}/files`,
      method: 'get'
    })
  },

  /**
   * Returns the content of a file either as string or object, depending on the filetype.
   * @return {Promise}
   * @param  {String} id     ID of deployment
   * @param  {String} fileId     ID of the file
   * @see https://zeit.co/api#file--endpoint
   */
  getFile(id, fileId) {
    if (!id) {
      return this.handleError(ERROR.MISSING_ID)
    }

    if (!fileId) {
      return this.handleError(ERROR.MISSING_FILE_ID)
    }

    return this.handleRequest({
      url: `/now/deployments/${id}/files/${fileId}`,
      method: 'get'
    })
  },

  /**
   * Returns an array with all domain names and related aliases.
   * @return {Promise}
   */
  getDomains() {
    return this.handleRequest({
      url: '/domains',
      method: 'get'
    }, 'domains')
  },

  /**
   * Adds a new domain and returns its data.
   * @return {Promise}
   * @param  {Object} domain           Object with `name` and `isExternalDNS`
   * If `isExternalDNS` is falsy then an external DNS server should point a
   * CNAME or an ALIAS  to alias.zeit.co; if `isExternalDNS` is truthy then
   * zeit.world should be configured as the DNS for the domain.
   */
  addDomain(domain) {
    if (typeof domain.name !== 'string') {
      return this.handleError(ERROR.MISSING_NAME)
    }

    return this.handleRequest({
      url: '/domains',
      method: 'post',
      body: {
        name: domain.name,
        isExternal: domain.isExternalDNS
      }
    })
  },

  /**
   * Deletes a domain name.
   * @return {Promise}
   * @param  {String} name             Domain name
   * @see https://zeit.co/api#rm-endpoint
   */
  deleteDomain(name) {
    if (typeof name !== 'string') {
      return this.handleError(ERROR.MISSING_NAME)
    }

    return this.handleRequest({
      url: `/domains/${name}`,
      method: 'delete'
    })
  },

  /**
   * Get DNS records configured for a domain name.
   * @return {Promise}
   * @param  {String} domain          Domain name
   */
  getDomainRecords(domain) {
    return this.handleRequest({
      url: `/domains/${domain}/records`,
      method: 'get'
    }, 'records')
  },

  /**
   * Add a DNS record for a domain name.
   * @return {Promise}
   * @param  {String} domain          Domain name
   * @param  {Object} recordData      Record data
   */
  addDomainRecord(domain, recordData) {
    return this.handleRequest({
      url: `/domains/${domain}/records`,
      method: 'post',
      data: recordData
    })
  },

  /**
   * Remove a DNS record associated with a domain.
   * @return {Promise}
   * @param {String} domain           Domain name
   * @param {String} recordId         Record ID
   */
  deleteDomainRecord(domain, recordId) {
    return this.handleRequest({
      url: `/domains/${domain}/records/${recordId}`,
      method: 'delete'
    })
  },

  /**
   * Returns an array of all certificates.
   * @return {Promise}
   * @param  {String} [cn]     Common name
   * @see https://zeit.co/api#user-aliases
   */
  getCertificates(cn) {
    let url = '/certs'

    if (cn) {
      url += `/now/${cn}`
    }

    return this.handleRequest({
      url,
      method: 'get'
    }, 'certs')
  },

  /**
   * Creates a new certificate for a domain registered to the user.
   * @return {Promise}
   * @param  {String} cn Common name
   */
  createCertificate(cn) {
    if (typeof cn !== 'string') {
      return this.handleError(ERROR.MISSING_CN, cn)
    }

    return this.handleRequest({
      url: '/now/certs',
      method: 'post',
      body: {
        domains: [cn]
      }
    })
  },

  /**
   * Renews an existing certificate.
   * @return {Promise}
   * @param  {String} cn               Common name
   */
  renewCertificate(cn) {
    if (typeof cn !== 'string') {
      return this.handleError(ERROR.MISSING_CN, cn)
    }

    return this.handleRequest({
      url: '/now/certs',
      method: 'post',
      body: {
        domains: [cn],
        renew: true
      }
    })
  },

  /**
   * Replace an existing certificate.
   * @return {Promise}
   * @param  {String} cn               Common name
   * @param  {String} cert             X.509 certificate
   * @param  {String} key              Private key for the certificate
   * @param  {String} [ca]             CA certificate chain
   */
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
  },

  /**
   * Deletes a certificate.
   * @return {Promise}
   * @param  {String} cn               Common name
   */
  deleteCertificate(cn) {
    if (typeof cn !== 'string') {
      return this.handleError(ERROR.MISSING_CN, cn)
    }

    return this.handleRequest({
      url: `/now/certs/${cn}`,
      method: 'delete'
    })
  },

  /**
   * Returns an array with all aliases.
   * @return {Promise}
   * @param  {String} [id]     ID of deployment
   * @see https://zeit.co/api#user-aliases
   */
  getAliases(id) {
    let url = '/aliases'

    if (id) {
      url = `/now/deployments/${id}/aliases`
    }

    return this.handleRequest({
      url,
      method: 'get'
    }, 'aliases')
  },

  /**
   * Creates an alias for the given deployment.
   * @return {Promise}
   * @param  {String} id     ID of deployment
   * @param  {String} alias     Hostname or custom url for the alias
   * @see https://zeit.co/api#create-alias
   */
  createAlias(id, alias) {
    if (!id) {
      return this.handleError(ERROR.MISSING_ID)
    }

    if (!alias) {
      return this.handleError(ERROR.MISSING_ALIAS)
    }

    return this.handleRequest({
      url: `/now/deployments/${id}/aliases`,
      method: 'post',
      body: {
        alias
      }
    })
  },

  /**
   * Deletes an alias and returns a status.
   * @return {Promise}
   * @param  {String} id     ID of alias
   * @see https://zeit.co/api#delete-user-aliases
   */
  deleteAlias(id) {
    if (!id) {
      return this.handleError(ERROR.MISSING_ID)
    }

    return this.handleRequest({
      url: `/now/aliases/${id}`,
      method: 'delete'
    })
  },

  /**
   * Returns an array with all secrets.
   * @return {Promise}
   * @see https://zeit.co/api#get-now-secrets
   */
  getSecrets() {
    return this.handleRequest({
      url: '/now/secrets',
      method: 'get'
    }, 'secrets')
  },

  /**
   * Creates a secret and returns its ID.
   * @return {Promise}
   * @param  {String} name     name for the secret
   * @param  {String} value     value for the secret
   * @see https://zeit.co/api#post-now-secrets
   */
  createSecret(name, value) {
    if (!name) {
      return this.handleError(ERROR.MISSING_NAME)
    }

    if (!value) {
      return this.handleError(ERROR.MISSING_VALUE)
    }

    return this.handleRequest({
      url: '/now/secrets',
      method: 'post',
      body: {
        name,
        value
      }
    })
  },

  /**
   * Changes the name of the given secret and returns its ID and name.
   * @return {Promise}
   * @param  {String} id     id or name of the secret
   * @param  {String} name     new name for the secret
   * @see https://zeit.co/api#patch-now-secrets
   */
  renameSecret(id, name) {
    if (!id) {
      return this.handleError(ERROR.MISSING_ID)
    }

    if (!name) {
      return this.handleError(ERROR.MISSING_NAME)
    }

    return this.handleRequest({
      url: `/now/secrets/${id}`,
      method: 'patch',
      body: {
        name
      }
    })
  },

  /**
   * Deletes a secret and returns its ID.
   * @return {Promise}
   * @param  {String} id     ID or name of the secret
   * @see https://zeit.co/api#delete-now-secrets
   */
  deleteSecret(id) {
    if (!id) {
      return this.handleError(ERROR.MISSING_ID)
    }

    return this.handleRequest({
      url: `/now/secrets/${id}`,
      method: 'delete'
    })
  }
}

module.exports = Now
