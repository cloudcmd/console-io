 (function() {
    'use strict';
    
    var DIR                 = './',
        DIR_SERVER          = DIR + 'server/',
        
        Socket              = require(DIR_SERVER + 'socket'),
        Console             = require(DIR_SERVER + 'console'),
        http                = require('http'),
        express             = require('express');
    
    exports.start           = start;
    
    /**
     * start server function
     * @param pConfig
     * @param pProcessing {index, appcache, rest}
     */
    function start(options) {
        var port, ip, app, server;
        
        if (!options)
            options = {
                port: 1337,
                ip  :'0.0.0.0'
            };
        
        port    =   process.env.PORT            ||  /* c9           */
                    process.env.app_port        ||  /* nodester     */
                    process.env.VCAP_APP_PORT   ||  /* cloudfoundry */
                    options.port;
        
        ip      =   process.env.IP              ||  /* c9           */
                    options.ip;
        
        app     = express(),
        server  = http.createServer(app);
        Socket.listen(server);
        
        app.use(express.static(__dirname + '/../'));
        
        server.listen(port, ip);
        
        Console.init();
        
        console.log('url: http://' + ip + ':' + port);
    }
    
})();
