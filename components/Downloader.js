class Downloader {
    constructor () {
    }

    async download(requestOptions) {
        console.log('downloading from : %j', requestOptions);
        return await _utils.request(requestOptions);
    }
}

module.exports = Downloader;

