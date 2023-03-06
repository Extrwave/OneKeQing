import BotSetting from "@modules/config";
import { Message } from "@modules/utils/message";
import { IOpenAPI } from "qq-guild-bot";
import { getMemberInfo } from "@modules/utils/account";

/**
 * 新版权限管理设计
 * @Banned 频道封禁用户
 * @User 频道普通用户
 * @GuildManager 频道管理员
 * @GuildOwner 频道主
 * @Master BOT拥有者
 */
export enum AuthLevel {
	Banned,
	User,
	GuildManager,
	GuildOwner,
	Master
}

export default class Authorization {
	private readonly master: string;
	private readonly client: IOpenAPI;
	
	constructor( config: BotSetting, client: IOpenAPI ) {
		this.master = config.master;
		this.client = client;
	}
	
	private get( roles: string[], userId: string ): AuthLevel {
		switch ( true ) {
			case userId === this.master:
				return AuthLevel.Master;
			case roles.includes( "4" ):
				return AuthLevel.GuildOwner;
			case roles.includes( "2" ):
				return AuthLevel.GuildManager;
			default:
				return AuthLevel.User;
		}
	}
	
	public getByMessage( messageData: Message ): AuthLevel {
		const roles: string[] = messageData.msg.member.roles;
		return this.get( roles, messageData.msg.author.id );
	}
	
	public async getById( userId: string, guildId: string ) {
		try {
			const { account } = await getMemberInfo( userId, guildId );
			const roles: string[] = account.roles;
			return this.get( roles, userId );
		} catch ( error ) {
			return AuthLevel.User;
		}
	}
}