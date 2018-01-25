const Base = require('./Base');

class SeriesConfig extends Base {
    constructor(context) {
        super(context);
        this.host = 'http://www.laosiji.com';
        this.type = 'seriesConfig';
    }

    async process(opts) {
        let self = this;
        let brief = opts.brief;
        let headers = opts.headers;

        //没有配置，直接pass
        if(!brief.configUrl || !_utils.isUrl(brief.configUrl, this.host)) {
            await self.pipeline.updateOneDoc({
                modelName: 'SeriesBrief',
                where: {_id: brief._id},
                model: {hasConfigCrawled: true}
            });

            return null;
        }

        try {
            let seriesBriefEntity = await self.pipeline.findOneDoc({
                modelName: 'SeriesBrief',
                where: {
                    _id: brief._id
                }
            });
            if(seriesBriefEntity.hasConfigCrawled) {
                return null;
            }

            //直接通过接口爬取，不通过页面爬取
            let carxid;
            try {
                carxid = brief.configUrl.match(/config\/[0-9]{1,}/g)[0].replace('config/', '').replace('/', '');
                carxid = parseInt(carxid);
            } catch(error) {
                //说明config url有问题
                console.warn(error);
                await self.pipeline.updateOneDoc({
                    modelName: 'SeriesBrief',
                    where: {_id: brief._id},
                    model: {hasConfigCrawled: true}
                });
                return null;
            }

            let configUrl = this.host + '/api/car/carxlistconfig';

            headers['Content-Length'] = `carxid=${carxid}`.length;
            headers['Referer'] = brief.configUrl;

            let requestOptions = {
                url: configUrl,
                headers: headers,
                method: 'POST',
                form: 'carxid='+carxid,
                timeout: 2*60*1000 //超时时间2min
            };

            let json = await this.download(requestOptions);
            if(typeof json === 'string') {
                json = JSON.parse(json);
            }

            let configList = json.body.configs.list;

            await _utils.parallel(configList, 10, async function (config) {
                //一个config list解析错误，不要影响其他的
                try {
                    let configEntity = {};

                    let specId = config.spec_id;
                    let reg = new RegExp(`.*\/${specId}$`);
                    console.log('reg exp : ', reg);

                    //如果seriesConfig已经存在了，就不用插入了
                    let seriesConfig = await self.pipeline.findOneDoc({
                        modelName: 'SeriesConfig',
                        where: {
                            specId: specId
                        }
                    });

                    if(seriesConfig) {
                        return null;
                    }

                    //通过specId反查seriesBrief数据，确保seriesBrief和seriesConfig能够关联起来
                    let seriesBrief = await self.pipeline.findOneDoc({
                        modelName: 'SeriesBrief',
                        where: {
                            configUrl: {
                                $regex: reg
                            }
                        }
                    });
                    if(!seriesBrief) {
                        console.log(`the regexp ${reg} has no result.`);
                        return null;
                    }

                    configEntity.seriesBriefId = seriesBrief._id;
                    configEntity.specId = specId;
                    configEntity.details = {};

                    for(let item of config.items) {
                        if(!configEntity.details[item.name]) {
                            configEntity.details[item.name] = [];
                        }

                        for(let conf of item.confs) {
                            configEntity.details[item.name].push({[conf.sub]: conf.value});
                        }
                    }

                    await self.pipeline.saveOne({
                        modelName: 'SeriesConfig',
                        data: configEntity
                    });

                    await self.pipeline.updateOneDoc({
                        modelName: 'SeriesBrief',
                        where: {_id: seriesBrief._id},
                        model: {hasConfigCrawled: true}
                    });
                } catch(error) {
                    console.error(error);
                }
            });
        } catch(error) {
            console.error(error);
            throw error;
        }
    }

    async execute (opts) {
        let self = this;
        let headers = opts.headers;
        let parallelCount = 100;

        let briefs = await this.pipeline.findDocs({
            modelName: 'SeriesBrief',
            where: {hasConfigCrawled: {$ne: true}}
        });

        //先绑定job处理函数
        this.bindJobProcessHandler(this.process.bind(this));

        await _utils.parallel(briefs, parallelCount, async function(brief) {
            await self.createJob({brief, headers});
        });
    }
}

module.exports = SeriesConfig;
