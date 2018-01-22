const Downloader = require(_base + 'components/Downloader');
const Pipeline = require(_base + 'components/Pipeline');
const Scheduler = require(_base + 'components/Scheduler');
const ctrl = require(_base + 'ctrl');

class Base {
    constructor(context) {
        this.context = context;
        this.queue = context.queue;
        this.ctrl = ctrl;
        this.downloader = new Downloader();
        this.pipeline = new Pipeline();
        this.scheduler = new Scheduler(this.queue);
        this.name = 'laosiji'; //name和Spider中name保持一致
        this.host = context[this.name].host;
        this.hostWithoutHTTP = context[this.name].hostWithoutHTTP;
    }

    initializeData (webData) {
        this.webData = webData;
        this.host = this.webData && this.webData.host;
        this.hostWithoutHTTP = this.webData && this.webData.hostWithoutHTTP;
    }

    async createJob (data) {
        return await this.scheduler.enqueue({
            type: this.type,
            data: data
        });
    }

    async download (requestOptions) {
        return await this.downloader.download(requestOptions);
    }

    /**
     * job处理函数的标准格式：
     * queue.process(type, concurrency, function(job, done){ });
     *
     * @param handler
     */
    bindJobProcessHandler (handler) {
        this.queue.process(this.type, _config.get('kue.concurrency'), (job, callback) => {
            handler(job.data).then(res => {
                console.log(`job with type "${job.type}" has done!`);
                callback();
            }).catch(error => {
                console.error(`process job "${job.type}" failed: `, error);
                callback(error);
            });
        });
    }
}

module.exports = Base;
