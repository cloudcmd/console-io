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
            
            case '.json':
                load.json(src, callback);
                break;
            }
        }
        
        load.js     = function(src, callback) {
            var id  = getIdBySrc(src),
                el  = document.getElementById(id);
            
            if (el) {
                callback();
            } else {
                el      = document.createElement('script');
                el.id   = id;
                el.src  = src;
                el.addEventListener('load', callback);
            
                document.body.appendChild(el);
            }
            
            return el;
        };
        
        load.css    = function(src, callback) {
            var id  = getIdBySrc(src),
                el  = document.getElementById(id);
            
            if (el) {
                callback();
            } else {
                el      = document.createElement('link');
                el.id   = getIdBySrc(src);
                el.rel  = 'stylesheet';
                el.href = src;
                el.addEventListener('load', callback);
                
                document.head.appendChild(el);
            }
            
            return el;
        };
        
        load.json   = function(url, callback) {
            var request = new XMLHttpRequest();
            
            request.open('GET', url, true);
            
            request.addEventListener('load', function() {
                var data;
                
                if (request.status >= 200 && request.status < 400){
                    data = JSON.parse(request.responseText);
                    callback(null, data);
                }
            });
            
            request.addEventListener('error', callback);
            
            request.send();
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
        
        function getIdBySrc(src) {
            var num, sub, id,
                isStr       = typeof src === 'string';
            
            if (isStr) {
                num    = src.lastIndexOf('/') + 1,
                sub    = src.substr(src, num),
                id     = src.replace(sub, '');
                
                /* убираем точки */
                while (id.indexOf('.') > 0)
                    id = id.replace('.', '-');
            }
            
            return id;
        } 
        
        return load;
    }
})(window);
