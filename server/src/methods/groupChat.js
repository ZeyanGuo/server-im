const db = require('../../db');
const ObjectID = require('mongodb').ObjectID; 
const message = require('./message.js');
const config = require('../../../config/server.config');
module.exports.groupChat = (msg,ws,wss) => {

}

const errMessageSend = (info,ws) => {
	ws.send({
		status:'err',
		errString:info,
	});
}

module.exports.createGroupChat = (msg,ws,wss) => {
	let ids = msg.ids,
		chatName = msg.chatName,
		data = {
			name:chatName,
			type:'group',
			users:ids,
			lastMessage:'',
			lastTimeStamp:''
		}
	//创建聊天数据表
	db(
		'add',
		'chat',
		data,
		(result)=>{
			if(result.insertedCount === 1){//插入数据库成功。
				let sendData = {
					status:'ok',
					errString:'none',
					type:'createGroupChat',
					result:data
				}
				sendData.result.chatImg = 'http://'+config.host+':'+config.port+'/images/chat.png';
				ids.map((id)=>{

					db(
						'update',
						'user',
						[
							{_id:ObjectID(id)},
							{
								$addToSet:{
									chatList:{
										id:result.insertedIds[0].toString(),
										unReadMsg:0
									}
								}
							}
						],
						(result)=>{
						}
					)
					if(!!wss[id]&&wss[id].readyState==1){
						wss[id].send(JSON.stringify(sendData));//向所有用户广播创建群聊		
					}
				})
			}
			else{
				errMessageSend('create group chat failed(can\'t not create chat)');
			}
		}
	);
}

module.exports.groupChat = (msg,ws,wss) => {//群聊消息
	let Token = msg.Token,
		chatId = msg.chatId,
		userId = msg.id,
		message = {
			message:msg.message,
			timeStamp:new Date().getTime().toString()
		};

	const addMessagePromise = (chatId,message,ws,Token) => {
		return new Promise((resolve,reject)=>{
			db(
				'add',
				chatId,
				{
					userId:userId,
					msg:message.message,
					time:message.timeStamp
				},
				(result)=>{
					if(result.insertedCount === 1){
						ws.send(JSON.stringify({//向客户端回馈消息发送成功
							type:'groupChat',
							status:'ok',
							errString:'none',
							chatId:chatId,
							code:0,
							Token:Token
						}));
						resolve(result.insertedIds[0].toString());
					}
					else{
						errMessageSend('send group message failed(can\'t not send message)');
						reject();
					}
				}
			)
		})
	}

	const addLastMessageToChat = (chatId,message,msgId) => {
		return new Promise((resolve,reject)=>{
			db(
				'update',
				'chat',
				[
					{_id:ObjectID(chatId)},
					{
						$set:{
							lastMessage:message.message,
							lastTimeStamp:message.timeStamp
						}
					}
				],
				(result)=>{
					if(result.result.nModified != 0){
						resolve(msgId);
					}
					else{
						errMessage('update chat last message faild');
						reject();
					}
				}
			)
		})
	}

	const sendWsMessageToAll = (chatId,message,Token,msgId,userId,wss) => {
		return new Promise((resolve,reject)=>{
			db(
				'find',
				'chat',
				{_id:ObjectID(chatId)},
				(result)=>{
					if(result.length > 0){
						let ids = result[0].users;
						ids.map((id) => {
							if(id != userId && !!wss[id] && wss[id].readyState==1){
								wss[id].send(JSON.stringify({
									Token:Token,
									chatId:chatId,
									code:1,
									errString:'none',
									status:'ok',
									type:'groupChat',
									result:{
										msg:message.message,
										time:message.timeStamp,
										userId:userId,
										_id:msgId
									}
								}));
							}
						});
						resolve();
					}
					else{
						errMessage('find chat by chatId faild');
						reject();
					}
				}
			)
		})
	}

	addMessagePromise(chatId,message,ws,Token)//添加message到对应的chatId信息中
	.then((msgId)=>{
		return addLastMessageToChat(chatId,message,msgId);//更新chat表中对应的最新信息和最新时间
	})
	.then((msgId)=>{
		return sendWsMessageToAll(chatId,message,Token,msgId,userId,wss);//向所有的用户广播消息
	})
	.then(()=>{

	});



}
