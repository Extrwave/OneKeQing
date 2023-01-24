import bot from "ROOT";
import { AuthLevel } from "@modules/management/auth";
import { Private } from "#genshin/module/private/main";
import { NoteService } from "#genshin/module/private/note";
import { InputParameter, Order } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { privateClass, renderer } from "#genshin/init";
import { getPrivateAccount, sendMessage } from "#genshin/utils/private";


async function getNowNote( userID: string, sn: string = "1" ): Promise<RenderResult | string> {
	
	const account = await getPrivateAccount( userID, sn );
	if ( typeof account === "string" ) {
		return account;
	}
	
	const data = await account.services[NoteService.FixedField].toJSON();
	const uid: string = account.setting.uid;
	const dbKey: string = `silvery-star.note-temp-${ uid }`;
	await bot.redis.setString( dbKey, data );
	const res: RenderResult = await renderer.asLocalImage(
		"/note.html", { uid }
	);
	return res;
}

export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const sn: string = messageData.msg.content;
	const res: RenderResult | string = await getNowNote( userID, sn );
	if ( typeof res === 'string' ) {
		await sendMessage( res );
		return;
	}
	
	if ( res.code === "local" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "url" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}