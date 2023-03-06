import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { Embed, MessageToCreate } from "qq-guild-bot";
import { ErrorMsg, MessageType } from "@modules/utils/message";
import { AuthLevel } from "@modules/management/auth";
import { getMessageType, SendFunc } from "@modules/message";
import { getGuildBaseInfo } from "@modules/utils/account";
import { EmbedMsg } from "@modules/utils/embed";
import { __RedisKey } from "@modules/redis";

/**
Author: Ethereal
CreateTime: 2022/7/25
 */
export async function main(
	{ sendMessage, messageData, message }: InputParameter ) {
	
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
		if ( attachments ) {
			attachments.forEach( value => {
				sendMasterFunc( { image: "https://" + value.url } );
			} );
		}
	} catch ( error ) {
		await sendMessage( `消息发送失败，原因：\n${ error }\n请前往BOT资料卡上官频反馈` );
		return;
	}
}