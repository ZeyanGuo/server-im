const db = require('../../db');
const ObjectID = require('mongodb').ObjectID; 
const message = require('./message.js');

const getUserInfoById = (id,callback) => {
	return new Promise((resolve,reject)=>{
		db(
			'find',
			'user',
			{_id:ObjectID(id)},
			(result)=>{
				callback(result,resolve,reject);
			}
		)
	})
}
const addMessageToChat = (chatId,data,callback) =>{
	return new Promise((resolve,reject)=>{
		db(
			'add',
			chatId.toString(),
			data,
			(result)=>{
				callback(result,resolve,reject);
			}
		)
	})
}

const createChat = (data,callback) => {
	return new Promise((resolve,reject)=>{
		db(
			'add',
			'chat',
			data,
			(result)=>{
				callback(result,resolve,reject);
			}
		)
	})
}

const sendErrMessage = (info,ws,Token) => {
	ws.send({
		status:'err',
		errString:info,
		Token:Token,
		code:0
	})
}

const broadCastMessage = (ws,wss,id,userData,friendData) => {
	userData.type = "singleChat";
	friendData.type = 'singleChat';
	ws.send(JSON.stringify(userData));
	if(!!wss[id]&&wss[id].readyState==1){
		wss[id].send(JSON.stringify(friendData));
	}
	else{
		message.checkMessage({
			id:id,
			chatId:userData.chatId,
			code:0
		})
	}
}

const hasChatIdMethod = (baseInfo,userId,message,chatId,Token) => {
	let data = {
		userId:userId,
		msg:message,
		time:new Date().getTime().toString()
	}
	//添加消息到message表，并且发送回馈
	return addMessageToChat(chatId,data,(result,resolve,reject)=>{
		if(result.insertedCount === 1){//插入数据成功
			broadCastMessage(
				baseInfo.ws,
				baseInfo.wss,
				baseInfo.friendId,
				{
					status:'ok',
					errString:'none',
					code:0, //表示本人发送请求后回首到的消息
					chatId:chatId,
					Token:Token,
					msgId:data._id
				},
				{
					status:'ok',
					errString:'none',
					result:data,
					code:1, //表示给他人发送的消息
					chatId:chatId,
					Token:Token
				}
			)
			storeChatToChatList(//存储到chatList并且发送显示聊天List
				userId,
				baseInfo.friendId,
				baseInfo.ws,
				baseInfo.wss,
				chatId,
				message
			)
			resolve(null);
		}
		else{
			reject('message send failed(data can\'t insert to '+chatId+')');
		}
		
	})
}

const storeChatToChatList = (userId,friendId,ws,wss,chatId,message) => {//储存聊天信息到chatList
	let sendDataToUser = {
			type:'createSingleChat',
			friendId:friendId,
			chatId:chatId,
			lastMessage:message
		},
		sendDataToFriend = {
			type:'createSingleChat',
			friendId:userId,
			chatId:chatId,
			lastMessage:message
		};
	let ids = [],users = [];
	ids.push(ObjectID(userId));
	ids.push(ObjectID(friendId));

	users.push(userId);
	users.push(friendId);
	db(
		'find',
		'user',
		{
			_id:{
				$in:ids
			},
			"chatList.id":chatId
		},
		(result)=>{
			if(result.length === 0){//在chatList中都不存在则想chatList中添加信息
				updateToUser();
				updateToFriend();
			}
			if(result.length === 1){//如果另一个删除了chat
				let id = result[0]._id;
				if(id == userId){
					updateToUser();
				}
				else if(id == friendId){
					updateToFriend();
				}
			}
		}
	)

	const updateToUser = () => {
		db(
			'update',
			'user',
			[
				{
					_id:ObjectID(userId)
				},
				{
					$addToSet:{
						chatList:{
							id:chatId,
							unReadMsg:0
						}
					}
				}
			],
			(result)=>{
				if(result.result.nModified != 0){
					db(
						'find',
						'user',
						{
							_id:ObjectID(friendId)
						},
						(result)=>{
							sendDataToUser.chatImg = result[0].headImg;
							sendDataToUser.chatName = result[0].name;
							sendDataToUser.chatType = 'single';
							sendDataToUser.users = users;
							ws.send(JSON.stringify(sendDataToUser));
						}
					)
				}
			}
		)
	}

	const updateToFriend = () => {
		db(
			'update',
			'user',
			[
				{
					_id:ObjectID(friendId)
				},
				{
					$addToSet:{
						chatList:{
							id:chatId,
							unReadMsg:0
						}
					}
				}
			],
			(result)=>{
				if(result.result.nModified != 0){
					if(!!wss[friendId]){
						db(
							'find',
							'user',
							{
								_id:ObjectID(userId)
							},
							(result)=>{
								sendDataToFriend.chatImg = result[0].headImg;
								sendDataToFriend.chatName = result[0].name;
								sendDataToFriend.chatType = 'single';
								sendDataToFriend.users = users;
								wss[friendId].send(JSON.stringify(sendDataToFriend));
							}
						)
					}
				}
			}
		)
	}

}

module.exports.startSingleChat = (msg,ws) => {
	let friendId = msg.friendId,
		userId = msg.id;

	db(
		'find',
		'user',
		{
			_id:ObjectID(userId)
		},
		(result)=>{
			let chatId = result[0].chatMap[friendId];

			db(
				'find',
				'user',
				{
					_id:ObjectID(friendId)
				},
				(result)=>{
					let headImg = result[0].headImg,
						userName = result[0].name;
					if(!!chatId){
						ws.send(JSON.stringify({
							type:'startSingleChat',
							status:'ok',
							errString:'none',
							result:{
								chatId:chatId,
								chatInfo:{
									friendImg:headImg,
									chatName:userName
								}
							}
						}))
					}
					else{
						ws.send(JSON.stringify({
							type:'startSingleChat',
							status:'ok',
							errString:'none',
							result:{
								chatId:null,
								chatInfo:{
									friendImg:headImg,
									chatName:userName
								}
							}
						}))
					}
				}
			)
		}
	)
}

module.exports.singleChat = (msg,ws,wss) => {
	let friendId = msg.friendId,
		userId = msg.id,
		message = msg.message;

	getUserInfoById(userId,(result,resolve,reject)=>{
		let chatMap = result[0].chatMap;
		if(!!chatMap[friendId]){//存在chatId
			resolve(chatMap[friendId]);
		}
		else{//不存在chatId
			resolve(null)
		}
	})
	.then((chatId)=>{
		if(!!chatId){
			db(
				'update',
				'chat',
				[
					{
						_id:ObjectID(chatId)
					},
					{
						$set:{
							lastMessage:message,
							lastTimeStamp:new Date().getTime().toString()
						}
					}
				],
				(result)=>{

				}
			)
			return hasChatIdMethod({ws:ws,wss:wss,friendId:friendId},userId,message,chatId,msg.Token);
		}
		else{
			//创建chatId
			let users = [];
			users.push(friendId);
			users.push(userId);
			let data = {
				name:null,
				type:'single',
				users:users,
				lastMessage:message,
				lastTimeStamp:new Date().getTime().toString()
			}
			return createChat(data,(result,resolve,reject)=>{
				if(result.insertedCount === 1){
					resolve(result.insertedIds[0].toString());//返回所写入的chatId
				}
				else{
					reject('message send failed(can\'t not create chat)');
				}
			})
		}
	})
	.then(
		(chatId)=>{
			if(!!chatId){//如果chatId被创建
				let updateIndex = 'chatMap.'+friendId;
				let updateString = {[updateIndex]:chatId.toString()};
				let updateIndexFriend = 'chatMap.'+userId;
				let updateStringFriend = {[updateIndexFriend]:chatId.toString()};
				hasChatIdMethod({ws:ws,wss:wss,friendId:friendId},userId,message,chatId,msg.Token);
				db(
					'update',
					'user',
					[
						{_id:ObjectID(userId)},
						{
							$set:updateString
						}
					],
					(result)=>{
					}
				);
				db(
					'update',
					'user',
					[
						{_id:ObjectID(friendId)},
						{
							$set:updateStringFriend
						}
					],
					(result)=>{}
				);
			}
			else{//消息发送成功不处理

			}
		},
		(info)=>{
			sendErrMessage(info,ws,msg.Token);
		}
	)
}
