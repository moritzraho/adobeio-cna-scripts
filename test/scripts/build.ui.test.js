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

const fs = require('fs-extra')
const CNAScripts = require('../..')

jest.mock('parcel-bundler')

let scripts
let buildDir
beforeAll(async () => {
  // mockFS
  await global.mockFS()
  // create test app
  const appDir = await global.createTestApp()
  await global.writeEnvTVM(appDir)
  await global.clearProcessEnv()

  scripts = await CNAScripts(appDir)
  buildDir = scripts._config.web.distProd
})

afterAll(async () => {
  await global.resetFS()
})

afterEach(async () => {
  // cleanup build files
  await fs.remove(buildDir)
})

test('Build static files: index.html', async () => {
  await scripts.buildUI()
  const buildFiles = await fs.readdir(buildDir)
  expect(buildFiles.sort()).toEqual(['index.html'])
})
