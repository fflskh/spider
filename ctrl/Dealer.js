const cheerio = require('cheerio');
const Base = require('./Base');

class Dealer extends Base {
    constructor(context) {
        super(context);
        this.type = 'dealer';
    }

    async upsertDealers (opts) {
        let self = this;
        let models = opts.models;

        return await _utils.parallel(models, 10, async function (model) {
            let dealer = await self.pipeline.findOneDoc({
                modelName: 'Dealer',
                where: {originalId: model.originalId}
            });

            if(!dealer) {
                return await self.pipeline.saveOne({
                    modelName: 'Dealer',
                    data: model
                });
            }

            let seriesIds = _.uniq(dealer.seriesIds.concat(model.seriesIds));
            return await self.pipeline.updateOneDoc({
                modelName: 'Dealer',
                where: {originalId: model.originalId},
                model: seriesIds
            });
        });
    }

    async process (opts) {
        let self = this;
        let series = opts.series;
        let headers = opts.headers;

        try {
            //没有origin link
            if(!series.originalLink) {
                await self.pipeline.updateOneDoc({
                    modelName: 'Series',
                    where: {_id: series._id},
                    model: {hasDealerCrawled: true}
                });

                return null;
            }
            //直接通过接口爬取，不通过页面爬取
            let seriesid = series.originalLink.match(/series\/[0-9]{1,}/g)[0].replace('series/', '').replace('/', '');
            seriesid = parseInt(seriesid);

            //说明origin link有问题
            if(!seriesid) {
                await self.pipeline.updateOneDoc({
                    modelName: 'Series',
                    where: {_id: series._id},
                    model: {hasDealerCrawled: true}
                });

                return null;
            }

            //按省份爬
            let provinces = await this.pipeline.findDocs({
                modelName: 'Province',
                where: {}
            });

            await _utils.parallel(provinces, 1, async function(province) {
                let cities = province.list;
                if(!cities.length) {
                    //直辖市
                    cities.push({
                        cityid: province.provinceid
                    });
                }

                await _utils.parallel(cities, 5, async function (city) {
                    let configUrl = self.host + '/dealer/list';
                    let queryString = `seriesid=${seriesid}&cityid=${city.cityid}`;
                    headers['Content-Length'] = queryString.length;
                    headers.Host = self.hostWithoutHTTP;
                    headers.Origin = self.host;
                    headers.Referer = series.originalLink;

                    let requestOptions = {
                        url: configUrl,
                        headers: headers,
                        method: 'POST',
                        form: queryString,
                        timeout: 60 * 1000 //超时时间1min
                    };

                    let json = await self.download(requestOptions);
                    if(typeof json === 'string') {
                        json = JSON.parse(json);
                    }

                    let dealers = [];
                    let hotdealers = json.body.hotdealers || [];
                    let normaldealers = json.body.normaldealers || [];
                    let allDealers = hotdealers.concat(normaldealers);

                    allDealers.forEach(dealer => {
                        let data = {};
                        data.seriesIds = [seriesid];
                        data.cityid = dealer.cityid ? parseInt(dealer.cityid) : null;
                        data.baidulat = dealer.baidulat ? parseFloat(dealer.baidulat) : null;
                        data.baidulon = dealer.baidulon ? parseFloat(dealer.baidulon) : null;
                        data.address = dealer.dealeraddress;
                        data.businessLicense = dealer.dealerbusinessLicense;
                        data.linkman = dealer.dealerlinkman;
                        data.mobile = dealer.dealermobile;
                        data.name = dealer.dealername;
                        data.owner = dealer.dealerowner;
                        data.originalId = dealer.id ? parseInt(dealer.id) : null;
                        data.ontop = dealer.ontop ? parseInt(dealer.ontop) : 0;
                        data.ontoptime = dealer.ontoptime;
                        data.provinceid = province.provinceid;
                        data.shortname = dealer.shortname;
                        data.status = dealer.status || 0;

                        dealers.push(data);
                    });

                    return await self.upsertDealers({models: dealers});
                });
            });

            return await self.pipeline.updateOneDoc({
                modelName: 'Series',
                where: {_id: series._id},
                model: {hasDealerCrawled: true}
            });
        } catch(error) {
            console.error(error);
            throw error;
        }
    }

    /**
     *
     * @param opts
     *  url:
     *  headers:
     * @returns {Promise.<void>}
     */
    async execute (opts) {
        let self = this;
        let headers = opts.headers;
        let parallelCount = 100;

        try {
            let seriesDocs = await this.pipeline.findDocs({
                modelName: 'Series',
                where: {hasDealerCrawled: {$ne: true}}
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

module.exports = Dealer;
