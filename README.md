<!--
Copyright 2018 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
-->

[![Version](https://img.shields.io/npm/v/@adobe/io-cna-scripts.svg)](https://npmjs.org/package/@adobe/io-cna-scripts)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/io-cna-scripts.svg)](https://npmjs.org/package/@adobe/io-cna-scripts)
[![Build Status](https://travis-ci.com/adobe/adobeio-cna-scripts.svg?branch=master)](https://travis-ci.com/adobe/adobeio-cna-scripts)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) [![Greenkeeper badge](https://badges.greenkeeper.io/adobe/adobeio-cna-scripts.svg)](https://greenkeeper.io/)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/adobe/adobeio-cna-scripts/master.svg?style=flat-square)](https://codecov.io/gh/adobe/adobeio-cna-scripts/)


# CNA Scripts

The module implementing the Adobe I/O CNA scripts

## Include as a library in your nodejs project

```bash
npm i --save @adobe/io-cna-scripts
```

```js
const cnaScripts = require('@adobe/io-cna-scripts')({
  listeners: {
    onStart: taskName => console.error(`${taskName} ...`),
    onEnd: (taskName, res) => { console.error(`${taskName} done!`); if (res) console.log(res) },
    onWarning: warning => console.error(warning),
    onProgress: item => console.error(`  > ${item}`)
  }
})

cnaScripts.buildUI()
  .then(cnaScripts.buildActions)
  .then(cnaScripts.deployActions)
  .then(cnaScripts.deployUI)
  .catch(e => { console.error(e); process.exit(1) })
```

## Install globally to run directly
_note this interface is experimental and may disappear in the future_

```bash
npm i -g @adobe/io-cna-scripts
```
Commands:

```bash
cna-scripts build.actions
cna-scripts build.ui
cna-scripts deploy.actions
cna-scripts deploy.ui
cna-scripts undeploy.actions
cna-scripts undeploy.ui
```

## Using cna-scripts for local dev

> **Requires docker!**

- run dev server, this will spin up a local OpenWhisk stack and run a small
  express server for the frontend

```bash
   cna-scripts dev
```

- only run frontend server, the frontend will point to remotely deployed actions

```bash
   REMOTE_ACTIONS=true cna-scripts dev
```

### Debugging with VS Code

> **Requires wskdebug which is not yet publicly available!**

- Actions can be debugged in both with local dev and remote actions dev modes

- Simply start the dev server `cna-scripts dev`, this will generate all needed
  vscode debug configurations

- Then start the vs code debugger from the configuration you want, i.e. choose
  `WebAndActions` to debug all actions and UI simultaneously or choose separate
  debuggers.

- When you stop the dev server all vs code configurations are cleaned up and
  restored.

## Contributing

Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
