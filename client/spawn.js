'use strict';

/* global io */

const getHost = require('./get-host');
const getEnv = require('./get-env');

module.exports = SpawnProto;

function SpawnProto(jqconsole, options) {
    if (!(this instanceof SpawnProto))
        return new SpawnProto(jqconsole, options);
    
    const Buffer = {
        'log-msg': '',
        'error-msg': ''
    };
    
    function setPromptLabel(prompt) {
        jqconsole.SetPromptLabel(prompt);
        jqconsole.UpdatePromptLabel();
    }
    
    function getPromptText() {
        if (jqconsole.GetState() !== 'output')
            return jqconsole.GetPromptText();
        
        return '';
    }
    
    function isPrompt() {
        const state = jqconsole.GetState();
        return state === 'prompt';
    }
    
    function abortPrompt() {
        if (isPrompt())
            jqconsole.AbortPrompt();
    }
    
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
        
        const {
            socketPath,
            prefixSocket,
        } = options;
        
        socket = io.connect(href + prefixSocket, {
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
                jqconsole.SetPromptText(promptText.pop());
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
            promptText.push(getPromptText());
            
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
    
    this.handler = function handler(command) {
        if (command)
            return execute(command, env);
        
        jqconsole.Prompt(true, handler);
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

