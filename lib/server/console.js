(function() {
    'use strict';
    
    var spawnify        = require('spawnify'),
        Util            = require('util-io'),
        io              = require('socket.io'),
        
        CWD             = process.cwd(),
        
        Socket,
        
        Clients         = [],
        
        ConNum          = 0,
        
        CHANNEL         = 'console';
    
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
            .on('connection', function(socket) {
                onConnection(socket, o.onMsg, function(json) {
                    socket.emit(CHANNEL, json);
                });
            });
    };
    
    function onConnection(socket, onMsg, callback) {
        var msg, onDisconnect, onMessage;
        
        if (!callback) {
            callback    = onMsg;
            onMsg       = null;
        }
        
        Util.check([socket, callback], ['clientSocket', 'callback']);
        
        ++ConNum;
        
        if (!Clients[ConNum]) {
            msg = log(ConNum, 'console connected\n');
            
            if (onMsg) {
                onMsg('cd .', callback);
            } else {
                socket.emit(CHANNEL + '-data', msg);
                socket.emit(CHANNEL + '-path', CWD);
            }
            
            Clients[ConNum] = {
                cwd : CWD
            },
            
            onMessage                   = function(conNum, command) {
                var spawn, isDone;
                
                log(conNum, command);
                
                if (onMsg) {
                    onMsg(command, callback);
                } else {
                    spawn = spawnify(command, Clients[conNum]);
                    
                    spawn.on('error', function(error) {
                        isDone = true;
                        
                        socket.emit(CHANNEL + '-error', error.message);
                    });
                    
                    spawn.on('data', function(data) {
                        isDone = true;
                        
                        socket.emit(CHANNEL + '-data', data);
                    });
                    
                    spawn.on('cd', function(path) {
                        isDone = true;
                        
                        socket.emit(CHANNEL + '-path', path);
                    });
                    
                    spawn.on('close', function() {
                        if (!isDone);
                            socket.emit(CHANNEL + '-data', '');
                    });
                }
                    
            }.bind(null, ConNum),
            onDisconnect                = function(conNum) {
                Clients[conNum]         = null;
                
                log(conNum, 'console disconnected');
                
                socket.removeListener(CHANNEL, onMessage);
                socket.removeListener('disconnect', onDisconnect);
            }.bind(null, ConNum);
            
            socket.on(CHANNEL, onMessage);
            socket.on('disconnect', onDisconnect);
        } else {
            msg = log(ConNum, ' in use. Reconnecting...\n');
            
            callback({
                stdout: msg
            });
            
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
