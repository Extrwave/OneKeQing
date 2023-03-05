import { InputParameter } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { privateClass } from "#genshin/init";
import { CloudService } from "#genshin/module/private/cloud";

/**
Author: Extrwave
CreateTime: 2023/3/5
 */

export async function main( { messageData, sendMessage }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const serID: number = messageData.msg.content ? parseInt( messageData.msg.content ) : 1;
	const single: Private | string = await privateClass.getSinglePrivate( userID, serID );
	
	if ( typeof single === "string" ) {
		await sendMessage( single );
	} else {
		await sendMessage(
			await ( <CloudService>single.services[CloudService.FixedField] )
				.toggleEnableStatus()
		);
	}
}