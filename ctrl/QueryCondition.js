const cheerio = require('cheerio');
const Base = require('./Base');

class QueryCondition extends Base {
    constructor(context) {
        super(context);
        this.type = 'queryCondition';
    }

    async process (data) {
        let url = data.url;
        let headers = data.headers;
        let method = data.method;

        let requestOptions = {url, headers, method};

        try {
            let html = await this.download(requestOptions);
            let $ = cheerio.load(html);

            let conditions = [];
            $('.OdCarConditionContainer > dl').each(function () {
                $(this).children('dt').each(function() {
                    let key, values=[];
                    key = $(this).text().split('：')[0];

                    values.push($(this).next().find('a').text());
                    $(this).next().next().find('a.btn > span').each(function(){
                        values.push($(this).text());
                    });
                    $(this).next().next().find('label > span').each(function(){
                        values.push($(this).text());
                    });

                    conditions.push({key, values});
                });
            });

            return await this.pipeline.save({
                modelName: 'Query',
                data: conditions
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async execute (opts) {
        let url = opts.url;
        let headers = opts.headers;
        let method = opts.method;

        console.log('start to crawl query condition.');

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

module.exports = QueryCondition;
