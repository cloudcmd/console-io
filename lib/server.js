 (function() {
    'use strict';
    
    var DIR                 = './',
        DIR_SERVER          = DIR + 'server/',
        
        path                = require('path'),
        socket              = require(DIR_SERVER + 'socket'),
        Console             = require(DIR_SERVER + 'console');
    
    module.exports          = start;
    
    function start(server, prefix) {
        if (!prefix)
            prefix = '/console';
        
        socket.listen(server);
        Console.init();
        
        return serve.bind(null, prefix);
    }
    
    function serve(prefix, req, res, next) {
        var url         = req.url,
            regExp      = new RegExp('^' + prefix),
            isConsole   = url.match(regExp),
            
            URL     = prefix + '/console.js',
            PATH    = '/lib/client/console.js';
        
        if (!isConsole) {
            next();
        } else {
            if (url === URL)
                url = PATH;
            else
                url = url.replace(prefix, '');
            
            url = path.normalize(__dirname + '/..' + url);
            res.sendFile(url);
        }
    }
    
})();
