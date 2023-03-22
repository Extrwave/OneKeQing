import { InputParameter } from "@modules/command";
import { __RedisKey } from "@modules/redis";


/**
Author: Extrwave
CreateTime: 2023/3/22
 */
export async function main(
	{ sendMessage, messageData, message, redis }: InputParameter ) {
	
	//回复消息无法引用附件
	const content = messageData.msg.content;
	const reference = messageData.msg.message_reference;
	if ( !reference ) {
		await sendMessage( `请引用需要回复的消息` );
		return;
	}
	
	const msgId = reference.message_id;
	const userId = await redis.getHashField( __RedisKey.CALL_MESSAGE_REPLY + msgId, "userId" );
	const time = parseInt( await redis.getHashField( __RedisKey.CALL_MESSAGE_REPLY + msgId, "time" ) );
	
	const sendToUser = await message.getPostPrivateFunc( userId, Date.now() - time > 300 * 1000 ? msgId : "" );
	if ( sendToUser ) {
		await sendToUser( `收到开发者回复：\n\n` + content );
		await sendMessage( `回复用户成功 ~` );
	} else {
		await sendMessage( `回复用户消息失败 ~` );
	}
}