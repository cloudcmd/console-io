 (function() {
    'use strict';
    
    var DIR                 = './',
        DIR_ROOT            = __dirname + '/..',
        DIR_SERVER          = DIR + 'server/',
        
        path                = require('path'),
        
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
    
    module.exports.middle           = function(prefix, notMinify) {
        return getServe(prefix, notMinify);
    };
    
    /*
     * @params options
     * 
     * server, onMsg, prefix, notMinify
     */
    function start(options) {
        var sock, 
            middle,
            o       = options || {};
        
        if (o.socket)
            sock    = o.socket;
        else if (o.server)
            sock    = socket.listen(o.server);
        
        middle  = getServe(o.prefix, o.notMinify),
        
        Console(sock, o.onMsg);
        
        return middle;
    }
    
    function getServe(prefix, notMinify) {
        if (!prefix)
            prefix = '/console';
        
        return serve.bind(null, prefix, notMinify);
    }
    
    function serve(prefix, notMinify, req, res, next) {
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
            else if (!notMinify)
                minifyFunc(req, res, next);
            else
                res.sendFile(path.normalize(DIR_ROOT + url));
        }
    }
    
})();
