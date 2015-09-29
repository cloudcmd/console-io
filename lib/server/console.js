(function() {
    'use strict';
    
    var io              = require('socket.io'),
        debug           = require('debug'),
        logConsole      = debug('console'),
        logClients      = debug('console:clients'),
        
        CWD             = process.cwd(),
        Socket,
        Clients         = [],
        ConNum          = -1;
    
    module.exports = function(options) {
        var o       = options || {},
            prefix  = o.prefix || '/console';
        
        if (o.socket)
            Socket = o.socket;
        else if (o.server)
            Socket = io.listen(o.server);
        else
            throw Error('server or socket should be passed in options!');
        
        Socket
            .of(prefix)
            .on('connection', function(socket) {
                var auth        = options.auth;
               
                if (auth && typeof auth !== 'function')
                    throw Error('options.auth should be function!');
                
                if (!auth)
                    onConnection(options, socket);
                else
                    auth(socket, function() {
                        onConnection(options, socket);
                    });
            });
    };
    
    function onConnection(options, socket) {
        var msg, onDisconnect, onMessage,
            execute     = options.execute,
            indexEmpty  = Clients.indexOf(null);
        
        logClients('add before:', Clients);
        
        if (indexEmpty >= 0)
            ConNum = indexEmpty;
        else
            ConNum = Clients.length;
        
        msg = log(ConNum + 1, 'console connected\n');
        
        socket.emit('data', msg);
        
        socket.emit('path', options.prompt || CWD);
        socket.emit('prompt');
        
        Clients[ConNum] = {
            cwd : CWD
        };
        
        logClients('add after:', Clients);
        
        onMessage                   = processing.bind(null, socket, ConNum, execute),
        
        onDisconnect                = function(conNum) {
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
        log(conNum, command);
        
        fn(socket, command, function(path) {
            var dir;
            
            if (path)
                Clients[conNum].cwd = path;
            else
                dir = Clients[conNum].cwd;
            
            return  dir;
        });
    }
    
    function log(connNum, str, typeParam) {
        var ret, 
            type       = ' ';
        
        if (str) {
            if (typeParam)
                type  += typeParam + ':';
            
            ret        = 'client #' + connNum + type + str;
        }
        
        logConsole(ret);
        
        return ret;
    }
})();
