import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";

/**
Author: Extrwave
CreateTime: 2023/2/1
 */

const redisKey = 'adachi.coser-keqing-clothes';

export async function main(
	{
		matchResult, command, auth,
		messageData, sendMessage, redis
	}: InputParameter ) {
	
	const userID: string = messageData.msg.author.id;
	const guildId: string = messageData.msg.guild_id;
	const msgId: string = messageData.msg.id;
	const attachments = messageData.msg.attachments;
	const reference = messageData.msg.message_reference;
	const urls: string[] = [];
	
	if ( attachments ) {
		for ( let attachment of attachments ) {
			urls.push( "https://" + attachment.url );
		}
	}
	
	const header = ( <OrderMatchResult>matchResult ).header;
	const au: AuthLevel = await auth.get( userID, guildId );
	
	const GET = <Order>command.getSingle( "extr-wave-coser-get-clothes", au );
	const UPLOAD = <Order>command.getSingle( "extr-wave-coser-up-clothes", au );
	const DEL = <Order>command.getSingle( "extr-wave-coser-del-clothes", au );
	
	/* 用户获取Clothes */
	if ( GET.getHeaders().includes( header ) ) {
		const count = await redis.getSetMemberNum( redisKey );
		if ( count <= 0 ) {
			await sendMessage( "刻晴的衣橱已经空了很久啦，旅行者不为我添加几件吗？" );
			return;
		}
		const images = await redis.getRandomSetMember( redisKey );
		await sendMessage( {
			content: "可爱刻晴的百变形态，biu biu biu ~",
			image: images[0],
			msg_id: msgId
		} );
	} else if ( UPLOAD.getHeaders().includes( header ) ) {
		if ( urls.length <= 0 ) {
			await sendMessage( "请带上需要上传的刻晴图片" );
			return;
		}
		await redis.addSetMember( redisKey, ...urls );
		await sendMessage( `已为刻晴上传 ${ urls.length } 个服装` );
	} else {
		/*  */
		await sendMessage( "引用上传和丢弃功能正在努力挤牙膏实现中" );
	}
}