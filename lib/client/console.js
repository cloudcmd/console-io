var $, Util;

(function(window) {
    'use strict';
    
    window.Console = new ConsoleProto();
    
    function ConsoleProto() {
        var Socket,
            CHANNEL = 'console-data',
            
            log     = write.bind(null, 'log'),
            error   = write.bind(null, 'error'),
            
            PREFIX  = '/console/',
            
            Buffer  = {
                log     : '',
                error   : ''
            },
            
            jqconsole;
        
        this.init       = function(element, callback) {
            var el,
                type        = typeof element,
                isString    = type === 'string';
            
            if (isString)
                el  = document.querySelector('.console');
            else
                el  = element;
            
            load(function() {
                Socket      = new window.Socket(),
                jqconsole   = $(el).jqconsole('', '> ');
                
                addListeners();
                
                if (callback)
                    callback();
            });
        };
        
        function load(callback) {
            var element,
                urlsFirst = [
                    PREFIX + 'css/style.css',
                    PREFIX + 'css/console.css',
                    PREFIX + 'lib/client/console/css/ansi.css',
                ].concat([
                    '//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min',
                    '//cdn.socket.io/socket.io-1.0.6',
                    PREFIX + 'node_modules/util-io/lib/util',
                ].map(function(src) {
                    return src + '.js';
                })),
            
                urlsSecond  = [
                    PREFIX + 'lib/client/console/lib/jqconsole',
                    PREFIX + 'lib/client/socket'
                ].map(function(src) {
                    return src + '.js';
                });
            
            element = document.createElement('script');
            element.src = PREFIX + 'lib/client/load.js';
            
            element.addEventListener('load', function() {
                var load = window.load;
                
                load.parallel(urlsFirst, function() {
                    load.parallel(urlsSecond, callback);
                });
            });
            
            document.body.appendChild(element);
        }
        
        function handler(command) {
            if (command)
                Socket.emit(CHANNEL, command);
            else
                jqconsole.Prompt(true, handler);
        }
        
        function isPrompt() {
            var state   = jqconsole.GetState(),
                is      = state === 'prompt';
            
            return is;
        }
            
        function addListeners() {
            var options = {
                'connect'   : function() {
                    log(Socket.CONNECTED);
                },
                
                'disconnect': function() {
                    var is = isPrompt();
                    
                    error(Socket.DISCONNECTED);
                    
                    if (is)
                        jqconsole.AbortPrompt();
                }
            };
            
            options[CHANNEL] = onMessage;
            
            Socket.on(options);
        }
        
        function onMessage(json) {
            var is = isPrompt();
            
            if (json) {
                Util.log(json);
                
                log(json.stdout);
                error(json.stderr);
                
                if (json.path)
                    jqconsole.SetPromptLabel(json.path + '> ');
            }
            
            if (!is)
                jqconsole.Prompt(true, handler);
        }
        
        function write(status, msg) {
            var isContain;
            
            if (msg) {
                Buffer[status] += msg;
                isContain       = Util.isContainStr(Buffer[status], '\n');
                
                if (jqconsole && isContain) {
                    jqconsole.Write(Buffer[status], status + '-msg');
                    Buffer[status] = '';
                }
            }
        }
            
        function addShortCuts(jqconsole) {
            jqconsole.RegisterShortcut('Z', function() {
                jqconsole.SetPromptText('');
            });
            
            jqconsole.RegisterShortcut('L', clear);
        }
        
        function clear() {
            jqconsole.Reset();
            addShortCuts(jqconsole);
            jqconsole.Prompt(true, handler);
        }
    }
    
})(this);
