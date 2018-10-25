/* global $ */

'use strict';

require('../css/console.css');
require('../css/ansi.css');

const load = require('load.js');
const skipfirst = require('skipfirst');
const {promisify} = require('es6-promisify');
const tryToCatch = require('try-to-catch/legacy');

const Spawn = require('./spawn');

const loadJSON = promisify(load.json)
const loadSeries = promisify(load.series);

module.exports = async (element, options = {}) => {
    const [jqconsole, spawn] = await init(element, options);
    const konsole = Console(element, {
        jqconsole,
        spawn,
    });
    
    return konsole;
};

async function init(element, options) {
    const el = getElement(element);
    
    const socketPath = options.socketPath || '';
    const prefix = options.prefix || '/console';
    const prefixSocket = options.prefixSocket || '/console';
    const env = options.env || {};
    const cwd = options.cwd || '';
    
    await loadAll(prefix);
    
    const jqconsole = $(el).jqconsole('', '> ');
    const spawn = Spawn(jqconsole, {
        env,
        cwd,
        prefixSocket,
        socketPath,
    });
    
    return [
        jqconsole,
        spawn,
    ];
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

function getElement(el) {
    if (typeof el !== 'string')
        return el;
    
    return document.querySelector(el);
}

function Console(element, {spawn, jqconsole}) {
    let ShortCuts = {};
    
    if (!(this instanceof Console))
        return new Console(element, {
            spawn,
            jqconsole,
        });
    
    const self = this;
    
    addShortCuts(jqconsole);
    addKeyWhenNoPrompt(jqconsole);
    addOnMouseUp(jqconsole);
    
    this.on = (...args) => {
        spawn.on(...args);
    };
    
    this.emit = (...args) => {
        spawn.emit(...args);
    };
    
    this.handler = spawn.handler;
    
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
    
    function isPrompt() {
        const state = jqconsole.GetState();
        return state === 'prompt';
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

