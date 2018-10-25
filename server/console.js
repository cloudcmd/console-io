'use strict';

const io = require('socket.io');
const tildify = require('tildify');
const debug = require('debug');
const wraptile = require('wraptile');

const logConsole = debug('console');
const logClients = debug('console:clients');
const rmLastSlash = (a) => a.replace(/\/$/, '') || '/';

const WIN = process.platform === 'win32';
const CWD = process.cwd();

const Clients = [];
const connectWraped = wraptile(connect);

const cwd = (conNum) => (path) => {
    if (!path)
        return Clients[conNum].cwd;
    
    Clients[conNum].cwd = path;
};

let Socket;
let ConNum = -1;

module.exports = (socket, options) => {
    const o = options || {};
    const prefixSocket = o.prefixSocket || '/console';
    
    if (socket)
        Socket = socket;
    else if (o.server)
        Socket = io.listen(o.server);
    else
        throw Error('server or socket should be passed in options!');
    
    const auth = options.auth;
    check(auth);
    
    Socket
        .of(prefixSocket)
        .on('connection', (socket) => {
            const connection = connectWraped(options, socket);
            
            if (!auth)
                return connect(options, socket);
            
            const reject = () => socket.emit('reject');
            socket.on('auth', auth(connection, reject));
        });
};

module.exports.getSocketPath = () => {
    return Socket.path();
};

function connect(options, socket) {
    const execute = options.execute;
    const indexEmpty = Clients.indexOf(null);
    
    logClients('add before:', Clients);
    
    if (indexEmpty >= 0)
        ConNum = indexEmpty;
    else
        ConNum = Clients.length;
    
    const msg = log(ConNum + 1, 'console connected\n');
    const cwd = socket.handshake.headers['x-cwd'] || CWD;
    const dir = WIN ? cwd : tildify(cwd);
     
    socket.emit('data', msg);
    socket.emit('label', options.prompt || rmLastSlash(dir));
    socket.emit('prompt');
    
    Clients[ConNum] = {
        cwd
    };
    
    logClients('add after:', Clients);
    
    const onMessage = processing.bind(null, socket, ConNum, execute);
    const onDisconnect = ((conNum) => {
        logClients('remove before:', Clients);
        
        if (Clients.length !== conNum + 1) {
            Clients[conNum] = null;
        } else {
            Clients.pop();
            --ConNum;
        }
        
        logClients('remove after:', Clients);
        
        log(conNum, 'console disconnected');
        
        socket.removeListener('command', onMessage);
        socket.removeListener('disconnect', onDisconnect);
    }).bind(null, ConNum);
    
    socket.on('command', onMessage);
    socket.on('disconnect', onDisconnect);
}

function processing(socket, conNum, fn, command) {
    log(conNum, command.cmd);
    
    fn(socket, command, cwd(conNum));
}

function getType(type) {
    if (!type)
        return ' ';
    
    return ` ${type}:`;
}

function log(connNum, str, typeParam) {
    if (!str)
        return;
    
    const type = getType(typeParam);
    const ret = 'client #' + connNum + type + str;
    
    logConsole(ret);
    
    return ret;
}

function check(auth) {
    if (auth && typeof auth !== 'function')
        throw Error('options.auth should be function!');
}

