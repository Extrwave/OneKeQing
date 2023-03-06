import { pull } from "lodash";
import { SendFunc } from "@modules/message";
import { scheduleJob } from "node-schedule";
import { AuthLevel } from "@modules/management/auth";
import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { Account, getMemberInfo } from "@modules/utils/account";
import { Private } from "#genshin/module/private/main";
import { privateClass } from "#genshin/init";

/**
Author: Extrwave
CreateTime: 2023/3/5
 */
const tempSubscriptionList: string[] = [];

async function subscribe( userID: string, send: SendFunc, CONFIRM: Order ): Promise<string> {
	
	if ( tempSubscriptionList.includes( userID ) ) {
		return "您已经处于云原神签到服务申请状态";
	}
	
	tempSubscriptionList.push( userID );
	
	const d = new Date();
	scheduleJob( d.setMinutes( d.getMinutes() + 3 ), async () => {
		const isFinish: string | undefined = tempSubscriptionList.find( el => el === userID );
		
		if ( isFinish !== undefined ) {
			pull( tempSubscriptionList, userID );
			await send( "云原神签到服务申请超时，BOT 自动取消\n" +
				"请先检查发送消息内容是否符合要求\n" +
				"私聊可能会屏蔽掉发送的 token信息\n" );
		}
	} );
	
	const info: Account = await getMemberInfo( userID );
	const title = info ? `[ ${ info.account.nick } ] 您好 \n` : `[ ${ userID } ] 您好 \n`;
	
	return title +
		`BOT承诺保护您的账户信息安全\n` +
		`确定开启授权功能请使用此指令\n ` +
		`[ ${ CONFIRM.getCNHeader() } token ] 来继续\n` +
		"token是需要按照教程获取并替换\n" +
		"请在 3 分钟内进行超时会自动取消\n" +
		"频道发送「 @BOT 教程 」获取教程";
}

async function confirm( userID: string, token: string, SUBSCRIBE: Order, APPLY: Order ): Promise<string> {
	if ( !tempSubscriptionList.some( el => el === userID ) ) {
		return `你还未申请云原神签到服务，请先使用 [ ${ SUBSCRIBE.getCNHeader() } ] 申请`;
	}
	
	const reg = new RegExp( /.*?oi=([0-9]+).*?/g );
	const execRes: RegExpExecArray | null = reg.exec( token );
	if ( execRes === null ) {
		return "抱歉，请重新提交正确的 token\n" +
			`token是需要按照教程获取并替换\n` +
			`实在有问题请前往BOT官方频道反馈`;
	}
	
	const privates: Private[] = privateClass.getUserPrivateList( userID );
	const single = privates.find( value => {
		return value.setting.mysID.toString() === execRes[1];
	} );
	
	if ( !single ) {
		return "抱歉，此功能需要前置功能支持\n" +
			`请先使用 [ ${ APPLY.getCNHeader() } ] 完成米游社授权`;
	}
	
	await single.replaceCloudGameToken( token );
	pull( tempSubscriptionList, userID );
	//进行操作
	return await single.services.cloud.toggleEnableStatus( true );
}


/* 根据SilverStar的Private Subscribe编写 */
export async function main(
	{ messageData, command, sendMessage, matchResult }: InputParameter
): Promise<void> {
	
	const userID: string = messageData.msg.author.id;
	const data: string = messageData.msg.content;
	
	const header = ( <OrderMatchResult>matchResult ).header;
	
	const SUBSCRIBE = <Order>command.getSingle( "extr-wave-cloud-game-enable", AuthLevel.User );
	const YCONFIRM = <Order>command.getSingle( "extr-wave-cloud-game-confirm", AuthLevel.User );
	const APPLY = <Order>command.getSingle( "silvery-star-private-subscribe", AuthLevel.User );
	
	if ( SUBSCRIBE.getHeaders().includes( header ) ) {
		const msg: string = await subscribe( userID, sendMessage, YCONFIRM );
		await sendMessage( msg );
	} else if ( YCONFIRM.getHeaders().includes( header ) ) {
		const msg: string = await confirm( userID, data, SUBSCRIBE, APPLY );
		await sendMessage( msg );
	}
}