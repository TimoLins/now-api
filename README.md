# now client


[![Build Status](https://travis-ci.org/zeit/now-client.svg?branch=master)](https://travis-ci.org/zeit/now-client) [![Join the community on Spectrum](https://withspectrum.github.io/badge/badge.svg)](https://spectrum.chat/zeit)

The official Node.js client for deploying to [Now](https://zeit.co/now).

## Usage

Firstly, install the package:

```bash
npm install now-client
# or
yarn add now-client
```

Next, load it:

```js
const createDeployment = require('now-client')
```

Then call it with the files you want to deploy:

- `<files>` - a directory path / file path / array of file paths (must be on the same level)
- `<options>` - An object containing `token`, an optional `teamId` and any `now.json`-valid [fields](https://zeit.co/docs/api#endpoints/deployments/create-a-new-deployment)

```js
const deployment = await createDeployment('/Users/zeit-user/projects/front', { token: process.env.TOKEN })
```

Lastly, subscribe to events you're interested in:

```js
deployment.on('ready', onReady)
deployment.on('error', console.error)
```

Full list of events:

```js
[
  // File events (receive relevant data as payload)
  'hashes-calculated',
  'upload-progress',
  'file-uploaded',
  'all-files-uploaded',
  // Deployment events (receive deployment object as payload, except `default-to-static`)
  'default-to-static', // Receives `now.json`-compliant config object
  'created',
  'deployment-created',
  'deployment-state-changed',
  'ready',
  'error',
  // Build events (receive build object as payload)
  'build-state-changed',
  'build-ready',
]
```

You can also get the events set programmatically:

```js
import { EVENTS } from 'now-client'
```

