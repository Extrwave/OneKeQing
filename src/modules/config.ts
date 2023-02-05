import FileManagement from "@modules/file";
import { randomSecret } from "./utils";
import { RefreshCatch } from "@modules/management/refresh";

export default class BotSetting {
	public readonly appID: string;
	public readonly token: string;
	public readonly sandbox: boolean;
	public readonly area: string;
	public readonly master: string;
	public readonly header: string;
	public readonly atBot: boolean;
	public readonly dbPort: number;
	public readonly dbPassword: string;
	public readonly countThreshold: number;
	public readonly helpPort: number;
	public readonly helpMessageStyle: string;
	public readonly logLevel: "trace" | "debug" | "info" | "warn" |
		"error" | "fatal" | "mark" | "off";
	
	public readonly webConsole: {
		readonly enable: boolean;
		readonly adminName: string;
		readonly adminPwd: string;
		readonly consolePort: number;
		readonly tcpLoggerPort: number;
		readonly logHighWaterMark: number,
		readonly jwtSecret: string
	};
	
	static initObject = {
		tip: "前往 https://docs.ethreal.cn 查看配置详情",
		appID: "appID",
		token: "token",
		sandbox: false,
		master: "masterID",
		area: "private",
		header: "/",
		atBot: false,
		dbPort: 6379,
		dbPassword: "",
		countThreshold: 60,
		helpPort: 54919,
		helpMessageStyle: "message",
		logLevel: "debug",
		webConsole: {
			enable: false,
			adminName: "admin",
			adminPwd: "admin",
			consolePort: 9999,
			tcpLoggerPort: 54921,
			logHighWaterMark: 64,
			jwtSecret: randomSecret( 16 )
		}
	};
	
	constructor( file: FileManagement ) {
		const config: any = file.loadYAML( "setting" );
		const checkFields: Array<keyof BotSetting> = [
			"appID", "token", "dbPassword", "atBot"
		];
		
		for ( let key of checkFields ) {
			if ( config[key] === undefined ) {
				config[key] = BotSetting.initObject[key];
			}
		}
		file.writeYAML( "setting", config );
		
		this.appID = config.appID;
		this.token = config.token;
		this.sandbox = config.sandbox;
		this.master = config.master;
		this.header = config.header;
		this.dbPort = config.dbPort;
		this.dbPassword = config.dbPassword;
		this.atBot = config.atBot;
		this.helpPort = config.helpPort;
		this.countThreshold = config.countThreshold;
		this.webConsole = {
			enable: config.webConsole.enable,
			adminName: config.webConsole.adminName,
			adminPwd: config.webConsole.adminPwd,
			consolePort: config.webConsole.consolePort,
			tcpLoggerPort: config.webConsole.tcpLoggerPort,
			logHighWaterMark: config.webConsole.logHighWaterMark,
			jwtSecret: config.webConsole.jwtSecret
		};
		
		
		/* 公域Ark消息模板需要申请才可以使用 */
		const helpList: string[] = [ "message", "embed", "ark", "card" ];
		this.helpMessageStyle = helpList.includes( config.helpMessageStyle )
			? config.helpMessageStyle : "message";
		
		const areaList: string[] = [ "private", "public" ];
		this.area = areaList.includes( config.area ) ? config.area : "private";
		
		const logLevelList: string[] = [
			"trace", "debug", "info", "warn",
			"error", "fatal", "mark", "off"
		];
		this.logLevel = logLevelList.includes( config.logLevel )
			? config.logLevel : "info";
	}
}

export class OtherConfig {
	public autoChat: {
		enable: boolean;
		type: number;
		secretId: string;
		secretKey: string;
	}
	
	public alistDrive: {
		auth: string;
		baseUrl: string;
		baseDir: string;
		allDirs: string[];
	}
	
	static initObject = {
		autoChat: {
			tip1: "type参数说明：1为青云客，2为腾讯NLP（需要secret）",
			enable: false,
			type: 1,
			secretId: "xxxxx",
			secretKey: "xxxxx"
		},
		alistDrive: {
			tip: "Alist 挂载云盘作为存储，其中allDirs为具体的某些文件夹",
			auth: "xxx",
			baseUrl: "https://drive.ethreal.cn",
			baseDir: "/189Cloud",
			allDirs: [
				"/HelpTopBG",
				"/UidTopBG",
				"/CharIM"
			]
		}
	}
	
	constructor( file: FileManagement ) {
		
		const initCfg = OtherConfig.initObject;
		const path: string = file.getFilePath( "config.yml" );
		const isExist: boolean = file.isExist( path );
		if ( !isExist ) {
			file.createYAML( "config", initCfg );
		}
		
		const config: any = file.loadYAML( "config" );
		const checkFields: Array<keyof OtherConfig> = [
			"autoChat", 'alistDrive'
		];
		
		for ( let key of checkFields ) {
			if ( config[key] === undefined ) {
				config[key] = OtherConfig.initObject[key];
			}
		}
		file.writeYAML( "config", config );
		
		this.autoChat = {
			enable: config.autoChat.enable,
			type: config.autoChat.type,
			secretId: config.autoChat.secretId,
			secretKey: config.autoChat.secretKey,
		}
		
		this.alistDrive = {
			auth: config.alistDrive.auth,
			baseUrl: config.alistDrive.baseUrl,
			baseDir: config.alistDrive.baseDir,
			allDirs: config.alistDrive.allDirs
		}
	}
	
	public async refresh( config ): Promise<string> {
		try {
			this.autoChat = config.autoChat;
			this.alistDrive = config.alistDrive;
			return "config.yml 重新加载完毕";
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: "config.yml 重新加载失败，请前往控制台查看日志"
			};
		}
	}
}