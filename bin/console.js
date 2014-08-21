#!/usr/bin/env node

(function() {
    'use strict';
    
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
        
        app .use(webconsole(server))
            .use(minify({
                dir: DIR
            }))
            .use(express.static(DIR));
        
        server.listen(port, ip);
        console.log('url: http://' + ip + ':' + port);
})();
