#!/usr/bin/env node

(function() {
    'use strict';
    
    var server = require('../lib/server');
    
    server.start({
        port: 9999,
        ip: '0.0.0.0'
    });
    
})();
