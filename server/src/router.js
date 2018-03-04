const path = require('path');
const rootFile = process.cwd();
const db = require('../db');
const ObjectID = require('mongodb').ObjectID;  

//记录所有登录的用户id信息
const LoginUsers = [];

const createRouter = (app) => {
	//页面请求根路径时返回主页面
	app.get('/',(req,res)=>{
		res.sendFile(path.resolve(rootFile,'./public/index.html'));
	});
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
						result = {
							status:'ok',
							result:{
								login:true,
								user:{
									id:req.cookies.US,
									username:resultInfo[0].username
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
		let result = {};
		if(req.body&&req.body.username){
			db(//查询数据库是否存在相同用户名
				'find',
				'user',
				{username:req.body.username},
				(result)=>{
					if(result.length === 0){//不存在该用户，进行注册
						db(//将用户信息存入数据库
							'add',
							'user',
							req.body,
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
		let result = {}
		if(req.body&&req.body.username){
			db(
				'find',
				'user',
				{username:req.body.username},
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
						result = {
							status:'ok',
							result:{
								info:'loginSuccess',
								exist:true,
								user:{
									id:resultInfo[0]._id,
									username:resultInfo[0].username
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

}

module.exports.createRouter = createRouter;