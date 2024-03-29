import * as cmd from "./command";
import { BasicConfig } from "./command";
import { BOT } from "@modules/bot";

declare function require( moduleName: string ): any;

export type SubInfo = {
	name: string;
	users: string[];
};

export type PluginSubSetting = {
	subs: ( bot: BOT ) => Promise<SubInfo[]>;
	reSub: ( userId: string, bot: BOT ) => Promise<void>;
}

export interface PluginSetting {
	pluginEName: string;
	cfgList: cmd.ConfigType[];
	redisKeys?: Object;
	pluginCName?: string;
}

export const PluginReSubs: Record<string, PluginSubSetting> = {};

export const PluginRawConfigs: Record<string, cmd.ConfigType[]> = {};

export const PluginRedisKeys: Record<string, Object> = {};

export const PluginCNames: Record<string, string> = {};

export default class Plugin {
	public static async load( bot: BOT ): Promise<BasicConfig[]> {
		const registerCmd: BasicConfig[] = [];
		const plugins: string[] = bot.file.getDirFiles( "", "plugin" );
		
		/* 从 plugins 文件夹从导入 init.ts 进行插件初始化 */
		for ( let plugin of plugins ) {
			const path: string = bot.file.getFilePath( `${ plugin }/init`, "plugin" );
			const { init, subInfo } = require( path );
			try {
				const { pluginEName, cfgList, redisKeys, pluginCName }: PluginSetting = await init( bot );
				if ( subInfo ) {
					const { reSub, subs }: PluginSubSetting = await subInfo( bot );
					PluginReSubs[pluginEName] = { reSub, subs };
				}
				const commands = Plugin.parse( bot, cfgList, pluginEName );
				PluginRawConfigs[pluginEName] = cfgList;
				PluginRedisKeys[pluginEName] = redisKeys ? redisKeys : "";
				PluginCNames[pluginEName] = pluginCName ? pluginCName : pluginEName;
				registerCmd.push( ...commands );
				bot.logger.debug( `[ ${ pluginEName } ] 插件加载完成` );
			} catch ( error ) {
				bot.logger.error( `插件加载异常: ${ <string>error }` );
			}
		}
		
		return registerCmd;
	}
	
	public static parse(
		bot: BOT,
		cfgList: cmd.ConfigType[],
		pluginName: string
	): cmd.BasicConfig[] {
		const commands: cmd.BasicConfig[] = [];
		const data: Record<string, any> = bot.file.loadYAML( "commands" );
		
		/* 此处删除所有向后兼容代码 */
		cfgList.forEach( config => {
			/* 允许 main 传入函数 */
			if ( config.main instanceof Function ) {
				config.run = config.main;
			} else {
				const main: string = config.main || "index";
				const path: string = bot.file.getFilePath(
					pluginName + "/" + main,
					"plugin"
				);
				config.run = require( path ).main;
			}
			
			const key: string = config.cmdKey;
			const loaded = data[key];
			if ( loaded && !loaded.enable ) {
				return;
			}
			
			/* 读取 commands.yml 配置，创建指令实例  */
			try {
				let command: cmd.BasicConfig;
				switch ( config.type ) {
					case "order":
						if ( loaded ) cmd.Order.read( config, loaded );
						command = new cmd.Order( config, pluginName );
						break;
					case "switch":
						if ( loaded ) cmd.Switch.read( config, loaded );
						command = new cmd.Switch( config, pluginName );
						break;
				}
				data[key] = command.write();
				commands.push( command );
			} catch ( error ) {
				bot.logger.error( <string>error );
			}
		} );
		
		bot.file.writeYAML( "commands", data );
		return commands;
	}
}