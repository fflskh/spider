const cheerio = require('cheerio');
const Base = require('./Base');

class SeriesBrief extends Base {
    constructor(context) {
        super(context);
        this.type = 'seriesBrief';
    }

    async process (data) {
        let self = this;
        let series = data.series;
        let headers = data.headers;

        if(!series.originalLink) {
            await self.pipeline.updateOneDoc({
                modelName: 'Series',
                where: {_id: series._id},
                model: {hasBriefCrawled: true}
            });

            return null;
        }

        let requestOptions = {
            url: series.originalLink,
            headers: headers
        };
        try {
            let briefInfos = [];
            let html = await this.download(requestOptions);
            let $ = cheerio.load(html);

            $('.carx-list-box').each(function () {
                // console.log('car list div-id : ', $(this).attr('id'));
                if($(this).attr('id') === 'by-being-sale') {
                    return;
                }

                try {
                    let year = parseInt($(this).attr('id').split('by-year-')[1]);
                    $(this).find('.carx-item').each(function () {
                        let info, recommend=false, onSale=true, onProduce=true, imagesUrl, configUrl;

                        let objs = $(this).find('.carx-item-table span');
                        let first = objs[0];    // '.carx-item-table span:first'
                        let last = objs[2];     // '.carx-item-table span:last'
                        info = _utils.trim($(first).text());
                        let stateObj = $(this).find('.carx-item-table span i');
                        if(stateObj && stateObj.hasClass('state00')) {
                            recommend = true;
                        }
                        if(stateObj && stateObj.hasClass('state30')) {
                            onSale = true;
                            onProduce = false;
                        }
                        if(stateObj && stateObj.hasClass('state40')) {
                            onSale = false;
                            onProduce = false;
                        }

                        $(last).find('a').each(function() {
                            if($(this).text() === '图片') {
                                imagesUrl = self.host + $(this).attr('href');
                            }
                            if($(this).text() === '配置') {
                                configUrl =  self.host + $(this).attr('href');
                            }
                        });

                        briefInfos.push({
                            seriesId: series._id,
                            info: info,
                            year: year,
                            recommend: recommend,
                            onSale: onSale,
                            onProduce: onProduce,
                            imagesUrl: imagesUrl,
                            configUrl: configUrl,
                            hasImageCrawled: false,
                            hasConfigCrawled: false
                        });
                    });
                } catch(error) {
                    console.error('resolve cars by years error : ', error);
                }
            });

            await self.pipeline.save({
                modelName: 'SeriesBrief',
                data: briefInfos
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * 爬取车系列的简要信息时，headers同公用的不同
     * @param opts
     * @returns {Promise.<void>}
     */
    async execute (opts) {
        let self = this;
        let headers = opts.headers;
        let parallelCount = 100;

        try {
            let seriesDocs = await this.pipeline.findDocs({
                modelName: 'Series',
                where: {hasBriefCrawled: {$ne: true}}
            });

            //先绑定job处理函数
            this.bindJobProcessHandler(this.process.bind(this));

            await _utils.parallel(seriesDocs, parallelCount, async function(series) {
                await self.createJob({series, headers});
            });
        } catch(error) {
            console.error(error);
            throw error;
        }
    }
}

module.exports = SeriesBrief;
