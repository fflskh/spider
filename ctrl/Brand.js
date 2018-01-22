const Base = require('./Base');

class Brand extends Base {
    constructor(context) {
        super(context);
        this.type = 'brand';
    }

    async findOrSaveBrand (opts) {
        let brandImg = opts.brandImg;
        let brandName = opts.brandName;

        console.log('findOrSaveBrand opts: ', opts);

        // 通过brandName查询brand信息，并获取到brandId
        let brand = await this.pipeline.findOneDoc({
            modelName: 'Brand',
            where: {name: brandName}
        });

        //没有brand，新插入
        if(!brand) {
            let savedBrands = await this.pipeline.save({
                modelName: 'Brand',
                data: [{image:{url: brandImg}, name: brandName}]
            });
            brand = savedBrands[0];
        }

        return brand;
    }

    async process(data) {
        let url = data.url;
        let headers = data.headers;
        let method = data.method;

        let requestOptions = {url, headers, method};

        try {
            let brands = [];
            let response = await this.download(requestOptions);
            response = JSON.parse(response);
            let brandList = response.body && response.body.brand && response.body.brand.list || [];
            brandList.forEach(item => {
                brands.push({
                    firstChar: item.abc,
                    image: {
                        height: item.image.height || null,
                        width: item.image.width || null,
                        mime: item.image.mime || '',
                        size: item.image.size || null,
                        url: item.image.url
                    },
                    name: item.name
                });
            });

            return await this.pipeline.save({
                modelName: 'Brand',
                data: brands
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

        console.log('start to crawl brands.');

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

module.exports = Brand;
