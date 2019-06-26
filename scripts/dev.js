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

const express = require('express')
const execa = require('execa')

const Bundler = require('parcel-bundler')

const NODE_ACTION_RUNNER = path.join(__dirname, 'run.js')

class ActionServer extends CNAScript {
  async run (args) {
    const taskName = `Local Dev Server`
    this.emit('start', taskName)

    const port = args[0] || process.env.PORT || 9080

    const app = express()
    app.use(express.json())

    // dev env is needed to generate local actions
    process.env['NODE_ENV'] = process.env['NODE_ENV'] || 'development'

    // #### ACTIONS ####
    if (!this.config.actions.remote && process.env['NODE_ENV'] === 'development') {
      // todo make sure zip actions have their dependencies installed!
      // or even better run on built action (non minified for better debug)

      // todo modularize this in emulated invoker
      // should runner as dependency injection
      // should provide a middleware for express but also a non express run function
      app.all('/actions/*', async (req, res) => {
        // handle action
        const url = req.params[0]
        const actionName = req.params[0].split('/')[0]
        const requestPath = url.replace(actionName, '')

        const action = this.config.manifest.package.actions[actionName]
        if (!action) throw new Error(`Action ${actionName} is not defined in manifest file.`)

        // handle params
        const userParams = { ...req.query, ...(req.is('application/json') ? req.body : {}) }
        const defaultParams = { ...(action.inputs || {}) }
        const webParams = (action.web || action['web-export']) ? {
          __ow_body: req.body,
          __ow_headers: { ...req.headers, 'x-forwarded-for': '127.0.0.1' },
          __ow_path: requestPath,
          __ow_query: req.query,
          __ow_method: req.method.toLowerCase()
        } : {}
        const params = { ...userParams, ...defaultParams, ...webParams }
        const args = Object.keys({ ...params }).map(k => {
          const value = params[k]
          if (typeof value === 'object') return `${k}=${JSON.stringify(params[k])}`
          return `${k}=${params[k]}`
        })

        try {
          // output is clean on stdout
          let result = (await execa(NODE_ACTION_RUNNER, [action.function].concat(args))).stdout
          try {
            result = JSON.parse(result)
          } catch (e) {
            return res.status(500).send({ error: 'The action did not return an object.' })
          }

          // considering web actions here
          // if (typeof result === 'object') {
          // todo check if web
          return res
            .set(result.headers || {})
            .status(result.status || 200)
            .send(result.body || result)
        } catch (e) {
          return res.status(500).send({ error: e.message })
        }
      })
    }

    // #### UI ####
    await this._injectWebConfig()

    const bundler = new Bundler(path.join(this.config.web.src, 'index.html'), {
      cache: false,
      outDir: this.config.web.distDev,
      contentHash: false,
      watch: true,
      minify: false,
      logLevel: 0
    })
    app.use(bundler.middleware())

    app.listen(port)
    this.emit('progress', `local server running at http://localhost:${port}`)

    // todo send end event somehow on sigint
  }
}

CNAScript.runOrExport(module, ActionServer)
