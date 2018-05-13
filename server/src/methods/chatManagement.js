const db = require('../../db');
const ObjectID = require('mongodb').ObjectID; 
const config = require('../../../config/server.config');

module.exports.deleteChat = (msg,ws,wss) => {
	let chatId = msg.chatId,
		userId = msg.userId;

	db(//隐藏chatList并且清楚消息提醒
		'update',
		'user',
		[
			{
				_id:ObjectID(userId),
				'chatList.id':chatId
			},
			{
				$set:{
					"chatList.$.show":false,
					"chatList.$.unReadMsg":0
				}
			}
		],
		(result)=>{
			if(result.result.nModified != 0){
				ws.send(JSON.stringify({
					type:'deleteChat',
					status:'ok',
					errString:'none',
					result:{
						chatId:chatId
					}
				}));
			}
			else {
				ws.send(JSON.stringify({
					type:'deleteChat',
					status:'err',
					errString:'chat can not delete successfully'
				}));
			}
		}
	)

}