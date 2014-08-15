var $, Util;

(function(window) {
    'use strict';
    
    window.Console = new ConsoleProto();
    
    function ConsoleProto() {
        var Socket,
            ShortCuts = {},
            CHANNEL = 'console-data',
            
            log     = write.bind(null, 'log'),
            error   = write.bind(null, 'error'),
            
            Buffer  = {
                log     : '',
                error   : ''
            },
            
            jqconsole;
        
        function Console(element, prefix, callback) {
            var el,
                type        = typeof element,
                isString    = type === 'string';
            
            if (!callback) {
                callback    = prefix;
                prefix      = '/console';
            }
            
            if (isString)
                el  = document.querySelector('.console');
            else
                el  = element;
            
            load(prefix, function() {
                Socket      = new window.Socket(),
                jqconsole   = $(el).jqconsole('', '> ');
                
                addShortCuts(jqconsole);
                addListeners();
                
                if (callback)
                    callback();
            });
        }
        
        Console.addShortCuts    = function(shortCuts) {
            if (shortCuts)
                ShortCuts = shortCuts;
        };
        
        Console.getPromptText   = function() {
            var text = jqconsole.GetPromptText();
            
            return text;
        };
        
        Console.setPromptText   = function(text) {
            jqconsole.SetPromptText(text);
        };
        
        function load(prefix, callback) {
            loadScript([prefix + '/lib/client/load.js', prefix + '/join/join.js'], function() {
                var load    = window.load,
                    join    = window.join,
                    
                    css     = prefix + join([
                        '/css/style.css',
                        '/css/console.css',
                        '/lib/client/console/css/ansi.css',
                    ]),
                    remote  = ([
                        '//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min',
                        '//cdn.socket.io/socket.io-1.0.6'
                    ].map(function(src) {
                        return src + '.js';
                    })),
                
                    local   = prefix + join([
                        '/node_modules/util-io/lib/util',
                        '/lib/client/console/lib/jqconsole',
                        '/lib/client/socket'
                    ].map(function(src) {
                        return src + '.js';
                    }));
                
                
                load.parallel(remote.concat(css), function() {
                    load(local, callback);
                });
            });
        }
        
        function loadScript(srcs, callback) {
            var i       = srcs.length,
                func    = function() {
                    --i;
                    
                    if (!i)
                        callback();
                };
            
            srcs.forEach(function(src) {
                var element = document.createElement('script');
            
                element.src = src;
                element.addEventListener('load', func);
            
                document.body.appendChild(element);
            });
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
            
            Object.keys(ShortCuts).forEach(function(key) {
                var func = ShortCuts[key];
                
                jqconsole.RegisterShortcut(key, func);
            });
        }
        
        function clear() {
            jqconsole.Reset();
            addShortCuts(jqconsole);
            jqconsole.Prompt(true, handler);
        }
        
        return Console;
    }
    
})(this);
