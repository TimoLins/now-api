# now client


[![Build Status](https://travis-ci.org/zeit/now-client.svg?branch=master)](https://travis-ci.org/zeit/now-client) [![Join the community on Spectrum](https://withspectrum.github.io/badge/badge.svg)](https://spectrum.chat/next-js)

The official JavaScript client for interacting with the [Now Deployment API](https://zeit.co/api) from the web.

## Usage

Firstly, install the package:

```bash
npm install now-client
# or
yarn add now-client
```

Next, load it:

```js
import Deployment from 'now-client'
```

Then initialize it with the files you want to deploy:

- `<files>` a `FileInput` object received from file input or drop event
- `<token>` holds your token, which can obtained [here](https://zeit.co/account/tokens)
- `<metadata>` an object that holds `teamId` and [deployment metadata](https://zeit.co/docs/api#endpoints/deployments/create-a-new-deployment)

```js
const deployment = new Deployment(files, 'my_now_token', { teamId: null })
```

Lastly, create the deployment:

```js
const deploymentResult = await deployment.deploy()
```

## Methods

### `deployment.setMetadata({})`

Replaces the metadata object provided in the constructor

### `deployment.setFiles(FileInput)`

Replaces the files provided in the constructor

### `deployment.authenticate(token)`

Replaces the authentication token in the constructor

### `deployment.on('event', handler)`

Add event listener to one of the deployment events

| Event Name                  | When is it fired                                   |
| --------------------------- | -------------------------------------------------- |
| `created`                   | Deployment is created                              |
| `build-state-changed`       | One of the builds in the deployment changed status |
| `deployment-state-changed`  | Deployment's `readyState` has changed              |
| `ready`                     | Deployment has finished                            |

### `deployment.off('event', handler)`

Remove event listener

### `deployment.deploy()`

Create deployment and start listening to status changes
