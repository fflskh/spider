require('./lib/init');

const kue = require('kue');
const jobs = require(_base + 'jobs');
const middleware = require(_base + 'middleware');

try {
    let context = {};
    context.queue = kue.createQueue({
        prefix: _config.get('kue.prefix'),
        redis: {
            port: _config.get('redis.port'),
            host: _config.get('redis.host'),
            auth: _config.get('redis.auth'),
            db: _config.get('redis.db'),
            options: _config.get('redis.options')
        },
        jobEvents: false
    });

    middleware.mongoConnector(_config.get('mongodb'));
    context.redisClient = middleware.redisConnector(_config.get('redis'));

    jobs.run({
        context: context
    });
} catch (error) {
    console.error('error occured in server, error : ', error);
}


kue.app.set('title', _config.get('appName'));
kue.app.listen(_config.get('port'));

process.on('uncaughtException', (err) => {
    console.error('uncaught exception, error: ', err);
});

process.on('unhandledRejection', (reason, p) => {
    console.error('on handled rejection：', p, 'reason：', reason);
});
