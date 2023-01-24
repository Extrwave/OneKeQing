import bot from "ROOT";
import { privateClass } from "#genshin/init";
import { Private } from "#genshin/module/private/main";
import { InputParameter } from "@modules/command";
import { checkMysCookieInvalid, refreshTokenBySToken } from "#genshin/utils/cookie";
import { checkCookieInvalidReason } from "#genshin/utils/cookie";

export async function main(
	{ sendMessage, messageData }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const newCookie: string = messageData.msg.content;
	/* 适配不需要序号的情况，简化用户操作 */
	await sendMessage( await replaceCookie( userID, newCookie ) );
}

async function replaceCookie( userID: string, newCookie: string ) {
	const accounts: Private[] = privateClass.getUserPrivateList( userID );
	
	if ( newCookie === "auto" ) {
		const message: string[] = [ "自动更新Cookie结果如下：" ];
		for ( let account of accounts ) {
			try {
				const { uid, cookie } = await refreshTokenBySToken( account );
				await account.replaceCookie( cookie );
				message.push( `[ UID${ uid } ] Cookie 更新成功` );
			} catch ( error ) {
				message.push( `[ UID ${ account.setting.uid } ] ${ <string>error }` );
			}
		}
		return message.join( "\n" );
	}
	
	try {
		const { uid, mysID, cookie, cookieV2 } = await checkMysCookieInvalid( newCookie );
		for ( let account of accounts ) {
			if ( mysID === account.setting.mysID.toString() ) {
				await account.replaceCookie( cookie );
				cookieV2 ? await account.replaceCookie( cookieV2 ) : "";
				return `[ UID${ uid } ] Cookie 更新成功`;
			}
		}
		return await privateClass.addPrivate( uid, cookie, userID );
	} catch ( error ) {
		bot.logger.error( error );
		return checkCookieInvalidReason( <string>error );
	}
}