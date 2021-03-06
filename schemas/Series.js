/**
 * 系列，例如宝马3系，5系等
 */
const Schema = require('mongoose').Schema;

const seriesSchema = new Schema({
    factoryId: {type: Schema.Types.ObjectId, desc:'大分类名称'},
    name: {type: String, desc: '系列名称'},
    //指导价
    guidancePrice: {
        min: Number,
        max: Number
    },
    thumbnail: {type: Schema.Types.Mixed, desc: '缩略图'},
    originalLink: {type: String, desc: '原始链接'},
    hasBriefCrawled: {type: Boolean, defaultValue: false, desc: '是否爬取了系列简要信息'},
    hasDealerCrawled: {type: Boolean, defaultValue: false, desc: '是否爬取了经销商数据'}
}, {
    collection: 'series', //默认取model name的负数为collection name，该选项用于手动指定collection name
    minimize: _config.get('mongodb.schemaOpts.minimize'), //默认不会将空对象"{}"写入db。置为false，将空对象写入db
    versionKey: _config.get('mongodb.schemaOpts.versionKey'), //每更新一次，则会更新versionKey。若做数据跟踪，则可以置为true。
    timestamps: _config.get('mongodb.schemaOpts.timestamps') //设置createdAt和updatedAt
});

module.exports = seriesSchema;
