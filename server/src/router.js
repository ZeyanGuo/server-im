const path = require('path');
const rootFile = process.cwd();
const db = require('../db');
const ObjectID = require('mongodb').ObjectID;  
const fs = require('fs');
const config = require('../../config/server.config');
const images = require('images');
const webSocket = require('express-ws');
const singleChat = require('./methods/singleChat.js');
const groupChat = require('./methods/groupChat.js');
const messageOperation = require('./methods/message.js');
const chatManagement = require('./methods/chatManagement.js');
//记录所有登录的用户id信息
const LoginUsers = [];
const wss = {};

const createRouter = (app) => {
	const  ws = webSocket(app);
	
	app.ws('/methods/ws.json', function(ws, req) {  

		ws.on('message',(msg) => {
			msg = JSON.parse(msg);
			switch(msg.type){
				case 'login':{
					wss[msg.id] = ws;
					ws.send(JSON.stringify({
						type:'login',
						status:'ok',
						errString:'none'
					}))
				} break;
				case 'addFriend':{
					switch(msg.code){
						case 1:{
							let friendExist = false;
							for(let i = 0; i < LoginUsers.length; i++){
								if(msg.friendId == LoginUsers[i]){
									friendExist = true;
									break;
								}
							}
							db(//将请求接受着id添加到发送者的请求列表中
								'update',
								'user',
								[
									{_id:ObjectID(msg.id)},
									{							
										$addToSet:{
											sendedRequestList:msg.friendId
										}
									}
								],
								(result)=>{

								}
							);
							db(//将发送者的id添加到请求接受者的请求列表中
								'update',
								'user',
								[
									{_id:ObjectID(msg.friendId)},
									{							
										$addToSet:{
											receivedRequestList:msg.id
										}
									}
								],
								(result)=>{

								}
							)
							ws.send(JSON.stringify({//向发送者回传消息发送成功信息
								type:'addFriend',
								code:4,
								friendId:msg.friendId
							}))
							if(!!wss[msg.friendId]&&friendExist&&wss[msg.friendId].readyState==1){//如果想要添加的用户处于登录状态则发送消息
								db(
									'find',
									'user',
									{_id:ObjectID(msg.id)},
									(result)=>{//向该用户发送好友请求
										wss[msg.friendId].send(JSON.stringify(sendUserInfoToWs('addFriend',1,result)))
									}
								);
							}
						} break;
						case 2:{
							let friendExist = false;
							for(let i = 0; i < LoginUsers.length; i++){
								if(msg.friendId == LoginUsers[i]){
									friendExist = true;
									break;
								}
							}
							db(
								'update',
								'user',
								[
									{_id:ObjectID(msg.id)},
									{
										$pull:{
											receivedRequestList:msg.friendId
										},
										$addToSet:{
											friendList:msg.friendId
										}
									}
								],
								(result)=>{

								}
							)
							db(
								'update',
								'user',
								[
									{_id:ObjectID(msg.friendId)},
									{
										$pull:{
											sendedRequestList:msg.id
										},
										$addToSet:{
											friendList:msg.id
										}
									}
								],
								(result)=>{

								}
							)
							db(
								'find',
								'user',
								{_id:ObjectID(msg.friendId)},
								(result)=>{
									ws.send(JSON.stringify(sendUserInfoToWs('addFriend',2,result)))
								}
							)
							
							if(wss[msg.friendId]&&friendExist&&wss[msg.friendId].readyState==1){
								db(
									'find',
									'user',
									{_id:ObjectID(msg.id)},
									(result)=>{
										wss[msg.friendId].send(JSON.stringify(sendUserInfoToWs('addFriend',2,result)))
									}
								)
							}
						} break;
						case 3:{
							let friendExist = false;
							for(let i = 0; i < LoginUsers.length; i++){
								if(msg.friendId == LoginUsers[i]){
									friendExist = true;
									break;
								}
							}
							db(
								'update',
								'user',
								[
									{_id:ObjectID(msg.id)},
									{
										$pull:{
											receivedRequestList:msg.friendId
										}
									}
								],
								(result)=>{

								}
							)
							db(
								'update',
								'user',
								[
									{_id:ObjectID(msg.friendId)},
									{
										$pull:{
											sendedRequestList:msg.id
										}
									}
								],
								(result) => {
							
								}
							)
							db(
								'find',
								'user',
								{_id:ObjectID(msg.friendId)},
								(result)=>{
									ws.send(JSON.stringify(sendUserInfoToWs('addFriend',3,result)))
								}
							)
							
							if(wss[msg.friendId]&&friendExist&&wss[msg.friendId].readyState==1){
								db(
									'find',
									'user',
									{_id:ObjectID(msg.id)},
									(result)=>{
										wss[msg.friendId].send(JSON.stringify(sendUserInfoToWs('addFriend',3,result)))
									}
								)
							}
						} break;
						default:{
							ws.send('please send currect code');
						}
					}	
				} break;
				case 'deleteFriend':{
					let friendExist = false;
					for(let i = 0; i < LoginUsers.length; i++){
						if(msg.friendId == LoginUsers[i]){
							friendExist = true;
							break;
						}
					}
					db(
						'update',
						'user',
						[
							{_id:ObjectID(msg.id)},
							{
								$pull:{
									friendList:msg.friendId
								}
							}
						],
						(result)=>{

						}
					);
					db(
						'update',
						'user',
						[
							{_id:ObjectID(msg.friendId)},
							{
								$pull:{
									friendList:msg.id
								}
							}
						],
						(result)=>{

						}
					);

					db(
						'find',
						'user',
						{
							_id:ObjectID(msg.id),
						},
						(result)=>{
							if(!!result[0].chatMap[msg.friendId]){//如果存在chatId
								let chatId = result[0].chatMap[msg.friendId];
								db(
									'update',
									'user',
									[
										{
											_id:ObjectID(msg.id),
											'chatList.id':chatId
										},
										{
											$set:{
												"chatList.$.show":false,
												"chatList.$.unReadMsg":0
											}
										}
									],
									()=>{}
								)
								db(
									'update',
									'user',
									[
										{
											_id:ObjectID(msg.friendId),
											'chatList.id':chatId
										},
										{
											$set:{
												"chatList.$.show":false,
												"chatList.$.unReadMsg":0
											}
										}
									],
									()=>{}
								)
							}
						}
					)
				
						
					if(wss[msg.friendId]&&friendExist&&wss[msg.friendId].readyState==1){
						wss[msg.friendId].send(JSON.stringify({
							type:'deleteFriend',
							friendId:msg.id
						}));
					}
					ws.send(JSON.stringify({
						type:'deleteFriend',
						friendId:msg.friendId
					}));
				} break;
				case 'startSingleChat':{
					singleChat.startSingleChat(msg,ws);
				} break
				case 'singleChat':{//传入数据，id, friendId, message
					singleChat.singleChat(msg,ws,wss);
				} break;
				case 'checkMessage':{//用于回置消息是否接受 msgId:消息的id chatId:聊天的Id id:用户的id code:0表示未读，1表示已读
					messageOperation.checkMessage(msg);
				} break;
				case 'getHistoryRecord':{//用于获取历史消息 chatId:聊天的Id,id:获取信息的用户id,skipCount:表示跳过多少条信息；
					messageOperation.getHistoryRecord(msg,ws);
				} break;
				case 'groupChat':{//用于群聊,chatId:群聊的id, message:所需要发送的消息, token:发送消息的标识,id:用户的id
					groupChat.groupChat(msg,ws,wss);
				} break;
				case 'createGroupChat':{//用于创建群聊，ids:群聊所有人的id，chatName:群聊的名字
					groupChat.createGroupChat(msg,ws,wss);
				} break;
				case 'deleteChat':{//删除用户的聊天 chatIds:聊天的id，userid:需要删除的用户id
					chatManagement.deleteChat(msg,ws,wss);
				} break;
				default:{
					ws.send('please send the currect type.');
				}
			}
		})
		
	});
	//页面请求根路径时返回主页面
	app.get(/^\/assert\/.*$/,(req,res)=>{
		res.header("Content-Type", "text/html");
		res.sendFile(path.resolve(rootFile,'./public/index.html'));
	})
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
						searchDataList(resultInfo,(resultTemp)=>{
							result = {
								status:'ok',
								result:{
									login:true,
									account:resultInfo[0].account,
									id:resultInfo[0]._id,
									friendList:resultTemp.friendList,
									chatList:resultTemp.chatList,
									sendedRequestList:resultTemp.sendedRequestList,
									receivedRequestList:resultTemp.receivedRequestList,//收到的请求列表
									baseInfo:{
										email:resultInfo[0].email,
										phone:resultInfo[0].phone,
										name:resultInfo[0].name,
										gender:resultInfo[0].gender,
										headImg:resultInfo[0].headImg
									}							
								}
							}
							res.end(JSON.stringify(result));	
						});
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
				friendList:[],
				chatList:[],
				sendedRequestList:[],//已发送的请求列表
				receivedRequestList:[],//收到的请求列表
				chatMap:{},
				email:req.body.email,
				phone:req.body.phone,
				name:"",
				gender:"male",
				headImg:""
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
											id:result.insertedIds[0],
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
						res.end(JSON.stringify(result));
					}
					else if(resultInfo[0].password === req.body.password){
						searchDataList(resultInfo,(resultTemp)=>{
							result = {
								status:'ok',
								result:{
									info:'loginSuccess',
									exist:true,
									user:{
										id:resultInfo[0]._id,
										account:resultInfo[0].account,
										friendList:resultTemp.friendList,
										chatList:resultTemp.chatList,
										sendedRequestList:resultTemp.sendedRequestList,
										receivedRequestList:resultTemp.receivedRequestList,
										baseInfo:{
											email:resultInfo[0].email,
											phone:resultInfo[0].phone,
											name:resultInfo[0].name,
											gender:resultInfo[0].gender,
											headImg:resultInfo[0].headImg
										},
									}
								}
							}
							//登录记录
							LoginUsers.push(resultInfo[0]._id);
							//设置Cookie
							res.cookie('US', resultInfo[0]._id,{
						        maxAge: 5000000,
						    });
						    res.end(JSON.stringify(result));
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
						res.end(JSON.stringify(result));
					}
					
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
			result = {},
			date = new Date().getTime();
		fs.writeFile(savePath+"/"+id+date+'.png',dataBuffer,(err) => {
			if(req.body.deviceType && req.body.deviceType == 1){
				
			}
			else{
				let url = savePath+"/"+id+date+'.png',
					proportion = req.body.containerHeight/req.body.imageHeight;
					marginTemp = req.body.imageWidth*proportion-req.body.containerWidth,
					margin = !(marginTemp===0)?marginTemp/2:0;
					x = (margin+Number(req.body.x))/proportion,
					y = Number(req.body.y)/proportion,
					widthAndHeight = req.body.width/proportion;
					x = x<0?0:x;
					y = y<0?0:y;
				images(images(url),x,y,widthAndHeight,widthAndHeight).resize(220).save(url);
			}
			if(!err){
				db(
					'update',
					'user',
					[
						{_id:ObjectID(id)},
						{							
							$set:{
								headImg:'http://'+config.host+':'+config.port+'/images/'+id+date+'.png',							
							}
						}
					],
					(resultInfo) => {
						if(resultInfo.result.ok === 1){//图片修改操作成功
							result.status='ok';
							result.errString='none';
							result.URL = 'http://'+config.host+':'+config.port+'/images/'+id+date+'.png';
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
	
	app.post('/methods/updateBaseInfo.json',(req,res) => {
		let result = {},
			email = req.body.email,
			phone = req.body.phone,
			updateData = {};
		if(req.body.id&&req.body.name&&req.body.gender){
			updateData.name = req.body.name;
			updateData.gender = req.body.gender;
			if(!!email){
				updateData.email = req.body.email;
			}
			if(!!phone){
				updateData.phone = req.body.phone;
			}
			db(
				'update',
				'user',
				[
					{_id:ObjectID(req.body.id)},
					{
						$set:updateData
					}
				],
				(resultInfo)=>{
					if(resultInfo.result.ok === 1){
						result.status = 'ok';
						result.errString = 'none';
					}
					else{
						result.status = 'err';
						result.errString = 'server can\'t update base info now';
					}
					res.end(JSON.stringify(
						result
					));
				}
			)
		}
		else{
			res.end(JSON.stringify({
				status:'err',
				errString:'server can\'t update base info now'
			}))
		}
	})

	app.post('/methods/getUsersByIds.json',(req,res)=>{
		let ids = req.body.ids,ObjectIds;
		ObjectIds = ids.map((obj)=>{
			return ObjectID(obj);
		})
		db(
			'find',
			'user',
			{
				_id:{
					$in:ObjectIds
				}
			},
			(result)=>{
				if(result.length>0){
					let users = result.map((obj)=>{
						return {
							userid:obj._id,
							baseInfo:{
								email:obj.email,
								phone:obj.phone,
								name:obj.name,
								gender:obj.gender,
								headImg:obj.headImg
							}
						}
					});
					res.end(JSON.stringify({
						status:'ok',
						errString:'none',
						users:users
					}))
				}
				else{
					res.end(JSON.stringify({
						status:'err',
						errString:'UserId not exist'
					}))
				}
			}
		)
	})

	app.get('/methods/getUserById.json',(req,res)=>{
		db(
			'find',
			'user',
			{_id:ObjectID(req.query.id)},
			(result)=>{
				if(result.length>0){
					let data = {
						userid:result[0]._id,
						account:result[0].account,
						baseInfo:{
							email:result[0].email,
							phone:result[0].phone,
							name:result[0].name,
							gender:result[0].gender,
							headImg:result[0].headImg
						}
					}
					res.end(JSON.stringify(data));
				}
				else{
					res.end(JSON.stringify({
						status:'err',
						errString:'UserId not exist'
					}));
				}
			}
		)
	})

	app.post('/methods/logout.json',(req,res)=>{
		if(LoginUsers.length === 0){
			res.end(JSON.stringify({
				status:'err',
				errString:'logout failed server is busy'
			}));
		}
		for(var i = 0; i < LoginUsers.length; i++){
			//console.log(req.body.id,' '+LoginUsers[i], ' '+(LoginUsers[i] == req.body.id))
			if(LoginUsers[i] == req.body.id){
				LoginUsers.splice(i,1);
				wss[req.body.id] = null;
				res.end(JSON.stringify({
					status:'ok',
					errString:'none'
				}))
				break;
			}
			if(i === LoginUsers.length -1){
				res.end(JSON.stringify({
					status:'err',
					errString:'logout failed server is busy'
				}));
			}
		}

	})

	app.post('/methods/searchPerson.json',(req,res)=>{
		if(req.body.name == ''){
			res.end(JSON.stringify({
				status:'err',
				errString:'No search info to search'
			}));
		}
		else{
			let searchReg = new RegExp(req.body.name);
			
			db(//查询到本人已有的发送了请求的好友，接收到请求的好友和已是好友的人
				'find',
				'user',
				{_id:ObjectID(req.body.id)},
				(result)=>{
					let sendedRequestList = result[0].sendedRequestList,
						receivedRequestList = result[0].receivedRequestList,
						friendList = result[0].friendList;
					db(
						'find',
						'user',
						{
							name:{
								$regex:searchReg
							}
						},
						(result)=>{
							let data = [],
								sendedRequestString = ' '+sendedRequestList.join(' ')+' ',
								receivedRequestString = ' '+receivedRequestList.join(' ')+' ',
								friendString = ' '+friendList.join(' ')+' ';
							for(let i = 0; i < result.length; i++){
								if(result[i]._id == req.body.id){//过滤自身信息
									continue;
								}
								if(sendedRequestString.indexOf(' '+result[i]._id+' ')!=-1){//如果在已发送的数组中存在该id
									let dataTemp = {
										id:result[i]._id,
										name:result[i].name,
										headImg:result[i].headImg,
										email:result[i].email,
										phone:result[i].phone,
										gender:result[i].gender,
										code:'01'//已发送
									}
									data.push(dataTemp);
									continue;
								}
								if(receivedRequestString.indexOf(' '+result[i]._id+' ')!=-1){
									let dataTemp = {
										id:result[i]._id,
										name:result[i].name,
										headImg:result[i].headImg,
										email:result[i].email,
										phone:result[i].phone,
										gender:result[i].gender,
										code:'02'//接收到对方请求
									}
									data.push(dataTemp);
									continue;
								}
								if(friendString.indexOf(' '+result[i]._id+' ')!=-1){
									let dataTemp = {
										id:result[i]._id,
										name:result[i].name,
										headImg:result[i].headImg,
										email:result[i].email,
										phone:result[i].phone,
										gender:result[i].gender,
										code:'03'//已经是好友
									}
									data.push(dataTemp);
									continue;
								}
								let dataTemp = {
									id:result[i]._id,
									name:result[i].name,
									headImg:result[i].headImg,
									email:result[i].email,
									phone:result[i].phone,
									gender:result[i].gender,
									code:'04'//可添加好友 
								}
								data.push(dataTemp);
							}
							let response = {
								status:'ok',
								errString:'none',
								peoples:data
							}
							res.end(JSON.stringify(response));
						}
					)
				}
			)
		}
	})

}


//获取基本信息，如果没有基本信息则返回hasBaseInfo:false
const getBaseInfo = (result) => {
	return !!result[0].baseInfo.name?result[0].baseInfo:{hasBaseInfo:false};
}

const searchDataList = (resultInfo,callback) => {
	let listRequestTemp = [],listRequestResult = [],
		listSendedRequestTemp = [],listSendedRequestResult = [],
		listChatTemp = [],listChatResult = [],
		listFriendTemp = [],listFriendResult = [],
		unReadMsg = {},chatShow = {}, chatImgGroup = 'http://'+config.host+':'+config.port+'/images/chat.png';
	for(let i = 0; i < resultInfo[0].receivedRequestList.length; i++){
		listRequestTemp[i] = ObjectID(resultInfo[0].receivedRequestList[i]);
	}
	for(let i = 0; i < resultInfo[0].sendedRequestList.length; i++){
		listSendedRequestTemp[i] = ObjectID(resultInfo[0].sendedRequestList[i]);	
	}
	for(let i = 0; i < resultInfo[0].chatList.length; i++){
		listChatTemp[i] = ObjectID(resultInfo[0].chatList[i].id);	
		unReadMsg[resultInfo[0].chatList[i].id] = resultInfo[0].chatList[i].unReadMsg;
		chatShow[resultInfo[0].chatList[i].id] = resultInfo[0].chatList[i].show;
	}
	for(let i = 0; i < resultInfo[0].friendList.length; i++){
		listFriendTemp[i] = ObjectID(resultInfo[0].friendList[i]);	
	}

	const listRequestPromise = () => {
		return new Promise((resolve,reject)=>{
			db(
				'find',
				'user',
				{_id:{
					$in:listRequestTemp
				}},
				(result)=>{
					result.map((obj)=>{
						listRequestResult.push({
							id:obj._id,
							name:obj.name,
							headImg:obj.headImg,
							gender:obj.gender,
							email:obj.email,
							phone:obj.phone
						})
					});
					resolve();
				}
			)
		});
	}


	const listSendedRequestPromise = () => {
		return new Promise((resolve,reject)=>{
			db(
				'find',
				'user',
				{_id:{
					$in:listSendedRequestTemp
				}},
				(result)=>{
					result.map((obj)=>{
						listSendedRequestResult.push({
							id:obj._id,
							name:obj.name,
							headImg:obj.headImg,
							gender:obj.gender,
							email:obj.email,
							phone:obj.phone
						})
					});
					resolve();
				}
			)
		})
	}


	const listChatPromise = () => {
		return new Promise((resolve,reject)=>{
			db(
				'find',
				'chat',
				{_id:{
					$in:listChatTemp
				}},
				(result)=>{//获取到该用户下的所有聊天信息
					let singleFriend = [],
						sendData = [];
					result.map((obj)=>{
						if(obj.type == 'single'){//如果是单人聊天
							obj.users.map((user)=>{
								if(user != resultInfo[0]._id){
									singleFriend.push(ObjectID(user));
									sendData.push({
										chatType:'single',
										friendId:user,
										chatId:obj._id,
										users:obj.users,
										lastMessage:obj.lastMessage,
										unReadMsg:unReadMsg[obj._id],
										show:chatShow[obj._id],
										lastTimeStamp:obj.lastTimeStamp
									});
								}
							})
						}
						else{
							sendData.push({
								chatType:'group',
								users:obj.users,
								chatId:obj._id,
								chatName:obj.name,
								chatImg:'http://'+config.host+':'+config.port+'/images/chat.png',
								lastMessage:obj.lastMessage,
								unReadMsg:unReadMsg[obj._id],
								show:chatShow[obj._id],
								lastTimeStamp:obj.lastTimeStamp
							})
						}
						
					});

					db(
						'find',
						'user',
						{_id:{
							$in:singleFriend
						}},
						(resultFriend)=>{
							let record = {}
							resultFriend.map((obj)=>{
								record[obj._id] = {
									headImg:obj.headImg,
									name:obj.name
								}
							});
							sendData.map((obj)=>{
								if(obj.chatType=='single'){
									obj.chatImg = record[obj.friendId].headImg;
									obj.chatName = record[obj.friendId].name;
								}
							});
							listChatResult = sendData;
							resolve();
						}
					)
				}
			)
		})
	}


	const listFriendPromise = () => {
		return new Promise((resolve,reject)=>{
			db(
				'find',
				'user',
				{_id:{
					$in:listFriendTemp
				}},
				(result)=>{
					let userId = resultInfo[0]._id;
					result.map((obj)=>{
						listFriendResult.push({
							id:obj._id,
							name:obj.name,
							headImg:obj.headImg,
							gender:obj.gender,
							email:obj.email,
							phone:obj.phone,
							chatId:!!obj.chatMap[userId]?obj.chatMap[userId]:null
						})
					});
					resolve();
				}
			)
		})
	}

	listRequestPromise()
	.then(()=>{
		return listSendedRequestPromise();
	})
	.then(()=>{
		return listChatPromise();
	})
	.then(()=>{
		return listFriendPromise();
	})
	.then(()=>{
		callback({
			receivedRequestList:listRequestResult,
			sendedRequestList:listSendedRequestResult,
			chatList:listChatResult,
			friendList:listFriendResult
		});
	});



}

const sendUserInfoToWs = (type,code,result) => {
	return {
		type:type,
		code:code,//新增请求
		headImg:result[0].headImg,
		gender:result[0].gender,
		name:result[0].name,
		email:result[0].email,
		phone:result[0].phone,
		id:result[0]._id
	}
}


module.exports.createRouter = createRouter;