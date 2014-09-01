(function() {
    'use strict';
    
    var DIR_SERVER      = './',
        
        spawnify        = require('spawnify'),
        Util            = require('util-io'),
        
        socket          = require(DIR_SERVER    + 'socket'),
        CWD             = process.cwd(),
        
        Clients         = [],
        
        addNewLine      = function (text) {
            var newLine    = '',
                n           = text && text.length;
            
            if(n && text[n-1] !== '\n')
                newLine = '\n';
            
            return text + newLine;
        },
        
        ConNum          = 0,
        
        CHANNEL         = 'console-data';
    
    module.exports = function(onMsg) {
        socket.on('connection', function(clientSocket) {
            onConnection(clientSocket, onMsg, function(error, json) {
                socket.emit(CHANNEL, json, clientSocket);
            });
        });
    };
    
    function onConnection(clientSocket, onMsg, callback) {
        var msg, onDisconnect, onMessage;
        
        if (!callback) {
            callback    = onMsg;
            onMsg       = null;
        }
        
        Util.checkArgs([clientSocket, callback], ['clientSocket', 'callback']);
        
        ++ConNum;
        
        if (!Clients[ConNum]) {
            msg = log(ConNum, 'console connected');
            
            if (onMsg)
                onMsg('pwd', callback);
            else
                callback(null, {
                    stdout  : addNewLine(msg),
                    path    : CWD
                });
            
            Clients[ConNum] = {
                cwd : CWD
            },
            
            onMessage                   = function(command) {
                log(ConNum, command);
                
                if (onMsg)
                    onMsg(command, callback);
                else
                    spawnify(command, Clients[ConNum], callback);
            },
            onDisconnect                = function(conNum) {
                Clients[conNum]         = null;
                
                log(conNum, 'console disconnected');
                
                socket.removeListener(CHANNEL, onMessage, clientSocket);
                socket.removeListener('disconnect', onDisconnect, clientSocket);
            }.bind(null, ConNum);
            
            socket.on(CHANNEL, onMessage, clientSocket);
            socket.on('disconnect', onDisconnect, clientSocket);
        } else {
            msg = log(ConNum, ' in use. Reconnecting...\n');
            
            callback(null, {
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
            
            Util.log(ret);
        }
        
        return ret;
    }
})();
