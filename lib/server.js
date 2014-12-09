 (function() {
    'use strict';
    
    var DIR                 = './',
        DIR_ROOT            = __dirname + '/..',
        DIR_SERVER          = DIR + 'server/',
        
        path                = require('path'),
        
        join                = require('join-io'),
        mollify             = require('mollify'),
        
        Util                = require('util-io'),
        
        modules             = require('../json/modules'),
        
        minifyFunc          = mollify({
            dir     : DIR_ROOT
        }),
        
        Console             = require(DIR_SERVER + 'console');
    
    module.exports          = start;
    
    module.exports.middle           = function(options) {
        return getServe(options);
    };
    
    /*
     * @params options
     * 
     */
    function start(options) {
        var middle,
            o           = options || {};
        
        middle  = getServe(options),
        
        Console({
            server: o.server,
            socket: o.socket,
            prefix: o.prefix,
            prompt: o.prompt,
            execute: o.execute
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
    
    function getServe(options) {
        return serve.bind(null, options);
    }
    
    function serve(options, req, res, next) {
        var joinFunc, isJoin, isModules,
            
            o           = options || {},
            isMin       = checkOption(o.minify),
            isOnline    = checkOption(o.online),
            
            url         = req.url,
            prefix      = o.prefix || '/console',
            
            isConsole   = !url.indexOf(prefix),
            
            URL         = prefix + '/console.js',
            PATH        = '/lib/client/console.js';
        
        if (!isConsole) {
            next();
        } else {
            isJoin      = !url.indexOf(prefix + '/join');
            isModules   = !url.indexOf(prefix + '/modules.json');
            
            if (url === URL)
                url = PATH;
            else
                url = url.replace(prefix, '');
            
            req.url = url;
            
            if (isModules) {
                modulesFunc(prefix, isOnline, req, res, next);
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
    
    function modulesFunc(prefix, online, req, res) {
        var urls        = [],
            urlJoin     = '',
            urlSocket   = '',
            urlJquery   = '';
        
        if (online) {
            urls = modules.map(function(m) {
                return Util.render(m.remote, {
                    version: m.version
                });
            });
        } else {
            urlJoin     = prefix + '/join';
            urlJquery   = prefix;
            
            modules.forEach(function(m) {
                if (m.name === 'socket')
                    urlSocket   = m.local;
                else if (m.name === 'jquery')
                    urlJquery   += m.local;
                else
                    urlJoin     += ':' + m.local;
            });
            
            urls = [urlJquery, urlSocket, urlJoin];
        }
        
        res.type('json');
        res.send(urls);
    }
})();
