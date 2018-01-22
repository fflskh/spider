const cheerio = require('cheerio');
const Base = require('./Base');

class SeriesImage extends Base {
    constructor(context) {
        super(context);
        this.host = 'http://www.laosiji.com';
        this.type = 'seriesImage';
    }

    async resolveSeriesImages (opts) {
        let self = this;
        let url = opts.url;
        let headers = opts.headers;

        let requestOptions = {
            url: url,
            headers: headers
        };

        let html = await this.download(requestOptions);
        let $ = cheerio.load(html);
        let objs = [];
        $('.car-pic-box > .pic-box > .img-box').each(function() {
            objs.push(this);
        });

        //缩略图链接的标清和高清图片比较多，需要控制下载的数量
        return await _utils.parallel(objs, 5, async function(obj) {
            try {
                let image = {};
                image.thumbnail = $(obj).find('img').attr('src');

                let standardQualityLink = self.host + $(obj).find('a').attr('href');
                let res = await self.resolveSeriesStandardAndHighQuality({url: standardQualityLink, headers});
                image.standard = res.standard;
                image.high = res.high;

                return image;
            } catch(error) {
                console.error(error);
            }
        });
    }

    //标清图片
    async resolveSeriesStandardAndHighQuality (opts) {
        let self = this;
        let url = opts.url;
        let headers = opts.headers;

        let requestOptions = {
            url: url,
            headers: headers
        };

        let html = await this.download(requestOptions);
        let $ = cheerio.load(html);
        let standardQuality = $('.picinfo-main > img').attr('src');
        let highQuality = $('.picinfo-right > a').attr('href');

        return {
            standard: standardQuality,
            high: highQuality
        };
    }

    async process(opts) {
        let self = this;
        let brief = opts.brief;
        let headers = opts.headers;

        //没有图片，直接pass
        if(!brief.imagesUrl || !_utils.isUrl(brief.imagesUrl, this.host)) {
            await self.pipeline.updateDocs({
                modelName: 'SeriesBrief',
                where: {_id: brief._id},
                model: {hasImageCrawled: true}
            });

            return null;
        }

        try{
            let requestOptions = {
                url: brief.imagesUrl,
                headers: headers
            };

            let html = await this.download(requestOptions);
            let $ = cheerio.load(html);

            let objs = [];
            $('.car-pic-box').each(function() {
                objs.push(this);
            });

            //一个系列的车图片有四种，每次并行一个
            await _utils.parallel(objs, 1, async function (obj) {
                try {
                    let category = _utils.trim($(obj).find('h3').text()).slice(0,2);
                    let moreUrl = self.host + $(obj).find('h3 a').attr('href');

                    let images = await self.resolveSeriesImages({
                        url: moreUrl,
                        headers: headers
                    });
                    let pics = {
                        seriesBriefId: brief._id,
                        category: category,
                        images: images
                    };

                    // console.log('pics: ', pics);

                    await self.pipeline.save({
                        modelName: 'SeriesImage',
                        data: pics
                    });
                } catch(error) {
                    console.error(error);
                }
            });

            await self.pipeline.updateDocs({
                modelName: 'SeriesBrief',
                where: {_id: brief._id},
                model: {hasImageCrawled: true}
            });

        } catch (error) {
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
            where: {hasImageCrawled: {$ne: true}}
        });

        //先绑定job处理函数
        this.bindJobProcessHandler(this.process.bind(this));

        await _utils.parallel(briefs, parallelCount, async function(brief) {
            await self.createJob({brief, headers});
        });
    }
}

module.exports = SeriesImage;
