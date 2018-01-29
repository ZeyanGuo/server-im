const webpack = require('webpack');
const env = require('../../config/env');

const execWebpack = (file)=>{
	webpack(file);
}

//choose different webpack.config.js to excute
switch(env.NODE_ENV){
	case "PRODUCTION":{
		const proConfig = require('../../config/webpack.config.pro');
		execWebpack(proConfig);
	} break;
	case "DEVLOPMENT":{
		const devConfig = require('../../config/webpack.config.dev');
		execWebpack(devConfig);
	} break;
}

