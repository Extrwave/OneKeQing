import { InputParameter } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { RenderResult } from "@modules/renderer";
import { ledgerPromise } from "#genshin/utils/promise";
import { getPrivateAccount } from "#genshin/utils/private";
import { renderer } from "#genshin/init";

function monthCheck( m: number ) {
	const optional: number[] = [];
	for ( let n = new Date().getMonth() + 1, i = 0; i < 3; i++ ) {
		optional.push( n );
		n = n - 1 <= 0 ? 12 : n - 1;
	}
	
	return m > 12 || m < 1 || !optional.includes( m );
}

export async function main(
	{ sendMessage, messageData }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const data = <RegExpExecArray>( /(\d+)? *(\d+)?/.exec( messageData.msg.content ) );
	
	let month: number = -1;
	let idMsg: string = "";
	if ( !data[1] ) {
		/* 序号 和 月份 均为指定，使用默认序号和月份 */
		month = new Date().getMonth() + 1;
	} else {
		let m: number;
		if ( !data[2] ) {
			/* 只有一个参数时，视为月份 */
			m = parseInt( data[1] );
		} else {
			idMsg = data[1];
			m = parseInt( data[2] );
		}
		if ( monthCheck( m ) ) {
			await sendMessage( `无法查询 ${ m } 月的札记数据` );
			return;
		} else {
			month = m;
		}
	}
	
	const info: Private | string = await getPrivateAccount( userID, idMsg );
	if ( typeof info === "string" ) {
		await sendMessage( info );
		return;
	}
	
	const { cookie, uid, server } = info.setting;
	
	try {
		await ledgerPromise( uid, server, month, cookie );
	} catch ( error ) {
		if ( error !== "gotten" ) {
			await sendMessage( <string>error );
			return;
		}
	}
	await sendMessage( "获取成功，正在生成图片..." );
	const res: RenderResult = await renderer.asBase64( "/ledger.html", { uid } );
	if ( res.code === "base64" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "url" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}