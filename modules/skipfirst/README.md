# Skipfirst

Skip first time condition are true and call function next time.

## Install

With npm:

```
npm i skipfirst --save
```

or with bower:

```
bower i skipfirst --save
```

## How to use?

```js
var skipfirst   = require('skipfirst'),
    skip        = skipfirst(function(identifier) {
        console.log('first was skiped:', identifier);
    });

/* 
 * first enter key press would be skiped 
 * and called next time
 */
document.body.addEventListener('keydown', function(event) {
    var key         = event.keyCode,
        identifier  = event.keyIdentifier,
        ENTER       = 13,
        ESC         = 27;
    
    if (key === ESC)
        skip.clear();
    else
        skip(key === ENTER, identifier);
});
```

## License

MIT
