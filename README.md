# 𝚫 now client

[![Build Status](https://travis-ci.org/zeit/now-client.svg?branch=master)](https://travis-ci.org/zeit/now-client) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

Node.js module to interact with the official [𝚫 now API](https://zeit.co/api).

You need to provide your API token, which you can obtain [here](https://zeit.co/account#api-tokens).
It is possible to pass it as a parameter or with the `NOW_TOKEN` environment variable.
When no token is given, it will use the one contained in your `~/.now.json` file.

```sh
$ npm install --save now-client
```

## Examples

Here are a few snippets on how to use this package in your project:

### ES2015

```js
import nowClient from 'now-client'

const now = nowClient('YOUR TOKEN')

let deployments

try {
  deployments = await now.getDeployments()
} catch (err) {
  console.error(err)
}

console.log(deployments)
```

### Older ES

```js
const nowClient = require('now-client')
const now = nowClient('YOUR TOKEN')

// Supports Promises
now.getDeployments().then(deployments => {
  console.log(deployments)
}).catch(err => {
  console.error(err)
})
```

## API Reference

**Kind**: global class  

* [Now](#Now)
    * [new Now([token])](#new_Now_new)
    * [.getDeployments([callback])](#Now+getDeployments) ⇒ <code>Promise</code>
    * [.getDeployment(id, [callback])](#Now+getDeployment) ⇒ <code>Promise</code>
    * [.createDeployment(body, [callback])](#Now+createDeployment) ⇒ <code>Promise</code>
    * [.deleteDeployment(id, [callback])](#Now+deleteDeployment) ⇒ <code>Promise</code>
    * [.getFiles(id, [callback])](#Now+getFiles) ⇒ <code>Promise</code>
    * [.getFile(id, fileId, [callback])](#Now+getFile) ⇒ <code>Promise</code>
    * [.getDomains([callback])](#Now+getDomains) ⇒ <code>Promise</code>
    * [.addDomain(domain, [callback])](#Now+addDomain) ⇒ <code>Promise</code>
    * [.deleteDomain(name, [callback])](#Now+deleteDomain) ⇒ <code>Promise</code>
    * [.getCertificates([cn], [callback])](#Now+getCertificates) ⇒ <code>Promise</code>
    * [.createCertificate(cn, [callback])](#Now+createCertificate) ⇒ <code>Promise</code>
    * [.renewCertificate(cn, [callback])](#Now+renewCertificate) ⇒ <code>Promise</code>
    * [.replaceCertificate(cn, cert, key, [ca], [callback])](#Now+replaceCertificate) ⇒ <code>Promise</code>
    * [.deleteCertificate(cn, [callback])](#Now+deleteCertificate) ⇒ <code>Promise</code>
    * [.getAliases([id OR callback], [callback])](#Now+getAliases) ⇒ <code>Promise</code>
    * [.createAlias(id, alias, [callback])](#Now+createAlias) ⇒ <code>Promise</code>
    * [.deleteAlias(id, [callback])](#Now+deleteAlias) ⇒ <code>Promise</code>
    * [.getSecrets([id OR callback], [callback])](#Now+getSecrets) ⇒ <code>Promise</code>
    * [.createSecret(name, value, [callback])](#Now+createSecret) ⇒ <code>Promise</code>
    * [.renameSecret(id, name, [callback])](#Now+renameSecret) ⇒ <code>Promise</code>
    * [.deleteSecret(id, [callback])](#Now+deleteSecret) ⇒ <code>Promise</code>

<a name="new_Now_new"></a>

### new Now([token])
Initializes the API. Looks for token in ~/.now.json if none is provided.


| Param | Type | Description |
| --- | --- | --- |
| [token] | <code>String</code> | Your now API token. |

<a name="Now+getDeployments"></a>

### now.getDeployments([callback]) ⇒ <code>Promise</code>
Returns an array with all deployments.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#list-endpoint  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | Callback will be called with `(err, deployments)` |

<a name="Now+getDeployment"></a>

### now.getDeployment(id, [callback]) ⇒ <code>Promise</code>
Returns an object with deployment data.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#get-endpoint  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID of deployment |
| [callback] | <code>function</code> | Callback will be called with `(err, deployment)` |

<a name="Now+createDeployment"></a>

### now.createDeployment(body, [callback]) ⇒ <code>Promise</code>
Creates a new deployment and returns its data.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#instant-endpoint  

| Param | Type | Description |
| --- | --- | --- |
| body | <code>Object</code> | The keys should represent a file path, with their respective values containing the file contents. |
| [callback] | <code>function</code> | Callback will be called with `(err, deployment)` |

<a name="Now+deleteDeployment"></a>

### now.deleteDeployment(id, [callback]) ⇒ <code>Promise</code>
Deletes a deployment and returns its data.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#rm-endpoint  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID of deployment |
| [callback] | <code>function</code> | Callback will be called with `(err, deployment)` |

<a name="Now+getFiles"></a>

### now.getFiles(id, [callback]) ⇒ <code>Promise</code>
Returns an array with the file structure.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#file-structure-endpoint  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID of deployment |
| [callback] | <code>function</code> | Callback will be called with `(err, fileStructure)` |

<a name="Now+getFile"></a>

### now.getFile(id, fileId, [callback]) ⇒ <code>Promise</code>
Returns the content of a file either as string or object, depending on the filetype.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#file--endpoint  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID of deployment |
| fileId | <code>String</code> | ID of the file |
| [callback] | <code>function</code> | Callback will be called with `(err, fileContent)` |

<a name="Now+getDomains"></a>

## now.getDomains([callback])] ⇒ <code>Promise</code>
Returns an array with all domain names and related aliases.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#get-domains

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | Callback will be called with `(err, domains)` |

<a name="Now+addDomain"></a>

## now.addDomain(domain, [callback])] ⇒ <code>Promise</code>
Adds a new domain and returns its data.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#post.domains

| Param | Type | Description |
| --- | --- | --- |
| domain | <code>object</code> | An object containing a string `name` and a boolean `isExternalDNS` |
| [callback] | <code>function</code> | Callback will be called with `(err)` |

<a name="Now+deleteDomain"></a>

## now.deleteDomain(name, [callback])] ⇒ <code>Promise</code>
Deletes a domain name.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#delete-domains

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Domain name |
| [callback] | <code>function</code> | Callback will be called with `(err)` |

<a name="Now+getDomainRecords"></a>

## now.getDomainRecords(domain, [callback])] ⇒ <code>Promise</code>
Returns an array with all DNS records configured for a domain name.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#get-domain-records

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Domain name |
| [callback] | <code>function</code> | Callback will be called with `(err, domains)` |

## now.addDomainRecord(domain, recordData, [callback])] ⇒ <code>Promise</code>
Adds a new DNS record for a domain.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#post-domain-records

| Param | Type | Description |
| --- | --- | --- |
| domain | <code>object</code> | An object containing a string `name` and a boolean `isExternalDNS` |
| recordData | <code>object</code> | An object containing a description of the new record according to the [documentation](https://zeit.co/api#post-domain-records). |
| [callback] | <code>function</code> | Callback will be called with `(err)` |

<a name="Now+deleteDomainRecord"></a>

## now.deleteDomainRecord(name, recordId, [callback])] ⇒ <code>Promise</code>
Deletes a DNS record associated with a domain.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#delete-domain-records

| Param | Type | Description |
| --- | --- | --- |
| domain | <code>String</code> | Domain name |
| recordId | <code>String</code> | Record ID |
| [callback] | <code>function</code> | Callback will be called with `(err)` |

<a name="Now+getCertificates"></a>

## now.getCertificates([cn], [callback])] ⇒ <code>Promise</code>
Returns an array of all certificates.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#get-certs

| Param | Type | Description |
| --- | --- | --- |
| [cn] | <code>String</code> | Common Name |
| [callback] | <code>function</code> | Callback will be called with `(err, certs)` |

<a name="Now+createCertificate"></a>

## now.createCertificate(cn, [callback])] ⇒ <code>Promise</code>
Creates a new certificate for a domain registered to the user.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#post-certs

| Param | Type | Description |
| --- | --- | --- |
| cn | <code>String</code> | Common Name |
| [callback] | <code>function</code> | Callback will be called with `(err)` |

<a name="Now+renewCertificate"></a>
 
## now.renewCertificate(cn, [callback])] ⇒ <code>Promise</code>
Renews an existing certificate.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#post-certs

| Param | Type | Description |
| --- | --- | --- |
| cn | <code>String</code> | Common Name |
| [callback] | <code>function</code> | Callback will be called with `(err)` |
 
<a name="Now+replaceCertificate"></a>

## now.replaceCertificate(cn, cert, key, [ca], [callback])] ⇒ <code>Promise</code>
Replace an existing certificate.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#put-certs

| Param | Type | Description |
| --- | --- | --- |
| cn | <code>String</code> | Common Name |
| cert | <code>String</code> | X.509 certificate |
| key | <code>String</code> | Private key for the certificate |
| ca | <code>String</code> | CA certificate chain |
| [callback] | <code>function</code> | Callback will be called with `(err, created)` |

<a name="Now+deleteCertificate"></a>

## now.deleteCertificate(cn, [callback])] ⇒ <code>Promise</code>
Deletes a certificate.

**Kind**: instance method of <code>[Now](#Now)</code>
**See**: https://zeit.co/api#delete-certs

| Param | Type | Description |
| --- | --- | --- |
| cn | <code>String</code> | Common Name |
| [callback] | <code>function</code> | Callback will be called with `(err)` |

<a name="Now+getAliases"></a>

### now.getAliases([id OR callback], [callback]) ⇒ <code>Promise</code>
Returns an array with all aliases.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#user-aliases  

| Param | Type | Description |
| --- | --- | --- |
| [id OR callback] | <code>String</code> &#124; <code>function</code> | ID of deployment or callback |
| [callback] | <code>function</code> | Callback will be called with `(err, aliases)` |

<a name="Now+createAlias"></a>

### now.createAlias(id, alias, [callback]) ⇒ <code>Promise</code>
Creates an alias for the given deployment.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#create-alias  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID of deployment |
| alias | <code>String</code> | Hostname or custom url for the alias |
| [callback] | <code>function</code> | Callback will be called with `(err, data)` |

<a name="Now+deleteAlias"></a>

### now.deleteAlias(id, [callback]) ⇒ <code>Promise</code>
Deletes an alias and returns a status.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#delete-user-aliases  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID of alias |
| [callback] | <code>function</code> | Callback will be called with `(err, status)` |

<a name="Now+getSecrets"></a>

### now.getSecrets([id OR callback], [callback]) ⇒ <code>Promise</code>
Returns an array with all secrets.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#get-now-secrets  

| Param | Type | Description |
| --- | --- | --- |
| [id OR callback] | <code>String</code> &#124; <code>function</code> | ID of deployment or callback |
| [callback] | <code>function</code> | Callback will be called with `(err, secrets)` |

<a name="Now+createSecret"></a>

### now.createSecret(name, value, [callback]) ⇒ <code>Promise</code>
Creates a secret and returns its ID.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#post-now-secrets  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | name for the secret |
| value | <code>String</code> | value for the secret |
| [callback] | <code>function</code> | Callback will be called with `(err, data)` |

<a name="Now+renameSecret"></a>

### now.renameSecret(id, name, [callback]) ⇒ <code>Promise</code>
Changes the name of the given secret and returns its ID and name.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#patch-now-secrets  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id or name of the secret |
| name | <code>String</code> | new name for the secret |
| [callback] | <code>function</code> | Callback will be called with `(err, data)` |

<a name="Now+deleteSecret"></a>

### now.deleteSecret(id, [callback]) ⇒ <code>Promise</code>
Deletes a secret and returns its ID.

**Kind**: instance method of <code>[Now](#Now)</code>  
**See**: https://zeit.co/api#delete-now-secrets  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID or name of the secret |
| [callback] | <code>function</code> | Callback will be called with `(err, status)` |
