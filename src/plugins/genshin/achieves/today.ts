import { InputParameter } from "@modules/command";
import { dailyClass } from "../init";
import { Private } from "#genshin/module/private/main";
import { getPrivateAccount } from "#genshin/utils/private";

export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const username: string = messageData.msg.author.username;
	const choice = <RegExpExecArray>( /(\d+)? *(\d+)?/.exec( messageData.msg.content ) );
	const week = choice[1];
	const sn = choice[2] ? choice[2] : "1";
	
	const info: Private | string = await getPrivateAccount( userID, sn );
	
	const {
		code,
		data
	} = await dailyClass.getUserDailyMaterial(
		userID,
		typeof info === 'string' ? "" : username,
		typeof info === 'string' ? undefined : info.setting.cookie,
		week ? parseInt( week ) : undefined );
	if ( code === "base64" )
		await sendMessage( { file_image: data } );
	else if ( code === "url" ) {
		await sendMessage( { image: data } );
	} else {
		await sendMessage( data );
	}
}