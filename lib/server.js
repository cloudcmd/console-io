 (function() {
    'use strict';
    
    var DIR                 = './',
        DIR_SERVER          = DIR + 'server/',
        
        path                = require('path'),
        socket              = require(DIR_SERVER + 'socket'),
        Console             = require(DIR_SERVER + 'console');
    
    module.exports          = start;
    
    /**
     * start server function
     * @param pConfig
     * @param pProcessing {index, appcache, rest}
     */
    function start(server) {
        socket.listen(server);
        Console.init();
        
        return serve;
    }
    
    function serve(req, res, next) {
        var url         = req.url,
            regExp      = new RegExp('^/console'),
            isConsole   = url.match(regExp),
            
            URL     = '/console/console.js',
            PATH    = '/lib/client/console.js';
        
        if (!isConsole) {
            next();
        } else {
            if (url === URL)
                url = PATH;
            else
                url = url.replace('/console', '');
            
            url = path.normalize(__dirname + '/..' + url);
            res.sendFile(url);
        }
    }
    
})();
