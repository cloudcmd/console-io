var Util, Console, io;

(function(Util, Console, io) {
    'use strict';
    
    Console.Socket = SocketProto;
        
    function SocketProto(room) {
        var Socket              = Util.exec.bind(Util),
            AllListeners        = {},
            socket,
            log                 = Util.log.bind(Util),
            
            CONNECTED           = 'console: socket connected\n',
            DISCONNECTED        = 'console: socket disconnected\n';
        
        Socket.on               = addListener;
        Socket.addListener      = addListener;
        Socket.removeListener   = removeListener;
        Socket.send             = send;
        Socket.emit             = emit;
        
        Socket.CONNECTED        = CONNECTED;
        Socket.DISCONNECTED     = DISCONNECTED;
        
        connect(room);
        
        function addListener(name, func) {
           Util.addListener(name, func, AllListeners, socket);
        }
        
        function removeListener(name, func) {
            Util.removeListener(name, func, AllListeners, socket);
        }
        
        function send(data) {
            if (socket)
                socket.send(data);
        }
        
        function emit(channel, data) {
            if (socket)
                socket.emit(channel, data);
        }
        
        function setListeners(all, socket) {
            var listeners;
            
            Object.keys(all).forEach(function(name) {
                listeners   = all[name];
                
                listeners.forEach(function(func) {
                    if (func)
                        socket.on(name, func);
                });
            });
        }
        
        function connect(room) {
            var href            = location.origin,
                FIVE_SECONDS    = 5000;
            
            if (room)
                href    += room;
            
            socket = io.connect(href, {
                'max reconnection attempts' : Math.pow(2, 32),
                'reconnection limit'        : FIVE_SECONDS
            });
            
            if (socket.connected && AllListeners.connect)
                AllListeners.connect.forEach(function(func) {
                    func();
                });
            
            socket.on('connect', function () {
                log(CONNECTED);
            });
            
            setListeners(AllListeners, socket);
            
            socket.on('disconnect', function () {
                log(DISCONNECTED);
            });
            
            socket.on('reconnect_failed', function () {
                log('Could not reconnect. Reload page.');
            });
        }
        
        return Socket;
    }
    
})(Util, Console, io);
