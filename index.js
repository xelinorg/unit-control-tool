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
const deployResource = '/deploy/';
// end config constants


// start config function
const getPath = (loc) => loc.slice(loc.indexOf('/'));
const getHost = (loc) => loc.replace(getPath(loc), '').replace('/', '');
// end config function


// start get function from network
const getDisFun = (disFunLocation, cb) => {
  const options = {
    host: getHost(disFunLocation),
    path: getPath(disFunLocation),
  };

  const callback = (response) => {
    let str = ''
    response.on('data', (chunk) => {
      str += chunk;
    });

    response.on('end', () => {
      cb(null, str);
    });

    response.on('error', resErr => {
      cb(resErr);
    });
  }

  const req = https.request(options, callback);
  req.end();
};
// end get function from network


// start persist function on filesystem
const persistDisFun = (outLocation, disFunStream, cb) => {

  return fs.writeFile(rootDir.concat('/', outLocation), disFunStream, (err) => {
    if (err) return console.log(err);
    return cb(null);
  });

};
// end persist function on filesystem

// start deploy
const deployDisFun = cb => {
  const space = ' ';
  const curl = 'curl -s';
  const unixSocket = '--unix-socket /var/run/control.unit.sock';
  const host = 'http://localhost';
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

  if (req.method.toUpperCase() === 'POST' && reqPath.indexOf(deployResource) === 0 && deployResource.length < reqPath.length) {
    return getDisFun(reqPath.replace(deployResource, ''), (getErr, getRes) => {
      const filename = getPath(reqPath).replace(/^(\/)/, '').slice(reqPath.lastIndexOf('/'), reqPath.length );
      return persistDisFun(filename, getRes, (persistErr, persistRes) => {
        return deployDisFun((depErr, depRes) => {
          if (depErr) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end(depErr);
          }
          res.writeHead(200, {"Content-Type": "text/plain"});
          return res.end("Hello, Node.js on Unit has been deployed!".concat('\n', depRes));
        });
      });
    })
  } else {
    res.writeHead(200, {"Content-Type": "text/plain"});
    return res.end("Hello, Node.js on Unit!");
  }

})
// end main

// listen
if (port > 1024) {
  srv.listen(port)
} else {
  srv.listen()
}

console.log(port > 1024 ? 'listening on port '.concat(port) : 'expose your desired port on unit config');
