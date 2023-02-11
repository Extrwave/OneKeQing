import bot from "ROOT";
import { Private } from "#genshin/module/private/main";
import { Order } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";
import { privateClass } from "#genshin/init";
import { getMemberInfo } from "@modules/utils/account";
import { MessageToSend } from "@modules/utils/message";

function parseID( msg: string ): number {
	if ( !msg ) {
		return 0;
	}
	const id: number = parseInt( msg );
	if ( !Number.isNaN( id ) ) {
		return id - 1;
	}
	bot.logger.warn( `消息段解析出现异常: ${ msg }` );
	
	const res: string[] | null = msg.match( /(\d+)/g );
	if ( res ) {
		const list: string[] = res.sort( ( x, y ) => x.length - y.length );
		return parseInt( list[0] ) - 1;
	} else {
		return 0;
	}
}

/*新增查询他人是否开启授权方法*/
export async function getPrivateAccount( userID: string, idMsg: string = "1" ): Promise<string | Private> {
	const accounts: Private[] = privateClass.getUserPrivateList( userID );
	/* 根据UID和UserID查询是否开启授权服务 */
	if ( idMsg.length === 9 ) {
		const account = accounts.filter( value => {
			return value.setting.uid === idMsg;
		} );
		return account.length > 0 ? account[0] : `[ ${ idMsg } ] 未开启授权服务`;
	}
	
	/* 正常获取个人用户的授权服务 */
	const id: number = parseID( idMsg );
	if ( accounts.length === 0 ) {
		const PRIVATE_ADD = <Order>bot.command.getSingle( "silvery-star-private-subscribe", AuthLevel.Master );
		return "此功能需要您的账户授权信息\n" +
			"授权后你将拥有以下进阶功能\n\n" +
			"便筏查询         树脂提醒\n" +
			"派遣提醒         宝钱提醒\n" +
			"深渊查询         旅行札记\n" +
			"质变仪提醒    详细主页查询\n\n" +
			"如需添加授权，请私聊发送\n" +
			`[  ${ PRIVATE_ADD.getHeaders()[0] }  ] 并按照提示完成操作`;
	} else if ( accounts.length - 1 < id || id === -1 ) {
		const PRIVATE_LIST = <Order>bot.command.getSingle( "silvery-star-private-list", AuthLevel.Master );
		return `无效的序号，请使用 ${ PRIVATE_LIST.getHeaders()[0] } 检查`;
	}
	return accounts[id];
}

/* 因为sendMessage需要异步获取，无法写进构造器 */
export async function sendMessage( data: MessageToSend | string, userId: string ) {
	const sendMessage = await bot.message.getPostPrivateFunc( userId );
	if ( !sendMessage ) {
		const tip = typeof data === 'string' ? data : "[其他消息]";
		const userInfo = await getMemberInfo( userId );
		if ( !userInfo ) {
			bot.logger.error( `给 [${ userId }] 的主动消息发送失败\n${ tip }` );
			return;
		}
		bot.logger.error( `给 [${ userInfo.account.user.username }] 的主动消息发送失败\n${ tip }` );
		return;
	}
	await sendMessage( data );
}
