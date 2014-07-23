var $, Util;

(function(window) {
    'use strict';
    
    var Socket  = new window.Socket(),
        CHANNEL = 'console-data',
        
        log     = Util.exec.with(write, 'log'),
        error   = Util.exec.with(write, 'error'),
        
        Buffer  = {
            log     : '',
            error   : ''
        },
        
        Element, jqconsole;
    
     window.addEventListener('load', load);
     
     function load() {
        window.removeEventListener('load', load);
         
        Element     = document.querySelector('.console');
        jqconsole   = $(Element).jqconsole('', '> ');
        
        setURL();
        addListeners();
    }
     
    function setURL() {
        var url     = prompt('URL'),
            regExp  = RegExp('^https?://'),
            isHTTP  = url.match(regExp);
        
        if (!isHTTP)
            url = 'http://' + url;
        
        localStorage.setItem('Console-URL', url);
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
    
})(this);
