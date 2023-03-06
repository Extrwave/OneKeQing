import { AuthLevel } from "@modules/management/auth";
import { BasicConfig, InputParameter } from "@modules/command/main";
import { getMessageType } from "@modules/message";
import { MessageScope, MessageType } from "@modules/utils/message";


export async function filterUserUsableCommand( i: InputParameter ): Promise<BasicConfig[]> {
	const type: MessageType = getMessageType( i.messageData );
	if ( type === MessageType.Unknown ) {
		return [];
	}
	const userId = i.messageData.msg.author.id;
	const guilId = i.messageData.msg.src_guild_id ? i.messageData.msg.src_guild_id : i.messageData.msg.guild_id;
	const auth: AuthLevel = await i.auth.getById( userId, guilId );
	return i.command
		.get( auth, type === MessageType.Guild
			? MessageScope.Guild : MessageScope.Private )
		.filter( el => el.display );
}