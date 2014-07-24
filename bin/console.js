#!/usr/bin/env node

(function() {
    'use strict';
    
    var webconsole  = require('../'),
        http        = require('http'),
        express     = require('express'),
        
        app         = express(),
        server      = http.createServer(app),
        
        port        =   process.env.PORT            ||  /* c9           */
                        process.env.app_port        ||  /* nodester     */
                        process.env.VCAP_APP_PORT   ||  /* cloudfoundry */
                        1337,
        
        ip          =   process.env.IP              ||  /* c9           */
                        '0.0.0.0';
        
        webconsole(server);
        
        app.use(express.static(__dirname + '/../'));
        
        server.listen(port, ip);
        console.log('url: http://' + ip + ':' + port);
})();
