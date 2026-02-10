/* global $ */
import '../css/console.css';
import '../css/ansi.css';
import load from 'load.js';
import skipfirst from 'skipfirst';
import {tryToCatch} from 'try-to-catch';
import Spawn from './spawn.js';

const isString = (a) => typeof a === 'string';

export default async (element, options = {}) => {
    const [jqconsole, spawn] = await init(element, options);
    const konsole = Console(element, {
        jqconsole,
        spawn,
    });
    
    return konsole;
};

async function init(element, options) {
    const el = getElement(element);
    
    const {
        socketPath = '',
        prefix = '/console',
        prefixSocket = '/console',
        env = {},
        cwd = '',
    } = options;
    
    await loadAll(prefix);
    
    const jqconsole = $(el).jqconsole('', '> ');
    const spawn = Spawn(jqconsole, {
        env,
        cwd,
        prefixSocket,
        socketPath,
    });
    
    return [jqconsole, spawn];
}

async function loadAll(prefix) {
    let [error, remote] = await tryToCatch(load.json, `${prefix}/modules.json`);
    const names = [
        'jQuery',
        'io',
    ];
    
    if (error)
        /*eslint no-console: 0*/
        return console.error(error);
    
    /* do not load jquery if it is loaded */
    for (const name of names) {
        if (!window[name])
            continue;
        
        const reg = RegExp(name, 'i');
        
        remote = remote.filter((item) => !reg.test(item));
    }
    
    await load.series(remote);
}

function getElement(el) {
    if (!isString(el))
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
    
    addShortCuts(jqconsole);
    addKeyWhenNoPrompt(jqconsole);
    addOnMouseUp(jqconsole);
    
    this.on = spawn.on;
    
    this.emit = spawn.emit;
    
    this.handler = spawn.handler;
    
    this.addShortCuts = (shortCuts) => {
        if (shortCuts)
            ShortCuts = shortCuts;
    };
    
    this.getPromptText = () => {
        if (jqconsole.GetState() !== 'output')
            return jqconsole.GetPromptText();
        
        return '';
    };
    
    this.setPromptText = (text) => {
        jqconsole.SetPromptText(text);
    };
    
    this.focus = () => {
        if (jqconsole)
            jqconsole.Focus();
    };
    
    function addOnMouseUp({$console}) {
        $console.mouseup(() => {
            const isSelection = String(globalThis.getSelection());
            
            if (isSelection)
                return;
            
            const top = $console.scrollTop();
            
            globalThis.focus();
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
        
        for (const key of Object.keys(ShortCuts)) {
            const func = ShortCuts[key];
            
            jqconsole.RegisterShortcut(key, func);
        }
    }
    
    function addKeyWhenNoPrompt(jqconsole) {
        const skip = skipfirst(readNoPrompt);
        
        jqconsole.$input_source[0].addEventListener('keydown', (event) => {
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
            return spawn.kill();
        
        const char = fromCharCode(event);
        
        if (!char)
            return;
        
        spawn.write(char);
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
        jqconsole.Prompt(true, spawn.handler);
    }
    
    return this;
}
