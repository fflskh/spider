// controllers

let fs = require('fs');
let path = require('path');
let assert = require('assert');

function createCtrl(name, context) {
    _logger.debug('create controller: ', name);
    assert(name && name.length > 0, 'name must not be an empty string.');
    assert(typeof context === 'object', 'context must be a valid object.');

    if (exports[name]) {
        return new exports[name](context);
    }
    else {
        throw new Error(`Can not find ctrl: ${name}`);
    }
}

function loadDirectory(exports, directory) {
    fs.readdirSync(directory).forEach(function (filename) {
        let fullPath;
        let stat;
        let match;

        // Skip itself
        if (filename === 'index.js' || /^\./.test(filename)) {
            return;
        }

        fullPath = path.join(directory, filename);
        stat = fs.statSync(fullPath);

        //只支持单级目录
        if (stat.isDirectory()) {
            return;
        }

        match = /(\w+)\.js$/.exec(filename);

        if (match) {
            exports.__defineGetter__(match[1], function () {

                let tmp = null;
                try{
                    tmp = require(fullPath);
                }catch(err){
                    console.error(err);
                }
                return tmp;
            });

            //auto export createDao method
            exports['create' + match[1]] = function (context) {
                return createCtrl(match[1], context);
            };
        }
    });

    return exports;
}

loadDirectory(exports, __dirname);
exports.createCtrl = createCtrl;