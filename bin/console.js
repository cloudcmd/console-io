#!/usr/bin/env node

import process from 'node:process';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import express from 'express';
import {webconsole} from '../server/index.js';
import pack from '../package.json' with {
    type: 'json',
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const {argv} = process;

const argvLast = argv
    .slice()
    .pop();

switch(argvLast) {
case '-v':
    version();
    break;

case '--v':
    version();
    break;

default:
    start();
}

function start() {
    const DIR = `${__dirname}/../`;
    
    const app = express();
    const server = http.createServer(app);
    
    const port = process.env.PORT
        ||     /* c9           */process.env.app_port
        ||     /* nodester     */process.env.VCAP_APP_PORT
        ||     /* cloudfoundry */1337;
    
    const ip = process.env.IP ||     /* c9 */'0.0.0.0';
    
    const online = false;
    
    app
        .use('/', webconsole({
        server,
        online,
    }))
        .use(express.static(DIR));
    
    webconsole.listen({
        server,
    });
    
    server.listen(port, ip);
    
    console.log('url: http://' + ip + ':' + port);
}

function version() {
    console.log('v' + pack.version);
}
