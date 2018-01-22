const Base = require('./Base');

class City extends Base {
    constructor(context) {
        super(context);
        this.type = 'city';
    }

    async process (data) {
        let url = data.url;
        let headers = data.headers;
        let method = data.method;

        console.log('start to process job with data: ', data);

        let requestOptions = {url, headers, method};
        try {
            let json = await this.download(requestOptions);
            if(typeof json === 'string') {
                json = JSON.parse(json);
            }

            await this.pipeline.save({
                modelName: 'Province',
                data: json.data
            });
        } catch(error) {
            console.error(error);
            throw error;
        }
    }

    async execute (opts) {
        let url = opts.url;
        let headers = opts.headers;
        let method = opts.method;

        console.log('start to crawl cities.');
        try {
            //先绑定job处理函数
            this.bindJobProcessHandler(this.process.bind(this));

            await this.createJob({url, headers, method});
        } catch(error) {
            console.error(error);
            throw error;
        }
    }
}

module.exports = City;
