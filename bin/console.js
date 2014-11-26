#!/usr/bin/env node

(function() {
    'use strict';
    
    var argv        = process.argv,
        Util        = require('util-io'),
        vm          = require('vm'),
        
        Clients     = [],
        Num         = 0,
        
        argvLast    = argv.slice().pop();
    
    switch (argvLast) {
    case '-v':
        version();
        break;
    
    case '--v':
        version();
        break;
    
    default:
        start();
    }
    
    function start() {
        var DIR         = __dirname + '/../',
        
        webconsole  = require('../'),
        http        = require('http'),
        
        express     = require('express'),
        minify      = require('minify'),
        
        app         = express(),
        server      = http.createServer(app),
        
        port        =   process.env.PORT            ||  /* c9           */
                        process.env.app_port        ||  /* nodester     */
                        process.env.VCAP_APP_PORT   ||  /* cloudfoundry */
                        1337,
        
        ip          =   process.env.IP              ||  /* c9           */
                        '0.0.0.0';
        
        app .use(webconsole({
                server: server,
                online: false
            }))
            .use(minify({
                dir: DIR
            }))
            .use(express.static(DIR));
        
        server.listen(port, ip);
        
        console.log('url: http://' + ip + ':' + port);
    }
    
    function version() {
        var pack = require('../package.json');
        
        console.log('v' + pack.version);
    }
})();
