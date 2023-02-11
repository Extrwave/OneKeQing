import { IMessage } from "qq-guild-bot";
import { SendFunc } from "@modules/message";
import { InputParameter } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { MysQueryService } from "#genshin/module/private/mys";
import { RenderResult } from "@modules/renderer";
import { mysInfoPromise } from "#genshin/utils/promise";
import { getPrivateAccount } from "#genshin/utils/private";
import { characterID, config, renderer } from "#genshin/init";

export async function main( i: InputParameter ): Promise<void> {
	const { sendMessage, messageData } = i;
	const userID = messageData.msg.author.id;
	const idMsg = messageData.msg.content;
	
	try {
		const appointName = await mysQuery( userID, idMsg );
		await mysHandler( userID, appointName, sendMessage );
	} catch ( error ) {
		await sendMessage( <string>error );
	}
}

export async function mysQuery( userID: string, idMsg: string ) {
	const info: Private | string = await getPrivateAccount( userID, idMsg );
	if ( typeof info === "string" ) {
		throw info;
	}
	
	const { cookie, mysID } = info.setting;
	
	try {
		await mysInfoPromise( userID, mysID, cookie );
	} catch ( error ) {
		if ( error !== "gotten" ) {
			throw <string>error;
		}
	}
	
	const appointId = info.options[MysQueryService.FixedField].appoint;
	let appointName: string = "empty";
	
	if ( appointId !== "empty" ) {
		for ( const name in characterID.map ) {
			const mapId = characterID.map[name];
			if ( mapId === parseInt( appointId ) ) {
				appointName = name;
				break;
			}
		}
	}
	return appointName;
}

export async function mysHandler( userID: string, appointName: string, sendMessage: SendFunc ): Promise<IMessage | void> {
	await sendMessage( "获取成功，正在生成图片..." );
	const res: RenderResult = await renderer.asBase64(
		"/card.html", {
			userId: userID,
			style: config.cardWeaponStyle,
			profile: config.cardProfile,
			appoint: appointName
		} );
	if ( res.code === "base64" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "url" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}