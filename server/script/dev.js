//use the webpack-dev-middleware and webpack-hot-middleware to realize the HMR.

var path = require('path');
var express = require('express');
var webpack = require('webpack');
var config = require('../../config/webpack.config.dev');
var devConfig = require('../../config/devServer.config');
const {sucMessage} = require('../util/util');
var inputPath = process.cwd();
var app = express();
var compiler = webpack(config);
 
var webpackDevMiddleware = require("webpack-dev-middleware");
 
app.use(webpackDevMiddleware(compiler, {
 
  noInfo: devConfig.noInfo, //console print the compiling information. 
  publicPath: config.output.publicPath //comebine the middleware
}));
 
var webpackHotMiddleware = require('webpack-hot-middleware');
app.use(webpackHotMiddleware(compiler));
  
 
app.get('*', function(req, res) {

  res.sendFile(inputPath+'/public/index.html'); 
});
 


app.listen(devConfig.port, devConfig.host, function(err) {
 
  if (err) {
    console.log(err);
    return;
  }
  setTimeout(()=>{
  	console.log(
  		sucMessage(
				'Devlopment server running & listen to '
				+ devConfig.host
				+ ' ' 
				+ devConfig.port
			)
		);
  },5000);

});




//use the webpack-dev-server to realize the HMR, but still have some problems
/*run the webpack-dev-server

const webpack = require('webpack');
const webpackDevServer = require('webpack-dev-server');
const config = require('../../config/webpack.config.dev');
const {execWebpack,errMessage} = require('../util/util');
const path = require('path');

let compiler = webpack(config);

// let server = webpackDevServer(compiler,{
// 	hot:true
// });
// config.entry.app.unshift("webpack-dev-server/client?http://localhost:9000/");

let options = {
	publicPath:'/',
	compress:true,
	inline:true,
	hot: true,
	historyApiFallback:true
}

var server = new webpackDevServer(compiler,options);


server.listen(9000, 'localhost', err => {
  if (err) {
    return errMessage(err);
  }
  
});*/