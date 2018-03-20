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

`Console` inhertis from [Emitify](https://github.com/coderaiser/emitify) so you can subscribe to next events:

- `path`

```js
const konsole = Console();
konsole.on('path', console.log);
```

#### Console(element [, options, prefix], callback)

- element   - html element, or selector
- prefix    - (optional) prefix to url (same as in server)
- options   - (optional) {cwd}
- callback  - function to call after init

When prefix set in server and client, you should use same prefix in html.
For example, if you use prefix "any_prefix" you should connect
console script in this way:

`<script src="/any_prefix/console.js"></script>`

#### addShortCuts(shortCuts)

- shortCuts - object contain big letter and function.

Example: show alert on `Ctrl + A`:

```js
const konsole = Console();
konsole.addShortCuts({
    'A': function() {
        alert('hello');
    }
});
```

#### getPromptText()

Get text of prompt.

#### setPromptText(text)

- text - string of new text

Set new text of prompt.

#### focus()

Set focus on Console.

### Server API

#### Console(options)

Could be used as middleware, or for init `Console`.

```js
Console.listen(socket, {
    server: server,                          /* when no socket*/
    online: true,                            /* default */
    prefix: '/console'                       /* default */
    authCheck: function(socket, success) {   /* authorization function */
    }
})
```

#### Console.middle(options)

Middleware function if there is a need of init `socket` in another place.

```js
Console({
    prefix: '/console', /* default */
    online: true,       /* default */
})
```

## Use as middleware

To use `Console` in your programs you should make local install:

`npm i console-io express --save`

And use it in your program

```js
/* server.js */

const webconsole  = require('console-io');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);

const port = 1337;
const ip = '0.0.0.0';

const online = true;
app .use(webconsole({
    server,
    online, /* load jquery and socket.io from cdn */
})).use(express.static(__dirname));

webconsole.listen({
    server
});

server.listen(port, ip);
```

```html
<!-- index.html -->

<div class="console"></div>
<script src="/console/console.js"></script>
<script>
    const options = {
        prefix: 'console',
        env: {
            CURRENT_FILE: getCurrentFile(),
            CURRENT_APP: 'console-io'
        }
    };
    
    const konsole = Console('.console', options, function() {
        console.log('console ready')
    });
    
    konsole.focus();
    
    function getCurrentFile() {
        return 'filename.txt';
    }
</script>
```

## License

MIT

