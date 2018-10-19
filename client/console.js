/* global $, io */

'use strict';

require('../css/console.css');
require('../css/ansi.css');

module.exports = ConsoleProto;

const load = require('load.js');
const skipfirst = require('skipfirst');
const {promisify} = require('es6-promisify');
const tryToCatch = require('try-to-catch/legacy');

const getHost = require('./get-host');
const getEnv = require('./get-env');

const isFn = (fn) => typeof fn === 'function';
const exec = (fn, ...a) => isFn(fn) && fn(...a);

const loadJSON = promisify(load.json)
const loadSeries = promisify(load.series);

function ConsoleProto(element, options, callback) {
    let Spawn;
    let jqconsole;
    let ShortCuts = {};
    
    if (!(this instanceof ConsoleProto))
        return new ConsoleProto(element, options, callback);
    
    Console(element, options, callback);
    
    const self = this;
    
    function getElement(el) {
        if (typeof el !== 'string')
            return el;
        
        return document.querySelector(el);
    }
    
    function Console(element, options, callback) {
        const el = getElement(element);
        
        if (!callback) {
            callback = options;
            options = {};
        }
        
        const socketPath = options.socketPath || '';
        const prefix = options.prefix || '/console';
        const env = options.env || {};
        const cwd = options.cwd || '';
        
        loadAll(prefix).then(() => {
            jqconsole = $(el).jqconsole('', '> ');
            
            Spawn = SpawnProto(jqconsole, {
                env,
                cwd,
                prefix,
                socketPath,
            });
            
            addShortCuts(jqconsole);
            addKeyWhenNoPrompt(jqconsole);
            addOnMouseUp(jqconsole);
            
            exec(callback, Spawn, this);
        });
        
        return this;
    }
    
    this.addShortCuts = (shortCuts) => {
        if (shortCuts)
            ShortCuts = {
                ...shortCuts
            };
    };
    
    this.getPromptText = () => {
        if (jqconsole.GetState() !== 'output')
            return jqconsole.GetPromptText();
        
        return '';
    };
    
    this.setPromptText   = (text) => {
        jqconsole.SetPromptText(text);
    };
    
    this.focus = () => {
        if (jqconsole)
            jqconsole.Focus();
    };
    
    function addOnMouseUp(jqconsole) {
        const {$console} = jqconsole;
        
        $console.mouseup(() => {
            const isSelection = '' + window.getSelection();
            
            if (isSelection)
                return;
            
            const top = $console.scrollTop();
            
            self.focus();
            $console.scrollTop(top);
        });
    }
    
    async function loadAll(prefix) {
        let [error, remote] = await tryToCatch(loadJSON, prefix + '/modules.json');
        const names = [
            'jQuery',
            'io'
        ];
        
        if (error)
            /*eslint no-console: 0*/
            return console.error(error);
        
        /* do not load jquery if it is loaded */
        names.forEach((name) => {
            if (!window[name])
                return;
            
            const reg = RegExp(name, 'i');
            remote = remote.filter((item) => {
                return !reg.test(item);
            });
        });
        
        await loadSeries(remote);
    }
    
    function isPrompt() {
        const state = jqconsole.GetState();
        return state === 'prompt';
    }
    
    function SpawnProto(jqconsole, options) {
        if (!(this instanceof SpawnProto))
            return new SpawnProto(jqconsole, options);
        
        const Buffer = {
            'log-msg': '',
            'error-msg': ''
        };
        
        let socket;
        const prompt = () => {
            if (isPrompt())
                return;
            
            jqconsole.Prompt(true, this.handler);
        };
        
        const {env} = options;
        
        init(options);
        
        function init(options) {
            let {cwd} = options;
            const commands = [];
            const promptText = [];
            const href = getHost();
            const FIVE_SECONDS = 5000;
            
            const room = options.prefix;
            const {socketPath} = options;
            
            socket = io.connect(href + room, {
                'max reconnection attempts' : Math.pow(2, 32),
                'reconnection limit'        : FIVE_SECONDS,
                path: socketPath + '/socket.io',
                transportOptions: {
                    polling: {
                        extraHeaders: {
                            'x-cwd': cwd
                        }
                    }
                }
            });
            
            socket.on('err', error);
            socket.on('data', log);
            
            socket.on('prompt', () => {
                forceWrite();
                prompt();
                
                if (promptText.length)
                    self.setPromptText(promptText.pop());
            });
            
            socket.on('label', (path) => {
                if (commands.length)
                    execute(commands.pop(), env);
                else
                    setPromptLabel(path + '> ');
                
                cwd = path;
            });
            
            socket.on('connect', () => {
                log('console: connected\n');
            });
            
            socket.on('disconnect', () => {
                error('console: disconnected\n');
                
                commands.push('cd ' + cwd);
                promptText.push(self.getPromptText());
                
                abortPrompt();
            });
        }
        
        function execute(cmd, env) {
            if (!cmd)
                return;
            
            socket.emit('command', {
                cmd,
                env: getEnv(env)
            });
        }
        
        this.on = (...args) => {
            socket.on(...args);
            return this
        };
        
        this.emit = (...args) => {
            socket.emit(...args);
            return this
        };
        
        this.handler = (command) => {
            if (command)
                return execute(command, env);
            
            jqconsole.Prompt(true, this.handler);
        };
        
        this.kill = () => {
            socket.emit('kill');
        };
        
        this.write = (data) => {
            socket.emit('write', data);
        };
        
        function write(data, className) {
            if (!data)
                return;
            
            Buffer[className] += data;
            const isContain = ~Buffer[className].indexOf('\n');
            
            if (isContain) {
                jqconsole.Write(Buffer[className], className);
                Buffer[className] = '';
            }
        }
        
        function forceWrite() {
            Object.keys(Buffer).forEach((name) => {
                if (Buffer[name]) {
                    jqconsole.Write(Buffer[name], name);
                    Buffer[name] = '';
                }
            });
        }
        
        function log(data) {
            write(data, 'log-msg');
        }
        
        function error(data) {
            write(data, 'error-msg');
        }
    }
    
    function abortPrompt() {
        if (isPrompt())
            jqconsole.AbortPrompt();
    }
    
    function setPromptLabel(prompt) {
        jqconsole.SetPromptLabel(prompt);
        jqconsole.UpdatePromptLabel();
    }
    
    function addShortCuts(jqconsole) {
        jqconsole.RegisterShortcut('Z', () => {
            jqconsole.SetPromptText('');
        });
        
        jqconsole.RegisterShortcut('L', clear);
        
        Object.keys(ShortCuts).forEach((key) => {
            const func = ShortCuts[key];
            
            jqconsole.RegisterShortcut(key, func);
        });
    }
    
    function addKeyWhenNoPrompt(jqconsole) {
        const skip = skipfirst(readNoPrompt);
        
        jqconsole
            .$input_source[0]
            .addEventListener('keydown', (event) => {
                const ENTER = 13;
                const is = isPrompt();
                
                if (is)
                    return skip.clear();
                
                skip(event.keyCode === ENTER, event);
            });
    }
    
    function readNoPrompt(event) {
        const KEY_C = 67;
        const isCtrl = event.ctrlKey || event.metaKey;
        const isC = event.keyCode === KEY_C;
        
        if (isC && isCtrl)
            return Spawn.kill();
        
        const char = fromCharCode(event);
        
        if (!char)
            return;
        
        Spawn.write(char);
        jqconsole.Write(char);
    }
    
    function fromCharCode(event) {
        let char = '';
        
        const shift = event.shiftKey;
        const identifier = event.key || event.keyIdentifier;
         
        if (identifier === 'Enter')
            return '\n';
        
        if (!event.key) {
            const code = identifier.substring(2);
            const hex = parseInt(code, 16);
            
            if (!isNaN(hex))
                char = String.fromCharCode(hex);
            
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
    
    return this;
}

