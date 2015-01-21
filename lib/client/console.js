var $, io, skipfirst;

(function(window) {
    'use strict';
    
    window.Console = new ConsoleProto();
    
    function ConsoleProto() {
        var Spawn,
            ShortCuts = {},
            
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
                
                Spawn = new SpawnProto(jqconsole, prefix);
                addShortCuts(jqconsole);
                addKeyWhenNoPrompt(jqconsole);
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
            loadScript([
                '/modules/load/load.js',
                '/join/join.js',
            ].map(function(name) {
                return prefix + name;
            }), function() {
                var load    = window.load,
                    join    = window.join,
                    
                    css     = prefix + join([
                        '/css/console.css',
                        '/css/ansi.css',
                    ]);
                
                load.json(prefix + '/modules.json', function(error, remote) {
                    var reg,
                        name    = 'jQuery';
                    
                    if (error) {
                        console.log(error);
                    } else {
                        /* do not load jquery if it is loaded */
                        if (window[name]) {
                            reg     = RegExp(name, 'i');
                            remote  = remote.filter(function(item) {
                                return !reg.test(item);
                            });
                        }
                        
                        load.series(remote.concat(css), callback);
                    }
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
        
        function isPrompt() {
            var state   = jqconsole.GetState(),
                is      = state === 'prompt';
            
            return is;
        }
            
        function SpawnProto(jqconsole, room) {
            var self            = this,
                socket,
                prompt          = function() {
                    var is = isPrompt();
                    
                    if (!is)
                        jqconsole.Prompt(true, self.handler);
            };
            
            init(room);
            
            function init(room) {
                var href            = getHost(),
                    FIVE_SECONDS    = 5000;
                
                socket = io.connect(href + room, {
                    'max reconnection attempts' : Math.pow(2, 32),
                    'reconnection limit'        : FIVE_SECONDS
                });
                
                socket.on('err', function(data) {
                    error(data);
                });
                
                socket.on('data', function(data) {
                    log(data);
                });
                
                socket.on('prompt', function() {
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
            }
            
            this.handler = function getHandler(command) {
                if (command)
                    socket.emit('command', command);
                else
                    jqconsole.Prompt(true, self.handler);
            };
            
            this.kill       = function() {
                socket.emit('kill');
            };
            
            this.write      = function(data) {
                socket.emit('write', data);
            };
            
            function getHost() {
                var l       = location,
                    href    = l.origin || l.protocol + '//' + l.host;
                
                return href;
            }
            
            function write(data, className) {
                if (data)
                    jqconsole.Write(data, className);
            }
            
            function log(data) {
                write(data, 'log-msg');
            }
            
            function error(data) {
                write(data, 'error-msg');
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
        
        function addKeyWhenNoPrompt(jqconsole) {
            var skip = skipfirst(readNoPrompt);
                
            jqconsole
                .$input_source[0]
                .addEventListener('keydown', function(event) {
                    var ENTER   = 13,
                        is      = isPrompt();
                    
                    if (is)
                        skip.clear();
                    else
                        skip(event.keyCode === ENTER, event);
                });
        }
        
        function readNoPrompt(event) {
            var char,
                KEY_C   = 67,
                isCtrl  = event.ctrlKey || event.metaKey,
                isC     = event.keyCode === KEY_C;
            
            if (isC && isCtrl) {
                Spawn.kill();
            } else {
                char = fromCharCode(event);
                
                if (char) {
                    Spawn.write(char);
                    jqconsole.Write(char);
                }
            }
        }
        
        function fromCharCode(event) {
            var code, hex,
                char        = '',
                identifier  = event.keyIdentifier,
                shift       = event.shiftKey;
                
            if (identifier === 'Enter') {
                char = '\n';
            } else {
                code        = identifier.substring(2);
                hex         = parseInt(code, 16);
                
                if (!isNaN(hex))
                    char        = String.fromCharCode(hex);
                
                if (!shift && /[a-z]/i.test(char))
                    char = char.toLowerCase();
            }
            
            return char;
        }
        
        function clear() {
            jqconsole.Reset();
            addShortCuts(jqconsole);
            jqconsole.Prompt(true, Spawn.handler);
        }
        
        return Console;
    }
    
})(this);
