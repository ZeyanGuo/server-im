const db = require('../../db');
const ObjectID = require('mongodb').ObjectID; 


const clearTheUnReadMsg = (id,chatId) => {
	db(
		'find',
		'user',
		{
			_id:ObjectID(id)
		},
		(result)=>{
			let clearTheChat = false,
				chatList = result[0].chatList;

			for(let i = 0;i < chatList.length; i++){
				if(chatList[i].id == chatId && chatList[i].unReadMsg>0){
					clearTheChat = true;
					break;
				}
			}
			if(clearTheChat){
				db(
					'update',
					'user',
					[
						{
							_id:ObjectID(id),
							'chatList.id':chatId
						},
						{
							$set:{
								"chatList.$.unReadMsg":0
							}
						}
					],
					(result)=>{
					}
				)
			}

		}
	)
}

module.exports.checkMessage = (msg) => {
	let userId = msg.id,
		msgId = msg.msgId,
		chatId = msg.chatId,
		code = msg.code;


	if(code == 0){//消息未读取
		
	}else{//消息已读
		db(
			'update',
			'user',
			[
				{
					_id:ObjectID(userId),
					'chatList.id':chatId
				},
				{
					$inc:{
						"chatList.$.unReadMsg":-1
					}
				}
			],
			(result)=>{
				
			}
		)
	}
}

module.exports.getHistoryRecord = (msg,ws) => {
	let chatId = msg.chatId,
		limit = 20,
		id = msg.id,
		skipCount = msg.skipCount;//每次获取20页数据

	db(
		'sortFind',
		chatId.toString(),
		[
			{time:-1},
			skipCount,
			limit
		],
		(result) => {
			let data = [],code,moreMsg;
			result.map((obj)=>{
				if(obj.userId == id){
					code = 0;//表示主态信息
				}
				else{
					code = 1;//表示客态信息
				}
				data.push({
					msgId:obj._id,
					code:code,
					userId:obj.userId,
					msg:obj.msg,
					time:obj.time,
					type:obj.type
				});
			})
			moreMsg = result.length == 20 ?true:false;
			ws.send(JSON.stringify({
				type:'getHistoryRecord',
				status:'ok',
				errString:'none',
				result:data,
				count:result.length,
				chatId:chatId,
				moreMsg:moreMsg//表示是否还有更多消息
			}));
			clearTheUnReadMsg(id,chatId);
		}
	)
}