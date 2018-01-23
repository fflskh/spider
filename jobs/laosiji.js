
const ctrl = require(_base + 'ctrl');

class Spider{
    constructor(context) {
        this.context = context;
        this.name = 'laosiji';
        this.host = 'http://www.laosiji.com';
        this.hostWithoutHTTP = 'www.laosiji.com';
        context[this.name] = {
            host: this.host,
            hostWithoutHTTP: this.hostWithoutHTTP
        };
    }

    static getHeaders () {
        return {
            'Host': 'www.laosiji.com',
            'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0',
            'Upgrade-Insecure-Requests': 1,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cookie': '__DAYU_PP=IRu3ffEInf6avN2Qm3aV3686dac12629; UM_distinctid=15fab7221dc5ce-04e1433c041644-c303767-1fa400-15fab7221dd87d; JSESSIONID=BB0785E2213578DE5F3F068FBE6C51C1; CNZZDATA1261736092=1842276921-1510403921-https%253A%252F%252Fwww.baidu.com%252F%7C1513783441'
        };
    }

    async crawl () {
        let context = this.context;
        let cCity = ctrl.createCity(context);
        let cQueryCondition = ctrl.createQueryCondition(context);
        let cBrand = ctrl.createBrand(context);
        let cSeries = ctrl.createSeries(context);
        let cSeriesBrief = ctrl.createSeriesBrief(context);
        let cDealer = ctrl.createDealer(context);
        let cSeriesConfig = ctrl.createSeriesConfig(context);
        let cSeriesImage = ctrl.createSeriesImage(context);

        console.log(`start to crawl from: ${this.host}`);

        //城市, 选车条件和车辆品牌
        await Promise.all([
            cCity.execute({
                url: this.host + '/Od-Car-API/city.json',
                headers: Spider.getHeaders()
            }),

            cQueryCondition.execute({
                url: this.host + '/cars/0/0-0-0-0-0-0-0-0-0-0-0-0-0/',
                headers: Spider.getHeaders()
            }),

            cBrand.execute({
                url: this.host + '/Od-Car-API/lib/brand.json',
                headers: Spider.getHeaders()
            })
        ]);

        //车系列
        await cSeries.execute({
            url: this.host + '/htmldata/carsearch/A.html',
            headers: Spider.getHeaders(),
            pages: 'ABCDEFGHIJKLMNOPQRSTWXYZ'
        });

        await Promise.all([
            //车系列的简介
            cSeriesBrief.execute({
                headers: Spider.getHeaders()
            }),
            //经销商
            cDealer.execute({
                headers: {
                    'Accept': '*/*',
                    'Accept-Encoding':'gzip, deflate',
                    'Accept-Language':'zh-CN,zh;q=0.9',
                    'Connection':'keep-alive',
                    'Content-Length':0,
                    'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',
                    'Cookie':'__DAYU_PP=IRu3ffEInf6avN2Qm3aV3686dac12629; UM_distinctid=15fab7221dc5ce-04e1433c041644-c303767-1fa400-15fab7221dd87d; OdStatisticsToken=c8b92db7-968e-4e90-ab2d-7d525b020cdb-1513951510284; CNZZDATA1261736092=1842276921-1510403921-https%253A%252F%252Fwww.baidu.com%252F%7C1516539089; JSESSIONID=F13DBDF255E275EC12D4E2CE944335E1',
                    'Host':'',
                    'Origin':'',
                    'Referer':'',
                    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
                }
            })
        ]);

        await Promise.all([
            cSeriesConfig.execute({
                headers: {
                    'Host': 'www.laosiji.com',
                    'Connection': 'keep-alive',
                    'Content-Length': 0,
                    'Origin': 'http://www.laosiji.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'Accept': '*/*',
                    'Referer':'',
                    'Accept-Encoding': 'gzip, deflate',
                    'Accept-Language': 'zh-CN,zh;q=0.9',
                    'Cookie': '__DAYU_PP=IRu3ffEInf6avN2Qm3aV3686dac12629; UM_distinctid=15fab7221dc5ce-04e1433c041644-c303767-1fa400-15fab7221dd87d; OdStatisticsToken=c8b92db7-968e-4e90-ab2d-7d525b020cdb-1513951510284; CNZZDATA1261736092=1842276921-1510403921-https%253A%252F%252Fwww.baidu.com%252F%7C1516539089; JSESSIONID=F13DBDF255E275EC12D4E2CE944335E1'
                }
            }),
            cSeriesImage.execute({
                headers: Spider.getHeaders()
            })
        ]);
    }
}

module.exports = Spider;
