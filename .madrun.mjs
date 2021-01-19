import {run} from 'madrun';

export default {
    'start': () => 'node bin/console',
    'start:dev': () => 'NODE_ENV=development npm start',
    'build-progress': () => 'webpack --progress',
    'build:client': () => run('build-progress', '--mode production'),
    'build:client:dev': async () => `NODE_ENV=development ${await run('build-progress', '--mode development')}`,
    'build:start': () => run(['build:client', 'start']),
    'build:start:dev': () => run(['build:client:dev', 'start:dev']),
    'build': () => run('build:client*'),
    'wisdom': () => run('build'),
    'watcher': () => 'nodemon -w client -w server --exec',
    'watch:lint': () => run('watcher', '\'npm run lint\''),
    'watch:client': () => run('build:client', '--watch'),
    'watch:client:dev': () => run('build:client:dev', '--watch'),
    'lint': () => 'putout .',
    'fresh:lint': () => run('lint', '--fresh'),
    'lint:fresh': () => run('lint', '--fresh'),
    'fix:lint': () => run('lint', '--fix'),
};

