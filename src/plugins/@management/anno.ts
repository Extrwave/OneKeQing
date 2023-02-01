/**
Author: Ethereal
CreateTime: 2022/6/26
 */
import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";
import { __RedisKey } from "@modules/redis";
import { Sleep } from "@modules/utils";

export async function main( { messageData, redis, message, sendMessage, logger }: InputParameter ) {
	const userId = messageData.msg.author.id;
	let content = messageData.msg.content;
	const msgId = messageData.msg.id;
	const attachments = messageData.msg.attachments;
	
	content = "来自开发者留言：\n  " + content;
	
	const guildIds: string[] = await redis.getSet( __RedisKey.GUILD_USED );
	for ( const guild of guildIds ) {
		try {
			const channelId = await redis.getHashField( __RedisKey.GUILD_USED_CHANNEL, guild );
			const sendMessage = await message.getSendGuildFunc( userId, guild, channelId, msgId );
			await sendMessage( content );
			if ( attachments ) {
				for ( const value of attachments ) {
					await sendMessage( { image: "https://" + value.url } );
				}
			}
			await Sleep( 3000 );
		} catch ( error ) {
			logger.error( error );
		}
	}
	await sendMessage( "完成向所有频道发送公告" );
}