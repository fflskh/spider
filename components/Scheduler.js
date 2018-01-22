
class Scheduler {
    constructor(queue) {
        this.queue = queue;
    }

    async enqueue (opts) {
        let data = opts.data;
        let type = opts.type;
        let priority = opts.priority;
        let config = _config.get('kue');

        if(!priority) {
            priority = config.priority;
        }
        if(!this.queue) {
            throw new Error('kue instance is empty.');
        }

        let job = this.queue.create(type, data);
        job.priority(priority);
        if(config.attempts) {
            job.attempts(config.attempts);
        }
        if(config.backoff && config.backoff.enable) {
            job.backoff({delay: config.backoff.delay, type: config.backoff.type});
        }
        job.removeOnComplete(true);

        new Promise((resolve, reject) => {
            job.save(error => {
                // console.log(`Job #${job.id} is created.`);
                if(error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        return job;
    }

    async batchEnqueue () {

    }

    async deQueue () {

    }

    async batchDeQueue () {

    }
}

module.exports = Scheduler;