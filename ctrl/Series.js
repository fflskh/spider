const cheerio = require('cheerio');
const Base = require('./Base');

class Series extends Base {
    constructor(context) {
        super(context);
        this.type = 'series';
    }

    async process(data) {
        let self = this;
        let url = data.url;
        let headers = data.headers;
        let method = data.method;

        let requestOptions = {url, headers, method};

        let cBrand = this.ctrl.createBrand(this.context);

        try {
            let html = await self.download(requestOptions);
            let $ = cheerio.load(html);

            $('.brand-list-by-brand').each(async function() {
                let brandImg = $(this).find('.brand-logo img').attr('src');
                let brandName = $(this).find('.brand-logo h4.title-box').text();

                let brand = await cBrand.findOrSaveBrand({
                    brandImg: brandImg,
                    brandName: brandName
                });

                // 写入factory
                $(this).find('.brand-content h4').each(async function() {
                    let factoryName = $(this).text().replace(/\s{1,}/g, ' ');
                    console.log('factoryName: ', factoryName);
                    let factory = await self.pipeline.saveOne({
                        modelName: 'Factory',
                        data: {
                            brandId: brand.id,
                            name: factoryName
                        }
                    });

                    $(this).next().find('.cars-box').each(async function() {
                        //23.42-34.28万, 34.28万, 无
                        let price = $(this).find('.price em').text();
                        let minPrice = parseFloat(price) || 0;
                        let maxPrice = price.split('-').length > 1 ? parseFloat(price.split('-')[1]) : minPrice || 0;
                        let seriesData = {
                            factoryId: factory.id,
                            thumbnail: $(this).find('.img img').attr('data-src'),
                            name: $(this).find('.name a').text(),
                            originalLink: self.host + $(this).find('.img a').attr('href'),
                            guidancePrice: {
                                min: minPrice,
                                max: maxPrice
                            }
                        };

                        // console.log('series: ', series);
                        return await self.pipeline.saveOne({
                            modelName: 'Series',
                            data: seriesData
                        });
                    });
                });
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * url: this.host + '/htmldata/carsearch/A.html',
     * page: 'ABCDEFGHIJKLMNOPQRSTWXYZ'
     * @param url
     * @param page
     * @returns {string}
     */
    static getUrlByPage (url, page) {
        let arr = url.split('/');
        let last = arr[arr.length-1];
        let lastArr = last.split('.');
        lastArr[0] = page;
        arr[arr.length-1] = lastArr.join('.');
        return arr.join('/');
    }

    async execute (opts) {
        let pages  = opts.pages;
        let headers = opts.headers;
        let url = opts.url;
        let method = opts.method;

        try {
            //先绑定job处理函数
            this.bindJobProcessHandler(this.process.bind(this));

            for(let i=0; i<pages.length; i++) {
                let seriesUrl = Series.getUrlByPage(url, pages[i]);
                await this.createJob({
                    url:seriesUrl,
                    headers,
                    method
                });
            }
        } catch(error) {
            console.error(error);
            throw error;
        }
    }
}

module.exports = Series;
