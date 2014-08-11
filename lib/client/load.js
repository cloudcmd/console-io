(function(window) {
    'use strict';

    window.load = new LoadProto();
    
    function LoadProto() {
        function load(src, callback) {
            var ext = getExt(src);
            
            switch (ext) {
            case '.js':
                load.js(src, callback);
                break;
            
            case '.css':
                load.css(src, callback);
                break;
            }
        }
        
        load.js     = function(src, callback) {
            var el  = document.createElement('script');
            
            el.src  = src;
            el.addEventListener('load', callback);
            
            document.body.appendChild(el);
        };
        
        load.css    = function(src, callback) {
            var el  = document.createElement('link');
            
            el.rel  = 'stylesheet';
            el.href = src;
            
            el.addEventListener('load', callback);
            
            document.head.appendChild(el);
        };
        
        load.series = function(urls, callback) {
            var url = urls.shift();
                
            if (!url)
                callback();
            else
                load(url, function() {
                    load.series(urls, callback);
                });
        };
        
        load.parallel = function(urls, callback) {
            var i       = urls.length,
                func    = function() {
                    --i;
                    
                    if (!i)
                        callback();
                };
                
            urls.forEach(function(url) {
                load(url, func);
            });
        };
        
        function getExt(name) {
            var ret     = '',
                dot,
                isStr   = typeof name === 'string';
            
            if (isStr) {
                dot = name.lastIndexOf('.');
                
                if (~dot)
                    ret = name.substr(dot);
            }
            
            return ret;
        }
        
        return load;
    }
})(window);
