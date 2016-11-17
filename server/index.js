'use strict';

const DIR = './';
const DIR_ROOT = __dirname + '/..';

const path = require('path');

const join = require('join-io');
const mollify = require('mollify');
const spawnify = require('spawnify/legacy');
const rendy = require('rendy');

const express = require('express');
const currify = require('currify');
const Router = express.Router;

const modules = require('../json/modules');

const mollifyFn = mollify({
    dir : DIR_ROOT
});

const modulesFn = currify(_modulesFn);
const joinFn = currify(_joinFn);
const konsoleFn = currify(_konsoleFn);
const minifyFn = currify(_minifyFn);

const Console = require('./console');

module.exports = (options = {}) => {
    const router = Router();
    const prefix = options.prefix || '/console';
    
    router.route(prefix + '/*')
        .get(konsoleFn(options))
        .get(modulesFn(prefix, options))
        .get(joinFn(options))
        .get(minifyFn(options))
        .get(staticFn)
    
    return router;
};

module.exports.listen = (socket, options = {}) => {
    const o = options;
    
    if (!options.prefix)
        options.prefix = '/console';
    
    return Console(socket, {
        server: o.server,
        prefix: o.prefix,
        prompt: o.prompt,
        execute: o.execute || execute,
        authCheck: o.authCheck
    });
}

function _modulesFn(prefix, options, req, res, next) {
    if (req.url !== '/modules.json')
        return next();
    
    const urls = [];
    const o = options;
    
    let urlSocket = '';
    let urlJquery = prefix;
    let urlJoin = prefix + '/join';
    
    if (checkOption(o.online)) {
        urls.push.apply(urls, modules.map((m) => {
            return rendy(m.remote, {
                version: m.version
            });
        }));
    } else {
        modules.forEach((m) => {
            if (m.name === 'socket')
                urlSocket = Console.getSocketPath() + '/socket.io.js';
            else if (m.name === 'jquery')
                urlJquery += m.local;
            else
                urlJoin += ':' + m.local;
        });
        
        urls.push.apply(urls, [urlJquery, urlSocket, urlJoin]);
    }
    
    res.type('json');
    res.send(urls);
}

function checkOption(isOption) {
    if (typeof isOption === 'function')
        return isOption();
    
    if (typeof isOption === 'undefined')
        return true;
    
    return isOption;
}

function _konsoleFn(options, req, res, next) {
    const o = options || {};
    const prefix = o.prefix || '/console';
    const url = req.url
    
    if (url.indexOf(prefix))
        return next();
    
    req.url = req.url.replace(prefix, '');
    
    if (req.url === '/console.js')
        req.url = '/client' + req.url;
    
    next();
}

function _joinFn(o, req, res, next) {
    if (req.url.indexOf('/join'))
        return next ();
        
    const minify = checkOption(o.minify);
    
    const joinFunc = join({
        minify,
        dir: DIR_ROOT
    });
    
    joinFunc(req, res, next);
}

function _minifyFn(o, req, res, next) {
    const url = req.url;
    const minify = checkOption(o.minify);
    
    if (!minify)
        return next();
    
    const sendFile = (url) => () => {
        const file = path.normalize(DIR_ROOT + url);
        res.sendFile(file);
    };
    
    mollifyFn(req, res, sendFile(url));
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}

function execute(socket, command, cwd) {
    const cmd = command.cmd;
    const env = command.env;
    
    const spawn = spawnify(cmd, {
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

