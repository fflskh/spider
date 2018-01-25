const request = require('request');
const zlib = require('zlib');
const Promise = require('bluebird');

function unzip (buffer, encoding, callback) {
    switch (encoding) {
    case 'gzip':
        zlib.gunzip(buffer, callback);
        break;
    case 'deflate':
        zlib.inflate(buffer, callback);
        break;
    default:
        callback(null, buffer);
        break;
    }
}

async function requestF (options) {
    options.method = (options.method || 'GET').toUpperCase();
    return new Promise((resolve, reject) => {
        request(options).on('response', function(response) {
            if(response.statusCode !== 200) {
                return reject(new Error(`response with status ${response.statusCode}`));
            }

            let chunks = [];
            response.on('data', data => {
                chunks.push(data);
            }).on('end', () => {
                let body = Buffer.concat(chunks);
                unzip(body, response.headers['content-encoding'], function(error, decodedBuffer) {
                    if(error) {
                        return reject(error);
                    }

                    return resolve(decodedBuffer.toString('utf8'));
                });
            }).on('error', reject);
        }).on('error', reject);
    });
}

requestF({
    "url": "http://www.laosiji.com/api/car/carxlistconfig",
    "headers": {
        "Host": "www.laosiji.com",
        "Connection": "keep-alive",
        "Content-Length": 12,
        "Origin": "http://www.laosiji.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Accept": "*/*",
        "Referer": "http://www.laosiji.com/car/spec/config/33356",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Cookie": "__DAYU_PP=IRu3ffEInf6avN2Qm3aV3686dac12629; UM_distinctid=15fab7221dc5ce-04e1433c041644-c303767-1fa400-15fab7221dd87d; OdStatisticsToken=c8b92db7-968e-4e90-ab2d-7d525b020cdb-1513951510284; CNZZDATA1261736092=1842276921-1510403921-https%253A%252F%252Fwww.baidu.com%252F%7C1516539089; JSESSIONID=F13DBDF255E275EC12D4E2CE944335E1"
    },
    "method": "POST",
    "form": "carxid=33356",
    "timeout": 120000
}).then(json => {
    if(typeof json === 'string') {
        json = JSON.parse(json);
    }
    console.log('%j', json.body);
}).catch(console.error);