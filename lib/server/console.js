(function() {
    'use strict';
    
    var spawnify        = require('spawnify'),
        Util            = require('util-io'),
        io              = require('socket.io'),
        
        CWD             = process.cwd(),
        
        Socket,
        
        Clients         = [],
        
        ConNum          = 0;
    
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
            .on('connection', onConnection);
    };
    
    function onConnection(socket) {
        var msg, onDisconnect, onMessage;
        
        Util.check(arguments, ['socket']);
        
        ++ConNum;
        
        if (!Clients[ConNum]) {
            msg = log(ConNum, 'console connected\n');
            
            socket.emit('data', msg);
            socket.emit('path', CWD);
            
            Clients[ConNum] = {
                cwd : CWD
            };
            
            onMessage                   = function(conNum, command) {
                var spawn, isDone;
                
                log(conNum, command);
                
                spawn = spawnify(command, Clients[conNum]);
                
                spawn.on('error', function(error) {
                    isDone = true;
                    
                    socket.emit('error', error.message);
                });
                
                spawn.on('data', function(data) {
                    isDone = true;
                    
                    socket.emit('data', data);
                });
                
                spawn.on('path', function(path) {
                    isDone = true;
                    
                    socket.emit('path', path);
                });
                
                spawn.on('close', function() {
                    if (!isDone);
                        socket.emit('data', '');
                });
            }.bind(null, ConNum),
            onDisconnect                = function(conNum) {
                Clients[conNum]         = null;
                
                log(conNum, 'console disconnected');
                
                socket.removeListener('command', onMessage);
                socket.removeListener('disconnect', onDisconnect);
            }.bind(null, ConNum);
            
            socket.on('command', onMessage);
            socket.on('disconnect', onDisconnect);
        } else {
            msg = log(ConNum, ' in use. Reconnecting...\n');
            
            socket.emit('data', msg);
            
            socket.disconnect();
        }
    }
    
    function log(connNum, str, typeParam) {
        var ret, 
            type       = ' ';
        
        if (str) {
            
            if (typeParam)
                type  += typeParam + ':';
            
            ret        = 'client #' + connNum + type + str;
        }
        
        return ret;
    }
})();
