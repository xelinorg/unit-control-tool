#!/usr/bin/env node

// start libs
const hunit = process.env.UCT_MODE ? require(process.env.UCT_MODE) : require('http');
const https = require('https');
const url = require("url");
const fs = require('fs');
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

// start main
const srv = hunit.createServer((req, res) => {
  const reqPath = url.parse(req.url).pathname;

  if (req.method.toUpperCase() === 'POST' && reqPath.indexOf(deployResource) === 0 && deployResource.length < reqPath.length) {
    getDisFun(reqPath.replace(deployResource, ''), (getErr, getRes) => {
      const filename = getPath(reqPath).replace(/^(\/)/, '').slice(reqPath.lastIndexOf('/'), reqPath.length );
      persistDisFun(filename, getRes, (persistErr, persistRes) => {
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.end("Hello, Node.js on Unit has been deployed!");
      });
    })
  } else {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello, Node.js on Unit!");
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


