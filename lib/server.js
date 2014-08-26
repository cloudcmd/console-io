 (function() {
    'use strict';
    
    var DIR                 = './',
        DIR_ROOT            = __dirname + '/..',
        DIR_SERVER          = DIR + 'server/',
        
        join                = require('join-io'),
        minify              = require('minify'),
        
        joinFunc            = join({
            dir     : DIR_ROOT,
            minify  : true
        }),
        
        minifyFunc          = minify({
            dir     : DIR_ROOT
        }),
        
        socket              = require(DIR_SERVER + 'socket'),
        Console             = require(DIR_SERVER + 'console');
    
    module.exports          = start;
    
    module.exports.middle           = function(prefix) {
        return getServe(prefix);
    };
    
    function start(server, prefix) {
        var middle = getServe(prefix);
        
        socket.listen(server);
        Console();
        
        return middle;
    }
    
    function getServe(prefix) {
        if (!prefix)
            prefix = '/console';
        
        return serve.bind(null, prefix);
    }
    
    function serve(prefix, req, res, next) {
        var url         = req.url,
            regExp      = new RegExp('^' + prefix),
            regExpJoin  = new RegExp('^' + prefix + '/join'),
            
            isConsole   = url.match(regExp),
            isJoin      = url.match(regExpJoin),
            
            URL     = prefix + '/console.js',
            PATH    = '/lib/client/console.js';
        
        if (!isConsole) {
            next();
        } else {
            if (url === URL)
                url = PATH;
            else
                url = url.replace(prefix, '');
            
            req.url = url;
            
            if (isJoin)
                joinFunc(req, res, next);
            else
                minifyFunc(req, res, next);
        }
    }
    
})();
