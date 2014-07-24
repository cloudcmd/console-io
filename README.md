Console
=======

Web console used in [Cloud Commander](http://cloudcmd.io).

![Console](https://raw.githubusercontent.com/cloudcmd/console/master/img/console.png "Console")

## Install

`npm i console-io -g`

## Use as standalone

Start `console`, go to url `http://localhost:1337`


## Use as middleware

To use `Console` in your programs you should make local install:

`npm i console-io express --save`

And use it in your program

```js
    var webconsole  = require('console-io'),
        http        = require('http'),
        express     = require('express'),
        
        app         = express(),
        server      = http.createServer(app),
        
        port        = 1337,
        ip          = '0.0.0.0';
        
        webconsole(server);
        
        app.use(express.static(__dirname + 'node_modules/console-io'));
        
        server.listen(port, ip);
```

## License

MIT