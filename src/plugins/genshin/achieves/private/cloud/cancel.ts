import bot from "ROOT";
import { InputParameter, Order } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";
import { Private, UserInfo } from "#genshin/module/private/main";
import { privateClass } from "#genshin/init";
import { CloudService } from "#genshin/module/private/cloud";

/**
Author: Extrwave
CreateTime: 2023/3/5
 */


async function cancelCloud( userID: string, id: number ): Promise<string> {
	const single = await privateClass.getSinglePrivate( userID, id );
	if ( typeof single === 'string' ) {
		return single;
	}
	await single.cancelCloudGameToken();
	await single.services[CloudService.FixedField].toggleEnableStatus();
	return `[ UID${ single.setting.uid } ] 云原神授权已取消`;
}

export async function main(
	{ sendMessage, messageData }: InputParameter
): Promise<void> {
	const order = messageData.msg.content ? messageData.msg.content : "1";
	const id: number = parseInt( order );
	const userID: string = messageData.msg.author.id;
	const msg: string = await cancelCloud( userID, id );
	await sendMessage( msg );
}