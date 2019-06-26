#!/usr/bin/env node
/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const CNAScript = require('../lib/abstract-script')

const path = require('path')

// todo work with built action
class ActionRunner extends CNAScript {
  async run (args) {
    // action Path
    const actionPath = path.resolve(args[0])
    delete require.cache[require.resolve(actionPath)] // make sure to reload the action
    const actionMain = require(actionPath).main

    // extract params
    const params = args.slice(1).reduce((prevObj, p) => {
      const kv = p.split('=')
      // support JSON
      try {
        prevObj[kv[0]] = JSON.parse(kv[1])
      } catch (e) {
        prevObj[kv[0]] = kv[1]
      }
      return prevObj
    }, {})

    console.error(`invoking with params: ${JSON.stringify(params)}`) // todo change to debug

    // run
    const res = JSON.stringify(await actionMain(params))

    // output on stdout
    console.log(res)
  }
}

CNAScript.runOrExport(module, ActionRunner)
