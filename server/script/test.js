const util = require('../util/util');
const devConfig = require('../../config/webpack.config.dev');
util.execWebpack(devConfig);