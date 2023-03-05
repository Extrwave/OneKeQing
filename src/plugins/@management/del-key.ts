import { InputParameter } from "@modules/command";

/**
Author: Extrwave
CreateTime: 2023/3/5
 */

export async function main( { sendMessage, redis, messageData }: InputParameter ): Promise<void> {
	const content = messageData.msg.content;
	await sendMessage( "开始删除Redis Key: " + content.replace( ".", "·" ) );
	const keys: string[] = await redis.getKeysByPrefix( content );
	keys.push( content );
	await redis.deleteKey( ...keys );
	await sendMessage( `已删除 ${ keys.length } 条数据` );
}