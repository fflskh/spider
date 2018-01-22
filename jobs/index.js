const fs = require('fs');
const path = require('path');

function loadJobs() {
    let dir = __dirname;

    let Jobs = [];
    fs.readdirSync(dir).forEach(filename => {
        //跳过index.js和非js文件
        if(filename === 'index.js' || !/\.js$/.test(filename)) {
            return;
        }

        let fullPath = path.join(dir, filename);
        let stat = fs.statSync(fullPath);

        //如果是文件夹，跳过
        if(stat.isDirectory()) {
            return;
        }

        let match = /(\w+)\.js/.exec(filename);
        if(match) {
            console.log('require job from path: ', fullPath);
            Jobs.push(require(fullPath));
        }
    });

    return Jobs;
}

module.exports.run = async function(opts) {
    let context = opts.context;
    let Jobs = loadJobs();

    return await _utils.parallel(Jobs, 10, async Job => {
        try {
            let job = new Job(context);
            return await job.crawl();
        } catch(error) {
            console.error('catch error when running crawl jobs, error is :\n', error);
        }
    });
};