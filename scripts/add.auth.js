/* eslint camelcase: ["error", {properties: "never", allow: ["shared_namespace", "my_auth_package", "my_auth_seq_package", "base_url", "org_id", "technical_account_id", "meta_scopes" ]}] */
const CNAScript = require('../lib/abstract-script')
const fs = require('fs-extra')
const yaml = require('js-yaml')
const aioConfig = require('@adobe/aio-cli-config')

class AddAuth extends CNAScript {
  async run () {
    const taskName = `Add Auth`
    this.emit('start', taskName)
    this.aioConfig = aioConfig.get() || {}

    switch (this._getCustomConfig('ims_auth_type', 'code')) {
      case 'code':
        await this.addAuth(this.config.manifest.src)
        break
      case 'jwt':
        await this.addJWTAuth(this.config.manifest.src)
        break
      default:
        throw new Error(`Invalid value for property ims_auth_type. Allowed values are code and jwt.`)
    }

    this.emit('end', taskName)
  }
  async addAuth (manifestFile) {
    let manifest = yaml.safeLoad(fs.readFileSync(manifestFile, 'utf8'))
    let self = this
    return new Promise(function (resolve, reject) {
      let runtimeParams = self._getCustomConfig('runtime') || { namespace: 'change-me' }
      let namespace = runtimeParams.namespace
      let shared_namespace = self._getCustomConfig('shared_namespace', 'adobeio')
      let {
        client_id = 'change-me',
        client_secret = 'change-me',
        scopes = 'openid,AdobeID',
        base_url = 'https://adobeioruntime.net',
        redirect_url = 'https://www.adobe.com',
        cookie_path = namespace,
        persistence = false,
        my_auth_package = 'myauthp-shared',
        my_cache_package = 'mycachep-shared',
        my_auth_seq_package = 'myauthp'
      } = self._getCustomConfig('oauth', {})
      let persistenceBool = persistence && (persistence.toString().toLowerCase() === 'true' || persistence.toString().toLowerCase() === 'yes')
      if (persistenceBool) {
        // TODO : Get accessKeyId and secretAccessKey
      }

      // Adding sequence
      manifest.packages[my_auth_seq_package] = {
        sequences: {
          authenticate: {
            actions: persistenceBool
              ? my_auth_package + '/login,/' +
                                                              shared_namespace + '/cache/encrypt,/' +
                                                              shared_namespace + '/cache/persist,' +
                                                              my_auth_package + '/success'

              : my_auth_package + '/login,/' +
                                                              shared_namespace + '/cache/encrypt,' +
                                                              my_auth_package + '/success',
            web: 'yes'
          }
        }
      }
      // Adding package binding
      manifest.packages[my_auth_seq_package].dependencies = manifest.packages[my_auth_seq_package].dependencies || {}
      manifest.packages[my_auth_seq_package].dependencies[my_auth_package] = {
        location: '/' + shared_namespace + '/oauth',
        inputs: {
          auth_provider: 'adobe-oauth2',
          auth_provider_name: 'adobe',
          client_id: client_id,
          client_secret: client_secret,
          scopes: scopes,
          persistence: persistenceBool,
          callback_url: base_url + '/api/v1/web/' + namespace + '/' + my_auth_seq_package + '/authenticate',
          redirect_url: redirect_url,
          cookie_path: cookie_path,
          cache_namespace: namespace,
          cache_package: my_cache_package
        }
      }
      // TODO: Need to move this to Utils
      fs.writeFile(manifestFile, yaml.safeDump(manifest), (err) => {
        if (err) {
          reject(err)
        }
      })
      resolve()
    })
  }

  async addJWTAuth (manifestFile) {
    let manifest = yaml.safeLoad(fs.readFileSync(manifestFile, 'utf8'))
    let self = this
    return new Promise(function (resolve, reject) {
      let runtime = self._getCustomConfig('runtime') || { namespace: 'change-me' }
      let namespace = runtime.namespace
      let shared_namespace = self._getCustomConfig('shared_namespace', 'adobeio')
      let {
        client_id = 'change-me',
        client_secret = 'change-me',
        jwt_payload = {},
        jwt_private_key = 'change-me',
        persistence = false,
        my_auth_package = 'myjwtauthp-shared',
        my_cache_package = 'myjwtcachep-shared',
        my_auth_seq_package = 'myjwtauthp'
      } = self._getCustomConfig('jwt-auth', {})
      let technical_account_id = jwt_payload.sub || 'change-me'
      let org_id = jwt_payload.iss || 'change-me'
      let meta_scopes = Object.keys(jwt_payload).filter(key => key.startsWith('http') && jwt_payload[key] === true) || []
      let persistenceBool = persistence && (persistence.toString().toLowerCase() === 'true' || persistence.toString().toLowerCase() === 'yes')
      if (persistenceBool) {
        // TODO : Get accessKeyId and secretAccessKey
      }

      // Adding sequence
      manifest.packages[my_auth_seq_package] = {
        sequences: {
          authenticate: {
            actions: (persistenceBool ? my_auth_package + '/jwtauth,/adobeio/cache/persist'
              : my_auth_package + '/jwtauth'),
            web: 'yes'
          }
        }
      }
      // Adding package binding
      manifest.packages[my_auth_seq_package].dependencies = manifest.packages[my_auth_seq_package].dependencies || {}
      manifest.packages[my_auth_seq_package].dependencies[my_auth_package] = {
        location: '/' + shared_namespace + '/oauth',
        inputs: {
          jwt_client_id: client_id,
          jwt_client_secret: client_secret,
          technical_account_id: technical_account_id,
          org_id: org_id,
          meta_scopes: JSON.stringify(meta_scopes),
          private_key: JSON.stringify(jwt_private_key.split('\n')),
          persistence: persistenceBool,
          cache_namespace: namespace,
          cache_package: my_cache_package
        }
      }
      // TODO: Need to move this to Utils
      fs.writeFile(manifestFile, yaml.safeDump(manifest), (err) => {
        if (err) {
          reject(err)
        }
      })
      resolve()
    })
  }

  // TODO: Could move this to Utils
  _getCustomConfig (key, defaultValue) {
    return typeof (this.aioConfig[key]) !== 'undefined' ? this.aioConfig[key] : defaultValue
  }
}

module.exports = AddAuth
