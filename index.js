#!/usr/bin/env node

// start libs
const hunit = process.env.UCT_MODE ? require(process.env.UCT_MODE) : require('http')
const https = require('https')
const fs = require('fs')
const { exec } = require('child_process')
// end libs

// start config constants
const port = process.env.UCT_MODE !== 'unit-http' && process.env.UCT_PORT ? parseInt(process.env.UCT_PORT) : -1
const rootDir = '/tmp'
const deployResource = '/control/deploy/'

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
const newLine = '\n'
const fslashRe = /^(\/)/

const port1024 = 1024
const twoHundred = 200
const fiveHundred = 500
const contetTypeTxtPlain = { 'Content-Type': 'text/plain' }
const method = {
  POST: 'POST',
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
// end config constants

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
  if (!process.env.APPGEN) {
    return cb(null, filename)
  }
  const showUnit = curl.concat(space, unixSocket, space, host)
  exec(showUnit, (error, stdout, stderr) => {
    if (error) return cb(error)
    if (stderr) return cb(stderr)

    return cb(null, stdout)
  })
}
// end deploy

// start main
const srv = hunit.createServer((req, res) => {
  if (process.env.APPGEN && isInfoRequest(req.method)) {
    res.setHeader(appgenHeader, process.env.APPGEN)
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
          return res.end(helloMsg.replace(exclamMark).concat(space, successMsg, newLine, depRes))
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
