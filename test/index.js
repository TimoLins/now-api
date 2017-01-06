const chai = require('chai')
const Now = require('../dist')

const should = chai.should()

const TOKEN = process.env.TEST_NOW_TOKEN

if (!TOKEN) {
  throw new Error('now token not provided')
}

describe('Now', function () {
  this.timeout(60000)

  const now = new Now(TOKEN)

  let instanceId
  let fileId
  let aliasId

  it('should create deployment', done => {
    now.createDeployment({
      package: {
        name: 'test-deployment',
        scripts: {
          start: 'node index'
        }
      },
      'index.js': 'console.log("Unit Test!")'
    })
    .then(data => {
      data.should.be.an('object')
      instanceId = data.uid
      done()
    })
    .catch(err => {
      throw new Error(err.message)
    })
  })

  it('should retrieve deployments', done => {
    now.getDeployments()
    .then(data => {
      data.should.be.an('array')
      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should return error on timeout (and other network errors)', done => {
    const nowWithShortTimeout = new Now(TOKEN)
    nowWithShortTimeout.request = nowWithShortTimeout.request.defaults({
      timeout: 1
    })
    nowWithShortTimeout.getDeployments().then(() => {
      throw new Error('promise should be rejected due to timeout')
    }).catch(err => {
      should.exist(err)
      done()
    })
  })

  it('should retrieve single deployment', done => {
    now.getDeployment(instanceId)
    .then(data => {
      data.should.be.an('object')
      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should retrieve file list from deployment', done => {
    now.getFiles(instanceId)
    .then(data => {
      data.should.be.an('array')
      const file = data[0]
      file.type.should.be.a('string')

      fileId = file.uid

      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should retrieve file content from deployment', done => {
    now.getFile(instanceId, fileId)
    .then(data => {
      // It seems like this can return a String or an object, depending on which file you are trying to get.
      // This will only test if the data is present, without doing any checks with it.
      // Improvments are welcome!
      should.exist(data)

      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should create alias', done => {
    now.createAlias(instanceId, `${instanceId}.now.sh`)
    .then(data => {
      data.should.be.an('object')
      aliasId = data.uid
      aliasId.should.be.a('string')
      done()
    })
    .catch(err => {
      throw new Error(err.message)
    })
  })

  it('should retrieve aliases', done => {
    now.getAliases()
    .then(data => {
      data.should.be.an('array')
      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should retrieve aliases from deployment', done => {
    now.getAliases(instanceId)
    .then(data => {
      data.should.be.an('array')
      data[0].uid.should.equal(aliasId)
      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should remove alias', done => {
    now.deleteAlias(aliasId)
    .then(data => {
      data.should.be.an('object')
      data.status.should.equal('SUCCESS')

      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should remove deployment', done => {
    now.deleteDeployment(instanceId)
    .then(data => {
      data.should.be.an('object')
      data.uid.should.equal(instanceId)
      data.state.should.equal('DELETED')

      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should create secret', done => {
    now.createSecret('test-secret', 'secret')
    .then(data => {
      data.uid.should.be.a('string')
      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should retrieve all secrets', done => {
    now.getSecrets()
    .then(data => {
      data.should.be.an('array')
      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should rename secret', done => {
    now.renameSecret('test-secret', 'test-secret-renamed')
    .then(data => {
      data.uid.should.be.a('string')
      data.oldName.should.equal('test-secret')
      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })

  it('should remove secret', done => {
    now.deleteSecret('test-secret-renamed')
    .then(data => {
      data.uid.should.be.a('string')
      done()
    }).catch(err => {
      throw new Error(err.message)
    })
  })
})
