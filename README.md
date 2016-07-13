Console [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL]
=======
[NPMIMGURL]:                https://img.shields.io/npm/v/console-io.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/cloudcmd/console/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/gemnasium/cloudcmd/console.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPM_INFO_IMG]:             https://nodei.co/npm/cloudcmd.png
[NPMURL]:                   https://npmjs.org/package/cloudcmd "npm"
[BuildStatusURL]:           https://travis-ci.org/cloudcmd/console  "Build Status"
[DependencyStatusURL]:      https://gemnasium.com/cloudcmd/console "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"


Web console used in [Cloud Commander](http://cloudcmd.io).

![Console](https://raw.githubusercontent.com/cloudcmd/console/master/img/console.png "Console")

## Install

`npm i console-io -g`

## Use as standalone

Start `console`, go to url `http://localhost:1337`

## Hot keys

|Key                    |Operation
|:----------------------|:--------------------------------------------
| `Ctrl + Z`            | cancel input
| `Ctrl + L`            | clear screen
| `Ctrl + C`            | kill running task

For more details see [Jq-console keyboard shortcuts](https://github.com/replit/jq-console#default-key-config).

## API

### Client API

#### Console(element [, prefix], callback)

- element   - html element, or selector
- prefix    - (optional) prefix to url (same as in server)
- callback  - function to call after init

When prefix set in server and client, you should use same prefix in html.
For example, if you use prefix "any_prefix" you should connect
console script in this way:

`<script src="/any_prefix/console.js"></script>`

#### Console.addShortCuts(shortCuts)

- shortCuts - object contain big letter and function.

Example: show alert on `Ctrl + A`:

```js
Console.addShortCuts({
    'A': function() {
        alert('hello');
    }
});
```

#### Console.getPromptText()

Get text of prompt.

#### Console.setPromptText(text)

- text - string of new text

Set new text of prompt.

#### Console.focus()

Set focus on Console.

### Server API

#### Console(options)

Could be used as middleware, or for init `Console`.

```js
Console({
    server: server,                         /* only one should be passed: */
    socket: socket,                         /* server or socket  */
    online: true,                           /* default */
    minify: true,                           /* default */
    prefix: '/console'                       /* default */
    authCheck: function(socket, success) {  /* authorization function */
    }
})
```

#### Console.middle(options)

Middleware function if there is a need of init `socket` in another place.

```js
Console.middle({
    prefix: '/console', /* default */
    online: true,       /* default */
    minify: true,       /* default */
})
```

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
    
app .use(webconsole({
        server: server,
        online: true /* load jquery and socket.io from cdn */
    }))
    .use(express.static(__dirname));

server.listen(port, ip);
```

```html
<!-- index.html -->

<div class="console"></div>
<script src="/console/console.js"></script>
<script>
    Console('.console', function() {
        console.log('console ready')
    });
</script>
```

## License

MIT
