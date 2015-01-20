(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports = skipfirst;
    else
        global.skipfirst = skipfirst;
        
    function skipfirst(callback) {
        var first,
            fn      = function(condition) {
                var args        = [].slice.call(arguments);
                
                args.shift();
                
                if (!first)
                    first = condition;
                else
                    callback.apply(null, args);
            };
        
        if (!callback)
            throw(Error('callback could not be empty!'));
        
        fn.clear    = function() {
            first = null;
        };
        
        return fn;
    }
    
})(this);
