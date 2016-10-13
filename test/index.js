import chai from 'chai'
import {describe} from 'ava-spec'
import test from 'ava'
import Now from '../dist'

const should = chai.should()
const TOKEN = process.env.TEST_NOW_TOKEN

if (!TOKEN) {
  throw new Error('now token not provided')
}

const now = new Now(TOKEN)

const createDeployment = () => {
  return now.createDeployment({
    package: {
      name: 'test-deployment',
      scripts: {
        start: 'node index'
      }
    },
    'index.js': 'console.log("Unit Test!")'
  })
}

let deployData
let instanceId

test.before(async () => { // eslint-disable-line ava/no-async-fn-without-await
  // minimalises number of created deployments
  // per test-run since the monthly limit is
  // 20 deploys/mo for OSS plan
  deployData = await createDeployment()
  instanceId = deployData.uid
})

describe('Now', it => {
  it('should create deployment', async () => {
    deployData.should.be.an('object')
  })

  it('should retrieve deployments', async () => {
    const data = await now.getDeployments()
    data.should.be.an('array')
  })

  it('should return error on timeout (and other network errors)', async () => {
    try {
      const nowWithShortTimeout = new Now(TOKEN)
      nowWithShortTimeout.axios.defaults.timeout = 1
      await nowWithShortTimeout.getDeployments()
      throw new Error('promise should be rejected due to timeout')
    } catch (err) {
      err.should.be.a('string')
    }
  })

  it('should retrieve deployments via callback', () => {
    now.getDeployments((err, data) => {
      if (err) {
        throw new Error(err.message)
      }

      data.should.be.an('array')
    })
  })

  it('should retrieve single deployment', async () => {
    const data = await now.getDeployment(instanceId)
    data.should.be.an('object')
  })

  it('should retrieve file list from deployment', async () => {
    const data = await now.getFiles(instanceId)
    data.should.be.an('array')
    const file = data[0]
    file.type.should.be.a('string')
  })

  it('should retrieve file content from deployment', async () => {
    const fileData = await now.getFiles(instanceId)
    const fileId = fileData[0].uid
    const data = await now.getFile(instanceId, fileId)
    // It seems like this can return a String or an object, depending on which file you are trying to get.
    // This will only test if the data is present, without doing any checks with it.
    // Improvments are welcome!
    should.exist(data)
  })

  it('should create alias', async () => {
    const data = await now.createAlias(instanceId, `${instanceId}.now.sh`)
    data.should.be.an('object')
    const aliasId = data.uid
    aliasId.should.be.a('string')
  })

  it('should retrieve aliases', async () => {
    const data = await now.getAliases()
    data.should.be.an('array')
  })

  it('should retrieve aliases via callback', () => {
    now.getAliases((err, data) => {
      if (err) {
        throw new Error(err.message)
      }

      data.should.be.an('array')
    })
  })

  it('should retrieve aliases from deployment', async () => {
    const {uid: aliasId} = await now.createAlias(instanceId, `${instanceId}.now.sh`)
    const data = await now.getAliases(instanceId)
    data.should.be.an('array')
    data[0].uid.should.equal(aliasId)
  })

  it('should remove alias', async () => {
    const {uid: aliasId} = await now.createAlias(instanceId, `${instanceId}.now.sh`)
    const data = await now.deleteAlias(aliasId)
    data.should.be.an('object')
    data.status.should.equal('SUCCESS')
  })

  it('should remove deployment', async () => {
    const data = await now.deleteDeployment(instanceId)
    data.should.be.an('object')
    data.uid.should.equal(instanceId)
    data.state.should.equal('DELETED')
  })

  it('should create secret', async () => {
    const data = await now.createSecret('test-secret', 'secret')
    data.uid.should.be.a('string')
  })

  it('should retrieve all secrets', async () => {
    const data = await now.getSecrets()
    data.should.be.an('array')
  })

  it('should rename secret', async () => {
    await now.createSecret('test-secret', 'secret')
    const data = await now.renameSecret('test-secret', 'test-secret-renamed')
    data.uid.should.be.a('string')
    data.oldName.should.equal('test-secret')
  })

  it('should remove secret', async () => {
    await now.createSecret('test-secret', 'secret')
    const data = await now.deleteSecret('test-secret')
    data.uid.should.be.a('string')
  })
})
