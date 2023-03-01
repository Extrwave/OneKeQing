import bot from "ROOT";
import { renderer } from "#genshin/init";
import { RenderResult } from "@modules/renderer";
import { InputParameter } from "@modules/command";
import { NoteService } from "#genshin/module/private/note";
import { getPrivateAccount } from "#genshin/utils/private";


async function getNowNote( userID: string, sn: string = "1" ): Promise<RenderResult | string> {
	
	const account = await getPrivateAccount( userID, sn );
	if ( typeof account === "string" ) {
		return account;
	}
	const data = await account.services[NoteService.FixedField].toJSON();
	const uid: string = account.setting.uid;
	const dbKey: string = `silvery-star.note-temp-${ uid }`;
	await bot.redis.setString( dbKey, data );
	const res: RenderResult = await renderer.asBase64(
		"/note.html", { uid }
	);
	return res;
}

export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const sn: string = messageData.msg.content;
	try {
		const res: RenderResult | string = await getNowNote( userID, sn );
		if ( typeof res === 'string' ) {
			await sendMessage( res );
			return;
		}
		
		if ( res.code === "base64" ) {
			await sendMessage( { file_image: res.data } );
		} else if ( res.code === "url" ) {
			await sendMessage( { image: res.data } );
		} else {
			await sendMessage( res.data );
		}
	} catch ( error ) {
		await sendMessage( <string>error );
	}
}