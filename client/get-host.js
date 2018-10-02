'use strict';

/* global location */

module.exports = () => {
    const l = location;
    const href = l.origin || l.protocol + '//' + l.host;
    
    return href;
}

