'use strict';

var io = require('socket.io');
var tildify = require('tildify');
var debug = require('debug');
var logConsole = debug('console');
var logClients = debug('console:clients');

var WIN = process.platform === 'win32';
var CWD = process.cwd();

var Socket;
var Clients = [];
var ConNum = -1;

module.exports = function(options) {
    var o = options || {};
    var prefix  = o.prefix || '/console';
    
    if (o.socket)
        Socket = o.socket;
    else if (o.server)
        Socket = io.listen(o.server);
    else
        throw Error('server or socket should be passed in options!');
    
    Socket
        .of(prefix)
        .on('connection', function(socket) {
            var authCheck = options.authCheck;
           
            if (authCheck && typeof authCheck !== 'function')
                throw Error('options.authCheck should be function!');
            
            if (!authCheck)
                onConnection(options, socket);
            else
                authCheck(socket, function() {
                    onConnection(options, socket);
                });
        });
};

module.exports.getSocketPath = function() {
    return Socket.path();
};

function onConnection(options, socket) {
    var msg, dir;
    var execute = options.execute;
    var indexEmpty = Clients.indexOf(null);
    
    logClients('add before:', Clients);
    
    if (indexEmpty >= 0)
        ConNum = indexEmpty;
    else
        ConNum = Clients.length;
    
    msg = log(ConNum + 1, 'console connected\n');
    dir = WIN ? CWD : tildify(CWD);
     
    socket.emit('data', msg);
    socket.emit('path', options.prompt || dir);
    socket.emit('prompt');
    
    Clients[ConNum] = {
        cwd: CWD
    };
    
    logClients('add after:', Clients);
    
    var onMessage = processing.bind(null, socket, ConNum, execute);
    var onDisconnect = function(conNum) {
        logClients('remove before:', Clients);
        
        if (Clients.length !== conNum + 1) {
            Clients[conNum] = null;
        } else {
            Clients.pop();
            --ConNum;
        }
        
        logClients('remove after:', Clients);
        
        log(conNum, 'console disconnected');
        
        socket.removeListener('command', onMessage);
        socket.removeListener('disconnect', onDisconnect);
    }.bind(null, ConNum);
    
    socket.on('command', onMessage);
    socket.on('disconnect', onDisconnect);
}

function processing(socket, conNum, fn, command) {
    log(conNum, command.cmd);
    
    fn(socket, command, cwd(conNum));
}

function cwd(conNum) {
    return function(path) {
        if (!path)
            return Clients[conNum].cwd;
        
        Clients[conNum].cwd = path;
    };
}

function log(connNum, str, typeParam) {
    var type = ' ';
    
    if (!str)
        return;
    
    if (typeParam)
        type += typeParam + ':';
    
    var ret = 'client #' + connNum + type + str;
    logConsole(ret);
    
    return ret;
}

