(function() {
    'use strict';
    
    var spawnify        = require('spawnify'),
        io              = require('socket.io'),
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
            throw(Error('server or socket should be passed in options!'));
        
        Socket
            .of(prefix)
            .on('connection', onConnection.bind(null, options));
    };
    
    function onConnection(options, socket) {
        var msg, onDisconnect, onMessage,
            indexEmpty  = Clients.indexOf(null),
            ERROR_MSG   = 'could not be empty!';
        
        if (!socket)
            throw(Error('socket ' + ERROR_MSG));
        
        logClients('add before:', Clients);
        
        if (indexEmpty >= 0)
            ConNum = indexEmpty;
        else
            ConNum = Clients.length;
        
        msg = log(ConNum, 'console connected\n');
        
        socket.emit('data', msg);
        
        socket.emit('prompt', options.prompt || CWD);
        
        Clients[ConNum] = {
            cwd : CWD
        };
        
        logClients('add after:', Clients);
        
        onMessage                   = processing.bind(null, socket, ConNum, options),
        
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
    
    function processing(socket, conNum, options, command) {
        var func    = options.execute || execute,
            cwd     = function(path) {
                var dir;
                
                if (path)
                    Clients[conNum].cwd = path;
                else
                    dir = Clients[conNum].cwd;
                
                return  dir;
            };
        
        log(conNum, command);
        
        func(socket, command, cwd);
    }
    
    function execute(socket, command, cwd) {
        var isDone,
            spawn = spawnify(command, {
                cwd: cwd()
            });
        
       spawn.on('error', function(error) {
            isDone = true;
            
            socket.emit('err', error.message);
        });
        
        spawn.on('data', function(data) {
            isDone = true;
            
            socket.emit('data', data);
        });
        
        spawn.on('path', function(path) {
            isDone = true;
            
            socket.emit('prompt', path);
            cwd(path);
        });
        
        spawn.on('close', function() {
            if (!isDone);
                socket.emit('data', '');
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
