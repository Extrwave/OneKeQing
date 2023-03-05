import { InputParameter, Order } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { privateClass } from "#genshin/init";
import { AuthLevel } from "@modules/management/auth";

/**
Author: Extrwave
CreateTime: 2023/3/5
 */

export async function main(
	{ sendMessage, messageData, command }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const newToken: string = messageData.msg.content;
	/* 适配不需要序号的情况，简化用户操作 */
	const reg = new RegExp( /.*?oi=([0-9]+).*?/g );
	const execRes: RegExpExecArray | null = reg.exec( newToken );
	if ( execRes === null ) {
		await sendMessage( "抱歉，请重新提交正确的 token\n" +
			`token是需要按照教程获取并替换\n` +
			`实在有问题请前往BOT官方频道反馈` );
		return;
	}
	
	const mysID = execRes[1];
	
	const privates: Private[] = privateClass.getUserPrivateList( userID );
	const single = privates.find( value => {
		return value.setting.mysID.toString() === mysID;
	} );
	
	if ( !single ) {
		const APPLY = <Order>command.getSingle( "silvery-star-private-subscribe", AuthLevel.User );
		await sendMessage( "抱歉，此功能需要前置功能支持\n" +
			`请先使用 [ ${ APPLY.getCNHeader() } ] 完成米游社授权` );
		return;
	}
	
	await single.replaceCloudGameToken( newToken );
	await sendMessage( "云原神授权已成功更新" );
}