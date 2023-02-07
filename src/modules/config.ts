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
	public readonly dbPort: number;
	public readonly dbPassword: string;
	public readonly countThreshold: number;
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
		dbPort: 6379,
		dbPassword: "",
		countThreshold: 60,
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
			"appID", "token", "dbPassword"
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
	public atBot: boolean;
	public atUser: boolean;
	public helpPort: number;
	public helpMessageStyle: string;
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
	}
	
	static initObject = {
		atBot: false,
		atUser: false,
		helpPort: 54919,
		helpMessageStyle: "message",
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
			baseDir: "/189Cloud"
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
			"autoChat", 'alistDrive', 'atUser',
			'atBot', 'helpMessageStyle', 'helpPort'
		];
		
		for ( let key of checkFields ) {
			if ( config[key] === undefined ) {
				config[key] = OtherConfig.initObject[key];
			}
		}
		file.writeYAML( "config", config );
		
		this.atBot = config.atBot;
		this.atUser = config.atUser;
		this.helpPort = config.helpPort;
		/* 公域Ark消息模板需要申请才可以使用 */
		const helpList: string[] = [ "message", "embed", "ark", "card" ];
		this.helpMessageStyle = helpList.includes( config.helpMessageStyle )
			? config.helpMessageStyle : "message";
		
		this.autoChat = {
			enable: config.autoChat.enable,
			type: config.autoChat.type,
			secretId: config.autoChat.secretId,
			secretKey: config.autoChat.secretKey,
		}
		
		this.alistDrive = {
			auth: config.alistDrive.auth,
			baseUrl: config.alistDrive.baseUrl,
			baseDir: config.alistDrive.baseDir
		}
	}
	
	public async refresh( config ): Promise<string> {
		try {
			this.atBot = config.atBot;
			this.atUser = config.atUser;
			this.helpPort = config.helpPort;
			this.helpMessageStyle = config.helpMessageStyle;
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