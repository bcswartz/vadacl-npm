module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: [ 'browserify', 'jasmine' ],
        preprocessors: {
            '**/*.ts': [ 'browserify' ]
        },
        files: [
            { pattern: './src/*.spec.ts' }
        ],
        mime: {
            'text/x-typescript': ['ts']
        },
        browserify: {
            debug: true,
            plugin: [
                [ 'tsify', { target: 'es5' } ]
            ]
        },
        autoWatch: true,
        browsers: [ 'Chrome' ],
        singleRun: false,
        port: 9876,
        logLevel: config.LOG_INFO,
        reporters: [ 'progress', 'kjhtml' ]
    });
};

