#!/usr/bin/env node

// start libs
const hunit = process.env.UCT_MODE ? require(process.env.UCT_MODE) : require('http');
const https = require('https');
const url = require("url");
const fs = require('fs');
const { exec } = require('child_process');
// end libs


// start config constants
const port = process.env.UCT_MODE !== 'unit-http' && process.env.UCT_PORT ? process.env.UCT_PORT : -1 ;
const rootDir = '/tmp';
const deployResource = '/control/deploy/';

const helloMsg = "Hello, Node.js on Unit!";
const successMsg = "has been deployed!";
const httpMsg = 'listening on port '.concat(port);
const unitHttpMsg = 'expose your desired port on unit config';

const fslash = '/';
const space = ' ';
const nochar = '';
const exclamMark = '!';
const newLine = '\n';
const fslashReg = /^(\/)/;

const port1024 = 1024;
const twoHundred = 200;
const fiveHundred = 500;
const contetTypeTxtPlain = {"Content-Type": "text/plain"};
const method = {
  POST: 'POST'
};
const event = {
  data: 'data',
  end: 'end',
  error: 'error'
}

const curl = 'curl -s';
const unixSocket = '--unix-socket /var/run/control.unit.sock';
const host = 'http://localhost';
// end config constants


// start config function
const getPath = (loc) => loc.slice(loc.indexOf(fslash));
const getHost = (loc) => loc.replace(getPath(loc), nochar).replace(fslash, nochar);
// end config function


// start get function from network
const getDisFun = (disFunLoc, cb) => {
  const options = {
    host: getHost(disFunLoc),
    path: getPath(disFunLoc),
  };

  const callback = (response) => {
    let str = nochar;
    response.on(event.data, (chunk) => {
      str += chunk;
    });

    response.on(event.end, () => {
      cb(null, str);
    });

    response.on(event.error, resErr => {
      cb(resErr);
    });
  }

  const req = https.request(options, callback);
  req.end();
};
// end get function from network


// start persist function on filesystem
const persistDisFun = (outLoc, disFunStream, cb) => {

  return fs.writeFile(rootDir.concat(fslash, outLoc), disFunStream, (err) => {
    if (err) return cb(err);
    return cb(null);
  });

};
// end persist function on filesystem

// start deploy
const deployDisFun = (filename, cb) => {
  const showUnit = curl.concat(space, unixSocket, space, host);
  exec(showUnit, (error, stdout, stderr) => {
    if (error) return cb(error);
    if (stderr) return cb(stderr);

    return cb(null, stdout)

  });
};
// end deploy

// start main
const srv = hunit.createServer((req, res) => {
  const reqPath = url.parse(req.url).pathname;

  if (req.method.toUpperCase() === method.POST && reqPath.indexOf(deployResource) === 0 && deployResource.length < reqPath.length) {
    return getDisFun(reqPath.replace(deployResource, nochar), (getErr, getRes) => {
      const filename = getPath(reqPath).replace(fslashReg, nochar).slice(reqPath.lastIndexOf(fslash), reqPath.length );
      return persistDisFun(filename, getRes, (persistErr, persistRes) => {
        return deployDisFun(filename, (depErr, depRes) => {
          if (depErr) {
            res.writeHead(fiveHundred, contetTypeTxtPlain);
            return res.end(depErr);
          }
          res.writeHead(twoHundred, contetTypeTxtPlain);
          return res.end(helloMsg.replace(exclamMark).concat(space, successMsg, newLine, depRes));
        });
      });
    })
  } else {
    res.writeHead(twoHundred, contetTypeTxtPlain);
    return res.end(helloMsg);
  }

})
// end main

// listen
if (port > port1024) {
  srv.listen(port)
} else {
  srv.listen()
}

console.log(port > port1024 ? httpMsg : unitHttpMsg);
