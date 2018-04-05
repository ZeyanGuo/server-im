const db = require('../../db');
const ObjectID = require('mongodb').ObjectID; 
const config = require('../../../config/server.config');

const arrCompare = (array0,array) => {
  // compare lengths - can save a lot of time 
  if (array0.length != array.length)
    return false;
  for (var i = 0, l = array0.length; i < l; i++) {
    // Check if we have nested arrays
    if (array0[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!array0[i].equals(array[i]))
        return false;    
    }      
    else if (array0[i] != array[i]) { 
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;  
    }      
  }    
  return true;
}

const findUserByIdPromise = (id,fn) => {
	return new Promise((resolve,reject)=>{
		db(
			'find',
			'user',
			{_id:ObjectID(id)},
			(result)=>{
				fn(result,resolve,reject);
			}
		)
	});
}
const findChatByChatIdAndIds = (data,fn) => {
	let chatIds = data.chatIdList.map((obj)=>{
		return ObjectID(obj);
	});
	return new Promise((resolve,reject)=>{
		db(
			'find',
			'chat',
			{
				_id:{
					$in:chatIds
				}
			},
			(result)=>{
				let resultArr = result.filter((obj)=>{
					if(obj.userIds.length == data.ids.length){
						let allMatch = false,userIds = obj.userIds;
						let dataSort = data.ids.sort((i,j)=>{
							return i<j;
						})
						let userSort = userIds.sort((i,j)=>{
							return i<j;
						});
						if(arrCompare(dataSort,userSort)){
							return true;
						}
						else{
							return false;
						}
					}
					else{
						return false
					}
				});
				fn(resultArr,resolve,reject);
			}
		)
	})
}

const findAndSortMessagesByChatId = (data,fn) =>{
	return new Promise((resolve,reject)=>{
		db(
			'sortFind',
			'message',
			[
				{chatId:ObjectID(data.chatId)},
				{timeStamp:1},
				data.skipCount,
				data.limitCount
			],
			(result) => {
				fn(result,resolve,reject);
			}
		)
	})
}

const findUserInArray = (array,fn) => {
	return new Promise((resolve,reject) => {
		db(
			'find',
			'user',
			{
				_id:{
					$in:array
				}
			},
			(result) => {
				fn(result,resolve,reject);
			}
		)
	})
}

const addChat = (obj,fn) => {
	return new Promise((resolve,reject) => {
		db(
			'add',
			'chat',
			obj,
			(result)=>{
				fn(result,resolve,reject);
			}
		)
	})
}


const returnErrMessage = (ws,errString) => {
	ws.send(JSON.stringify({
		status:'err',
		errString:errString
	}));
}

const hasChatIdfromWS = (chatId,fn) => {
	return new Promise((resolve,reject)=>{
		db(
			'find',
			'chat',
			{_id:ObjectID(chatId)},
			(result)=>{
				fn(result,resolve,reject);
			}
		)
	})
}
const getChatNameAndImg = (chatName,users,friendId) => {
		let chatNameSend = '',chatImg = 'http://'+config.host+':'+config.port+'/images/chat.png';
		if(!!chatName){
			chatNameSend = chatName;
		}
		else{
			let user = users.filter((obj)=>{
				return obj.id == friendId; 
			});
			chatNameSend = user[0].name;
			chatImg = user[0].headImg;
		}
		return {
			chatName:chatNameSend,
			chatImg:chatImg
		}
}

module.exports.startChat = (msg,ws,wss,LoginUsers) => {//聊天方法

	let friendArr = msg.friendIds.map((obj)=>{
		return ObjectID(obj);
	});

	friendArr.push(ObjectID(msg.id));

	findUserInArray(friendArr,(result,resolve,reject)=>{
		if(result.length != friendArr.length){
			reject('Friend is not exist');
		}
		else{
			let data = {},existChatList,ids = [];
			data.users = result.map((obj)=>{
				if(msg.id == obj._id){//获取到存在的chatId列表
					existChatList = obj.existChatList;
				}
				ids.push(ObjectID(obj._id));
				return {
					id:obj._id,
					name:obj.name,
					headImg:obj.headImg,
					gender:obj.gender,
					email:obj.email,
					phone:obj.phone
				}
			});
			let resolveData = {
				data:data,
				existChatList:existChatList,
				ids:ids
			}
			resolve(resolveData);
		}
	})
	.then(
		(data)=>{
			if(!msg.chatId){//如果前端没有传入chatId
				return findChatByChatIdAndIds(
					{
						chatIdList:data.existChatList,
						ids:data.ids
					},
					(result,resolve,reject)=>{
						let resolveData;
						if(result.length>0){//存在chatId
							resolveData = {
								data:data.data,
								chatId:result[0]._id,
								chatName:result[0].chatName,
								hasChatId:true
							}
							resolve(resolveData);
						}
						else{//不存在chatId
							resolveData = {
								data:data.data,
								chatId:null,
								chatName:null,
								hasChatId:false
							}
							resolve(resolveData);
						}
					}
				)
			}
			else{//如果前端传入chatId
				return hasChatIdfromWS(msg.chatId,(data,resolve,reject)=>{
					let resolveData = {
						data:data.data,
						chatId:result[0]._id,
						chatName:result[0].chatName,
						hasChatId:true
					}
					resolve(resolveData);
				})
			}
		},
		(info)=>{//输出错误信息
			returnErrMessage(ws,info);
		}
	)
	.then(
		(data)=>{
			if(data.hasChatId){
				return findAndSortMessagesByChatId(//根据chatid查找出最新的10条记录
					{
						chatId:data.chatId,
						skipCount:0,
						limitCount:10
					},
					(result,resolve,reject) => {
						let messages;
						if(result.length>0){
							messages = result.map((obj)=>{
								return {
									uerId:obj.userId,
									textType:obj.textType,
									message:obj.message,
									timeStamp:obj.timeStamp
								}
							});
						}
						else {
							messages = [];
						}
						let user = getChatNameAndImg(data.chatName,data.data.users,msg.friendIds[0]);
						let sendData = {
							chatId:data.chatId,
							users:data.data.users,
							chatName:user.chatName,
							messages:messages,
							chatImg:user.chatImg
						}
						resolve(sendData);
					}
				)
			}
			else{//创建一个新的chat
				let userIds;
				let user = getChatNameAndImg(data.chatName,data.data.users,msg.friendIds[0]);
				userIds = msg.friendIds.map((obj)=>{
					return obj;
				})
				userIds.push(msg.id);


				let chat = {
					userIds:userIds,
					chatName:user.chatName,
					chatImg:user.chatImg
				}

				
				return addChat(
					chat,
					(result,resolve,reject)=>{
						
						let sendData = {
							chatId: result.insertedIds[0],
							users:data.data.users,
							chatName:user.chatName,
							messages:[],
							chatImg:user.chatImg
						};
						let updateOperation = {
							existChatList:result.insertedIds[0]
						}
						let userArr = data.data.users.map((obj)=>{
							
							if(obj.id == msg.id){
								updateOperation.chatList = result.insertedIds[0];
							}
							db(
								'update',
								'user',
								[
									{
										_id:ObjectID(obj.id)
									},
									{
										$addToSet:updateOperation
									}
								],
								(result)=>{
								}
							);
						})
						
						resolve(sendData);
					}
				)
			}
		},
		(info)=>{
			returnErrMessage(ws,info);	
		}
	)
	.then((data)=>{
		data.type = "startChat";
		ws.send(JSON.stringify(data));
	})

}
