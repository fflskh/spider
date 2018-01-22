const redis = require('redis');
const bluebird = require('bluebird');

module.exports = async function (config) {
    _logger.info(`connect to redis, host: ${config.host}, port: ${config.port}`);

    //promisify redis的实例方法，在原有的方法加上后缀Async。例如：原方法为get('foo')，promise方法为getAsync('foo')
    bluebird.promisifyAll(redis.RedisClient.prototype);

    let client = redis.createClient({
        host: config.host,
        port: config.port
    });
    if(config.auth) {
        client.auth(config.auth);
    }

    return client;
};