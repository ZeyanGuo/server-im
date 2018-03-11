const path = require('path');
const rootFile = process.cwd();
const db = require('../db');
const ObjectID = require('mongodb').ObjectID;  
const fs = require('fs');
const config = require('../../config/server.config');
const images = require('images');

//记录所有登录的用户id信息
const LoginUsers = [];

const createRouter = (app) => {
	//页面请求根路径时返回主页面
	app.get('/',(req,res)=>{
		res.sendFile(path.resolve(rootFile,'./public/index.html'));
	});
	app.get('/staticHtml/headImg',(req,res) => {
		res.setHeader("Content-Type", "text/html");
		res.sendFile(path.resolve(__dirname,'../../static/staticHtml/headImg.html'))
	});
	app.get('/staticHtml/myFunction.js',(req,res) => {
		res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
		res.sendFile(path.resolve(__dirname,'../../static/staticHtml/myFunction.js'))
	})
	//页面加载时判断Cookie是否存在登录
	app.get('/methods/checkUserByCookie.json',(req,res)=>{
		let result = null;

		for(let i = 0; i < LoginUsers.length; i++){
			if(req.cookies.US == LoginUsers[i]){
				
				db(
					'find',
					'user',
					{_id:ObjectID(req.cookies.US)},
					(resultInfo) => {
						let baseInfo = getBaseInfo(resultInfo);
						result = {
							status:'ok',
							result:{
								login:true,
								user:{
									id:req.cookies.US,
									username:resultInfo[0].username,
									baseInfo:baseInfo,
									friendList:resultInfo[0].firendList,
									chatList:resultInfo[0].chatList
								}
							}
						}
						res.end(JSON.stringify(result));
					}
				)
				return;
			}
		}
		if(!result){
			result = {
				status:'ok',
				result:{
					login:false
				}
			}
		}
		res.end(JSON.stringify(result));
	});
	//注册时的注册逻辑
	app.post('/methods/registe.json',(req,res)=>{
		let result = {},
			newUser = {
				account:req.body.account,
				password:req.body.password,
				baseInfo:{
					email:req.body.email,
					phone:req.body.phone,
					name:"",
					gender:"",
					headImg:{}
				},
				friendList:[],
				chatList:[]
			};
		if(req.body&&req.body.account){
			db(//查询数据库是否存在相同用户名
				'find',
				'user',
				{account:req.body.account},
				(result)=>{
					if(result.length === 0){//不存在该用户，进行注册
						db(//将用户信息存入数据库
							'add',
							'user',
							newUser,
							(result)=>{
								if(result.insertedCount===1){//插入成功
									result = {
										status:'ok',
										result:{
											info:'User registration success',
											owned:false
										}
									}
								}
								else{//插入失败
									result = {
										status:'err',
										result:{
											info:'User registration failed',
											owned:false
										}
									}
								}
								res.end(JSON.stringify(result));
							}
						);

					}
					else{//用户名已存在
						result = {
							status:'err',
							result:{
								info:'The user name is already owned',
								owned:true
							}
						}
						res.end(JSON.stringify(result));
					}
				}
			)
		}
		
	});

	//登录逻辑
	app.post('/methods/login.json',(req,res) => {
		let result = {};
		if(req.body&&req.body.account){
			db(
				'find',
				'user',
				{account:req.body.account},
				(resultInfo)=>{
					
					if(resultInfo.length === 0){
						result = {
							status:'err',
							result:{
								info:'noExist',
								exist:false
							}
						}
					}
					else if(resultInfo[0].password === req.body.password){
						let baseInfo = getBaseInfo(resultInfo);
						result = {
							status:'ok',
							result:{
								info:'loginSuccess',
								exist:true,
								user:{
									id:resultInfo[0]._id,
									account:resultInfo[0].account,
									baseInfo:baseInfo
								}
							}
						}
						//登录记录
						LoginUsers.push(resultInfo[0]._id);
						//设置Cookie
						res.cookie('US', resultInfo[0]._id,{
					        maxAge: 5000000,
					    });
					}
					else if(resultInfo[0].password !== req.body.password){
						result = {
							status:'err',
							result:{
								info:'loginError',
								exist:true
							}
						}
					}
					res.end(JSON.stringify(result));
				}
			)
		}
	})

	app.post('/methods/updateImgInfo.json',(req,res) => {

		let imgData = req.body.blobData,
			base64Data = imgData.replace(/^data:image\/\w+;base64,/, ""),
			dataBuffer = new Buffer(base64Data, 'base64'),
			savePath = path.resolve(__dirname,'../../static/images'),
			id = req.body.id.replace('j:',"").replace(/"/g,""),
			result = {};
		fs.writeFile(savePath+"/"+id+'.png',dataBuffer,(err) => {
			let url = savePath+"/"+id+'.png',
				x = req.body.x/370*256,
				y = req.body.y/370*256,
				height = req.body.height/370*256,
				width = req.body.width/370*256;
			images(images(url),x,y,width,height).resize(220).save(savePath+"/test.png");
			if(!err){
				db(
					'update',
					'user',
					[
						{_id:ObjectID(id)},
						{
							$set:{
								headImg:{
									URL:'http://'+config.host+':'+config.port+'/images/'+id+'.png',
									position:{
										x:req.body.x,
										y:req.body.y,
										imageWidth:req.body.imageWidth,
										imageHeight:req.body.imageHeight,
										height:req.body.height,
										width:req.body.width
									}
								}
							}
						}
					],
					(resultInfo) => {
						if(resultInfo.result.ok === 1){//图片修改操作成功
							result.status='ok';
							result.errString='none';
						}
						else{
							result.status='err';
							result.errString('server can\'t update image');
						}
						res.end(JSON.stringify(result));
					}
				)
			}
			else{
				result.status='err';
				result.errString('server can\'t update image');
				res.end(JSON.stringify(result));
			}
		})//储存相应的头像图片
		
	})

}


//获取基本信息，如果没有基本信息则返回hasBaseInfo:false
const getBaseInfo = (result) => {
	return !!result[0].baseInfo.name?result[0].baseInfo:{hasBaseInfo:false};
}





module.exports.createRouter = createRouter;