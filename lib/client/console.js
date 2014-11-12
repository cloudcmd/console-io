var $, io;

(function(window) {
    'use strict';
    
    window.Console = new ConsoleProto();
    
    function ConsoleProto() {
        var handler,
            ShortCuts = {},
            
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
                el  = document.querySelector(element);
            else
                el  = element;
            
            load(prefix, function() {
                jqconsole   = $(el).jqconsole('', '> ');
                
                addShortCuts(jqconsole);
                addListeners(jqconsole, prefix);
                addOnMouseUp(jqconsole);
                
                if (typeof callback === 'function')
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
        
        Console.focus           = function() {
            if (jqconsole)
                jqconsole.Focus();
        };
        
        function addOnMouseUp(jqconsole) {
            var console     = jqconsole.$console;
            
            console.mouseup(function() {
                var top,
                    isSelection = '' + window.getSelection();
                
                if (!isSelection) {
                    top        = console.scrollTop();
                    
                    Console.focus();
                    console.scrollTop(top);
                }
            });
        }
        
        function load(prefix, callback) {
            loadScript([prefix + '/lib/client/load.js', prefix + '/join/join.js'], function() {
                var load    = window.load,
                    join    = window.join,
                    
                    css     = prefix + join([
                        '/css/console.css',
                        '/lib/client/console/css/ansi.css',
                    ]);
                
                load.json(prefix + '/modules.json', function(error, remote) {
                    if (error)
                        console.log(error);
                    else
                        load.series(remote.concat(css), callback);
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
        
        function getHandler(socket) {
            return function handler(command) {
                if (command)
                    socket.emit('command', command);
                else
                    jqconsole.Prompt(true, handler);
            };
        }
        
        function isPrompt() {
            var state   = jqconsole.GetState(),
                is      = state === 'prompt';
            
            return is;
        }
            
        function addListeners(jqconsole, room) {
            var href            = getHost(),
                FIVE_SECONDS    = 5000,
                
                prompt          = function prompt() {
                    var is = isPrompt();
                    
                    if (!is)
                        jqconsole.Prompt(true, handler);
                },
                
                socket = io.connect(href + room, {
                    'max reconnection attempts' : Math.pow(2, 32),
                    'reconnection limit'        : FIVE_SECONDS
                });
            
            socket.on('err', function(msg) {
                error(msg);
                prompt();
            });
            
            socket.on('data', function(data) {
                log(data);
                prompt();
            });
            
            socket.on('path', function(path) {
                setPromptLabel(path + '> ');
            });
            
            socket.on('connect', function() {
                log('console: connected\n');
            });
            
            socket.on('disconnect', function() {
                error('console: disconnected\n');
                abortPrompt();
            });
            
            handler = getHandler(socket);
        }
        
        function getHost() {
            var l       = location,
                href    = l.origin || l.protocol + '//' + l.host;
            
            return href;
        }
        
        function write(status, msg) {
            var isContain;
            
            if (msg) {
                Buffer[status] += msg;
                isContain       = ~Buffer[status].indexOf('\n');
                
                if (jqconsole && isContain) {
                    jqconsole.Write(Buffer[status], status + '-msg');
                    Buffer[status] = '';
                }
            }
        }
        
        function abortPrompt() {
             var is = isPrompt();
             
             if (is)
                jqconsole.AbortPrompt();
        }
        
        function setPromptLabel(prompt) {
            var selector = '.jqconsole-prompt>span+span>span:first-child';
            
            $(selector).text(prompt);
            jqconsole.SetPromptLabel(prompt);
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
