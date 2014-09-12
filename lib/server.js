 (function() {
    'use strict';
    
    var DIR                 = './',
        DIR_ROOT            = __dirname + '/..',
        DIR_SERVER          = DIR + 'server/',
        
        path                = require('path'),
        
        join                = require('join-io'),
        minify              = require('minify'),
        
        Util                = require('util-io'),
        
        modules             = require('../json/modules'),
        
        minifyFunc          = minify({
            dir     : DIR_ROOT
        }),
        
        Console             = require(DIR_SERVER + 'console');
    
    module.exports          = start;
    
    module.exports.middle           = function(prefix, isMinify, isOnline) {
        return getServe(prefix, isMinify, isOnline);
    };
    
    /*
     * @params options
     * 
     * server, onMsg, prefix, notMinify
     */
    function start(options) {
        var sock,
            middle,
            o           = options || {};
        
        if (o.socket)
            sock    = o.socket;
        else if (o.server)
            sock    = Console.listen(o.server);
        
        middle  = getServe(o.prefix, o.isMinify, o.online),
        
        Console({
            server: o.server,
            socket: o.socket,
            onMsg: o.onMsg
        });
        
        return middle;
    }
    
    function checkOption(isOption) {
        var is;
        
        if (typeof isOption === 'function')
            is  = isOption();
        else if (isOption === undefined)
            is  = true;
        else
            is  = isOption;
        
        return is;
    }
    
    function getServe(prefix, isMinify, online) {
        if (!prefix)
            prefix = '/console';
        
        return serve.bind(null, prefix, isMinify, online);
    }
    
    function serve(prefix, isMinify, online, req, res, next) {
        var joinFunc,
            isMin       = checkOption(isMinify),
            isOnline    = checkOption(online),
            
            url         = req.url,
            
            regExp      = new RegExp('^' + prefix),
            regExpJoin  = new RegExp('^' + prefix + '/join'),
            regExpMdls  = new RegExp('^' + prefix + '/modules.json'),
            
            isConsole   = url.match(regExp),
            isJoin      = url.match(regExpJoin),
            isModules   = url.match(regExpMdls),
            
            URL         = prefix + '/console.js',
            PATH        = '/lib/client/console.js';
        
        if (!isConsole) {
            next();
        } else {
            if (url === URL)
                url = PATH;
            else
                url = url.replace(prefix, '');
            
            req.url = url;
            
            if (isModules) {
                modulesFunc(isOnline, req, res, next);
            } else if (isJoin) {
                joinFunc = join({
                    dir     : DIR_ROOT,
                    minify  : isMin
                });
                
                joinFunc(req, res, next);
            } else if (isMin) {
                minifyFunc(req, res, next);
            } else {
                url = path.normalize(DIR_ROOT + url);
                res.sendFile(url);
            }
        }
    }
    
    function modulesFunc(online, req, res) {
        var urls        = [],
            jquery      = Util.findObjByNameInArr(modules, 'jquery'),
            socket      = Util.findObjByNameInArr(modules, 'socket'),
            
            vJquery     = jquery.version,
            vSocket     = socket.version,
            
            urlJquery   = Util.render(jquery.remote, {
                version: vJquery
            }),
            
            urlSocket   = Util.render(socket.remote, {
                version: vSocket
            });
        
        if (online)
            urls = [urlJquery, urlSocket];
        else
            urls = [jquery.local, socket.local];
        
        res.type('json');
        res.send(urls);
    }
    
})();
