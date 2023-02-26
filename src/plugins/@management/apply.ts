import { InputParameter } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";

/**
Author: Extrwave
CreateTime: 2023/2/25
 */

export async function main
( {
	  sendMessage, auth, messageData,
  }: InputParameter ): Promise<void> {
	const userId = messageData.msg.author.id;
	const guildId = messageData.msg.guild_id;
	const roles: string[] = messageData.msg.member.roles;
	
	if ( roles.includes( "4" ) ) {
		await auth.set( "system", userId, guildId, AuthLevel.GuildOwner );
		await sendMessage( "已成功申请当前频道管理权限，可在当前频道使用管理指令" );
		return;
	} else if ( roles.includes( "2" ) ) {
		await auth.set( "system", userId, guildId, AuthLevel.GuildManager );
		await sendMessage( "已成功申请当前频道管理权限，可在当前频道使用管理指令" );
		return;
	} else {
		await sendMessage( "您不是当前频道频道主或者管理员，无法申请管理权限" );
		return;
	}
}