 (function() {
    'use strict';
    
    var DIR                 = './',
        DIR_SERVER          = DIR + 'server/',
        
        socket              = require(DIR_SERVER + 'socket'),
        Console             = require(DIR_SERVER + 'console');
    
    module.exports          = start;
    
    /**
     * start server function
     * @param pConfig
     * @param pProcessing {index, appcache, rest}
     */
    function start(server) {
        socket.listen(server);
        Console.init();
    }
    
})();
