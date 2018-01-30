const env = require('../../config/env');
const util = require('../util/util');

switch(env.NODE_ENV){
	case "PRODUCTION":{
		const proConfig = require('../../config/webpack.config.pro');
		util.execWebpack(proConfig);
	} break;
	case "DEVLOPMENT":{
		const devConfig = require('../../config/webpack.config.dev');
		util.execWebpack(devConfig);
	} break;
}

