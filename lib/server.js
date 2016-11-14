'use strict';

var DIR = './';
var DIR_ROOT = __dirname + '/..';
var DIR_SERVER = DIR + 'server/';

var path = require('path');

var join = require('join-io');
var mollify = require('mollify');
var spawnify = require('spawnify');
var rendy = require('rendy');

var modules = require('../json/modules');

var minifyFunc = mollify({
    dir : DIR_ROOT
});

var Console = require(DIR_SERVER + 'console');

module.exports = start;

module.exports.middle = function(options) {
    return getServe(options);
};

/*
 * @params options
 * 
 */
function start(options) {
    var middle;
    var o = options || {};
    
    middle = getServe(options),
    
    Console({
        server: o.server,
        socket: o.socket,
        prefix: o.prefix,
        prompt: o.prompt,
        execute: o.execute || execute,
        authCheck: o.authCheck
    });
    
    return middle;
}

function checkOption(isOption) {
    if (typeof isOption === 'function')
        return isOption();
    
    if (isOption === undefined)
        return true;
   
    return isOption;
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
        PATH        = '/lib/client/console.js',
        sendFile    = function() {
            url = path.normalize(DIR_ROOT + url);
            res.sendFile(url);
        };
    
    if (!isConsole) {
        next();
    } else {
        isJoin      = !url.indexOf(prefix + '/join');
        isModules   = url === prefix + '/modules.json';
        
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
            minifyFunc(req, res, sendFile);
        } else {
            sendFile();
        }
    }
}

function modulesFunc(prefix, online, req, res) {
    var urls        = [],
        urlSocket   = '',
        urlJquery   = prefix,
        urlJoin     = prefix + '/join';
    
    if (online) {
        urls = modules.map(function(m) {
            return rendy(m.remote, {
                version: m.version
            });
        });
    } else {
        modules.forEach(function(m) {
            if (m.name === 'socket')
                urlSocket   = Console.getSocketPath() + '/socket.io.js';
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

function execute(socket, command, cwd) {
    var cmd = command.cmd;
    var env = command.env;
    
    console.log('>>>', cmd, cwd);
    
    var spawn = spawnify(cmd, {
        cwd: cwd(),
        env: env
    });
    
    socket.on('kill', kill);
    socket.on('write', write);
    
    spawn.on('error', onError);
    spawn.on('data', onData);
    
    spawn.once('path', onPath);
    spawn.once('close', onClose);
    
    function kill() {
        spawn.kill();
    }
    
    function write(data) {
        spawn.write(data);
    }
    
    function onError(error) {
        socket.emit('err', error.message);
    }
    
    function onData(data) {
        console.log('->', data);
        socket.emit('data', data);
    }
    
    function onPath(path) {
        socket.emit('path', path);
        cwd(path);
    }
    
    function onClose() {
        socket.removeListener('kill', kill);
        socket.removeListener('write', write);
        
        spawn.removeListener('error', onError);
        spawn.removeListener('data', onData);
        
        socket.emit('prompt');
    }
}

