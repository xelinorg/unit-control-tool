#!/usr/bin/env node

// start libs
const hunit = process.env.UCT_MODE ? require(process.env.UCT_MODE) : require('http')
const https = require('https')
const fs = require('fs')
const { exec } = require('child_process')
// end libs

// start config constants
const port = process.env.UCT_MODE !== 'unit-http' && process.env.UCT_PORT ? parseInt(process.env.UCT_PORT) : -1
const unitUser = 'unit'
const rootDir = '/tmp'
const workDir = '/www/work'
const workerExecutable = 'unit-wrap.js'
const execExtension = '.js'
const externalApp = 'external'
const deployResource = '/control/deploy/'
const appConfig = '/config/applications'
const appPrefix = 'applications/'
const listenersConfig = '/config/listeners'

const helloMsg = 'Hello, Node.js on Unit!'
const successMsg = 'has been deployed!'
const httpMsg = 'listening on port '.concat(port)
const unitHttpMsg = 'expose your desired port on unit config'
const contentLengthHeader = 'Content-Length'
const appgenHeader = 'X-APPGEN'

const fslash = '/'
const space = ' '
const nochar = ''
const exclamMark = '!'
const colon = ':'
const asterisk = '*'
const dot = '.'
const newLine = '\n'
const escapeQuote = '\''
const fslashRe = /^(\/)/

const port1024 = 1024
const topPort = 36963
const twoHundred = 200
const fiveHundred = 500
const contentTypeHash = 'Content-Type'
const contetTypeTxtPlain = { [contentTypeHash]: 'text/plain' }
const method = {
  POST: 'POST',
  PUT: 'PUT',
  HEAD: 'HEAD'
}
const event = {
  data: 'data',
  end: 'end',
  error: 'error'
}

const curl = 'curl -s'
const unixSocket = '--unix-socket /var/run/control.unit.sock'
const host = 'http://localhost'
const curlDataFlag = ' -d '
const xput = ' -X '.concat(method.PUT)
// end config constants

// runtime start
let portCount = 36936
// runtime end

// start config function
const getPath = loc => loc.slice(loc.indexOf(fslash))
const getHost = loc => loc.replace(getPath(loc), nochar).replace(fslash, nochar)
const getFilename = reqPath =>
  getPath(reqPath)
    .replace(fslashRe, nochar)
    .slice(reqPath.lastIndexOf(fslash), reqPath.length)
const isDeployRequest = (reqMethod, reqPath) =>
  reqMethod.toUpperCase() === method.POST &&
  reqPath.indexOf(deployResource) === 0 &&
  deployResource.length < reqPath.length
const isInfoRequest = reqMethod => reqMethod.toUpperCase() === method.HEAD
const getAppgen = () => process.env.UCT_APPGEN
const encodeCurlData = dt => [
  curlDataFlag,
  escapeQuote,
  JSON.stringify(dt),
  escapeQuote
].join(nochar)
const genAppConf = name => (
  {
    type: externalApp,
    working_directory: workDir,
    executable: workerExecutable,
    environment: {
      UCT_APPGEN: '0',
      UCT_DISFUN: rootDir.concat(fslash, name.concat(execExtension))
    },
    user: unitUser
  }
)
const genListenerConf = pass => (
  {
    pass: appPrefix.concat(pass)
  }
)
const nextPort = () => {
  if (portCount < topPort) portCount += 1
  return portCount
}
// end config function

// start get function from network
const getDisFun = (disFunLoc, cb) => {
  const options = {
    host: getHost(disFunLoc),
    path: getPath(disFunLoc)
  }

  const callback = (response) => {
    let str = nochar
    response.on(event.data, (chunk) => {
      str += chunk
    })

    response.on(event.end, () => {
      return cb(null, str)
    })

    response.on(event.error, resErr => {
      return cb(resErr)
    })
  }

  const req = https.request(options, callback)
  req.end()
}
// end get function from network

// start persist function on filesystem
const persistDisFun = (outLoc, disFunStream, cb) => {
  return fs.writeFile(rootDir.concat(fslash, outLoc), disFunStream, (err) => {
    if (err) return cb(err)
    return cb(null)
  })
}
// end persist function on filesystem

// start deploy
const deployDisFun = (filename, cb) => {
  if (!getAppgen()) {
    return cb(null, filename)
  }
  const chain = []
  const appname = filename.split(dot)[0]
  const showUnit = curl.concat(space, unixSocket, space, host)
  exec(showUnit, (suerror, sustdout, sustderr) => {
    if (suerror) return cb(suerror)
    if (sustderr) return cb(sustderr)
    chain.push(sustdout)
    const unitapp = curl.concat(
      space,
      xput,
      space,
      encodeCurlData(genAppConf(appname)),
      space,
      unixSocket,
      space,
      host.concat(appConfig, fslash, appname)
    )
    return exec(unitapp, (uaerror, uastdout, uastderr) => {
      chain.push(uastdout)
      if (uaerror) return cb(uaerror)
      if (uastderr) return cb(uastderr)
      const unitlistener = curl.concat(
        space,
        xput,
        space,
        encodeCurlData(genListenerConf(appname)),
        space,
        unixSocket,
        space,
        host.concat(listenersConfig, fslash, asterisk.concat(colon, nextPort()))
      )
      return exec(unitlistener, (ulerror, ulstdout, ulstderr) => {
        chain.push(ulstdout)
        if (ulerror) return cb(ulerror)
        if (ulstderr) return cb(ulstderr)
        return cb(null, { [appname]: chain })
      })
    })
  })
}
// end deploy

// start main
const srv = hunit.createServer((req, res) => {
  if (getAppgen() && isInfoRequest(req.method)) {
    res.setHeader(appgenHeader, getAppgen())
    res.setHeader(contentLengthHeader, 0)
    res.writeHead(twoHundred, contetTypeTxtPlain)
    return res.end()
  }

  if (req.url && isDeployRequest(req.method, req.url)) {
    return getDisFun(req.url.replace(deployResource, nochar), (getErr, getRes) => {
      if (getErr) {
        res.writeHead(fiveHundred, contetTypeTxtPlain)
        return res.end(getErr)
      }
      const filename = getFilename(req.url)
      return persistDisFun(filename, getRes, (persistErr, persistRes) => {
        if (persistErr) {
          res.writeHead(fiveHundred, contetTypeTxtPlain)
          return res.end(persistErr)
        }
        return deployDisFun(filename, (depErr, depRes) => {
          if (depErr) {
            res.writeHead(fiveHundred, contetTypeTxtPlain)
            return res.end(depErr)
          }
          res.writeHead(twoHundred, contetTypeTxtPlain)
          return res.end(helloMsg.replace(exclamMark).concat(space, successMsg, newLine, JSON.stringify(depRes)))
        })
      })
    })
  } else {
    res.writeHead(twoHundred, contetTypeTxtPlain)
    return res.end(helloMsg)
  }
})
// end main

// listen
if (port > port1024) {
  srv.listen(port)
} else {
  srv.listen()
}

console.log(port > port1024 ? httpMsg : unitHttpMsg)
