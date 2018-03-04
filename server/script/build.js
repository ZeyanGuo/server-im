const env = require('../../config/env');
const util = require('../util/util');

//do not provide build function in devlopment version.
if(env.NODE_ENV === 'DEVLOPMENT'){
	console.log(util.errMessage(
		'Sorry can not build project in devlopment version, '
		+'you can change the version in server-im/config/env.js.'
		)
	);
}
else if(env.NODE_ENV === 'PRODUCTION'){
	const proConfig = require('../../config/webpack.config.dev');//暂时使用dev的build进行测试
	util.execWebpack(proConfig);
}
else{
	console.log(util.errMessage('Error verision, only support DEVLOPMENT and PRODUCTION.'));
}

