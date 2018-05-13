const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const inputPath = process.cwd();
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
	entry:[
		path.resolve(inputPath,'./src/index.js'),
		//path.resolve(__dirname,'../node_modules/webpack-hot-middleware/client?noInfo=true&reload=true')
		// path.resolve(__dirname,'../node_modules/webpack-dev-server/client')
	],
	output:{
		filename:'[name].[hash].js',
		path:path.resolve(inputPath,'./public'),
		publicPath:'/assert/'
	},
	module:{
		rules:[
			{
				test:/\.jsx?$/,
				exclude: /(node_modules|bower_components)/,
				use:[
					{
						loader:'babel-loader',
						options:{
							presets:[
								'stage-3',
								'react'
							]
						}
					}
				]
			},
			{
				test:/\.jade$/,
				exclude:/node_modules/,
				use:[
					{
						loader:'jade-loader'
					}
				]
			},
			{
				test:/\.css$/,
				exclude:/node_modules/,
				use:[
					{
						loader:'style-loader'
					},
					{
						loader:'css-loader'
					}
				]
			},
			{
				test: /\.(png|gif|jpe?g)$/,
		        loader: 'url-loader',
		        query: {
		            limit: 10000,
		            name: 'images/[name]-[hash:8].[ext]'
		        }
			}
		]
	},
	plugins:[
		
		new HtmlWebpackPlugin({
			title:'IM',
			template:path.resolve(__dirname,'../static/index.html'),
			inject:true
		}),
		new webpack.NamedModulesPlugin(),
		//new webpack.HotModuleReplacementPlugin()
	],
	//devtool:"source-map"
}