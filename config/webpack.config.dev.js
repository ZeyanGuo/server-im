const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const inputPath = process.cwd();

module.exports = {
	entry:path.resolve(inputPath,'./src/index.js'),
	output:{
		filename:'[name].[chunkhash].js',
		path:path.resolve(inputPath,'./public')
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
								'es2015',
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
			}
		]
	},
	plugins:[
		new HtmlWebpackPlugin({
			title:'IM',
			template:path.resolve(__dirname,'../static/index.html'),
			inject:true
		})
	]
}