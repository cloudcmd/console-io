Console
=======

Web console used in [Cloud Commander](http://cloudcmd.io).

![Console](https://raw.githubusercontent.com/cloudcmd/console/master/img/console.png "Console")

## Install

`npm i console-io -g`

## Use as standalone

Start `console`, go to url `http://localhost:1337`

## API

### Server API

**webconsole(server [,prefix])**

- server    - instance of server
- prefix    - prefix of console url to use in html


### Client API

**Console(element [, prefix], callback)**

- element   - html element, or selector
- prefix    - (optional) prefix to url (same as in server)
- callback  - function to call after init

When prefix set in server and client, you should use same prefix in html.
For example, if you use prefix "any_prefix" you should connect
console script in this way:

`<script src="/any_prefix/console.js"></script>`

**Console.addShortCuts(shortCuts)**

- shortCuts - object contain big letter and function.

Example: show alert on `Ctrl + A`:

```js
Console.addShortCuts({
    'A': function() {
        alert('hello');
    }
});
```

**Console.getPromptText()**

Get text of prompt.

**Console.setPromptText(text)**

- text - string of new text

Set new text of prompt.

## Use as middleware

To use `Console` in your programs you should make local install:

`npm i console-io express --save`

And use it in your program

```js
/* server.js */

var webconsole  = require('console-io'),
    http        = require('http'),
    express     = require('express'),
    
    app         = express(),
    server      = http.createServer(app),
    
    port        = 1337,
    ip          = '0.0.0.0';
    
app.use(express.static(__dirname));
app.use(webconsole(server));

server.listen(port, ip);
```

```html
<!-- index.html -->

<div class="console"></div>
<script src="/console/console.js"></script>
<script>
    (function() {
        'use strict';
        
        window.addEventListener('load', load);
        
        function load() {
            window.removeEventListener('load', load);
            
            Console('.console', function() {
                console.log('console ready')
            });
        }
    })()
</script>
```

## License

MIT