#!/usr/bin/env node

// start libs
const hunit = require('unit-http')
// end libs

// start function
const disfun = require(process.env.UCT_DISFUN)
// end function

// start main
const srv = hunit.createServer(disfun)
// end main

// listen
srv.listen()
