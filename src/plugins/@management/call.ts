import { InputParameter } from "@modules/command";
import { Embed, IMessage } from "qq-guild-bot";
import { MessageType } from "@modules/utils/message";
import { getMessageType } from "@modules/message";
import { getGuildBaseInfo } from "@modules/utils/account";
import { EmbedMsg } from "@modules/utils/embed";
import { __RedisKey } from "@modules/redis";

/**
Author: Ethereal
CreateTime: 2022/7/25
 */
export async function main(
	{ sendMessage, messageData, message, redis }: InputParameter ) {
	
	const attachments = messageData.msg.attachments;
	
	const content = messageData.msg.content;
	if ( content.length <= 0 && !attachments ) {
		await sendMessage( "需要反馈什么呢？请带上内容 ~ " );
		return;
	}
	const name = messageData.msg.author.username;
	const avatar = messageData.msg.author.avatar;
	const msgType: MessageType = getMessageType( messageData ); //获取消息类型
	const type = msgType === MessageType.Private ? "私聊" : "频道";
	const userId = messageData.msg.author.id;
	const guildId = messageData.msg.src_guild_id ? messageData.msg.src_guild_id : messageData.msg.guild_id;
	const msgId = messageData.msg.id;
	
	/* 获取发送给Master的方法 ~ */
	const sendMasterFunc = await message.getSendMasterFunc( msgId );
	const guildInfo = await getGuildBaseInfo( guildId );
	
	const embedMsg: Embed = new EmbedMsg(
		'有人给你留言啦 ~ ',
		"",
		'频道用户留言',
		avatar,
		`用户：${ name }`,
		`方式：${ type }`,
		`频道：${ guildInfo?.name }\n\n`,
		`${ content }\n\n`,
	)
	try {
		await sendMasterFunc( { embed: embedMsg } );
		const data: IMessage = await sendMasterFunc( `引用此消息回复 [ ${ name } ]` );
		console.log( data );
		await redis.setHashField( __RedisKey.CALL_MESSAGE_REPLY + data.id, "msgId", data.id );
		await redis.setHashField( __RedisKey.CALL_MESSAGE_REPLY + data.id, "userId", userId );
		await redis.setHashField( __RedisKey.CALL_MESSAGE_REPLY + data.id, "time", Date.now() );
		await redis.setTimeout( __RedisKey.CALL_MESSAGE_REPLY + data.id, 24 * 3600 );
		if ( attachments ) {
			attachments.forEach( value => {
				sendMasterFunc( { image: "https://" + value.url } );
			} );
		}
		await sendMessage( `消息发送成功啦 ~` );
	} catch ( error ) {
		await sendMessage( `消息发送失败，原因：\n${ error }\n请前往BOT资料卡上官频反馈` );
		return;
	}
}