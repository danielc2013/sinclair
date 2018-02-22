const req_factory = require('./src/request')
const yaml = require('js-yaml')
const fs = require('fs')

module.exports = (serviceNode, factorySource) => {
  let srcFile = factorySource || './sinclair.yml'
  let depMap = yaml.safeLoad(fs.readFileSync(srcFile))
  let exportVals = {}

  let svc = depMap.services[serviceNode]
  let service = require(`${svc.source}`)

  for (let exp in service) {
    exportVals[exp] = args => {
      let req = req_factory.request()

      req.on('send', () => {
        let p = svcPromise(service[exp], args)

        p
          .then(data => {
            req.emit('success', data)
          })
          .catch(err => {
            req.emit('error', err)
          })
      })

      return req
    }
  }

  return exportVals
}

function svcPromise(func, args) {
  return new Promise((resolve, reject) => {
    try {
      func(args, resolve)
    } catch (e) {
      reject(e)
    }
  })
}
