import FileManagement from "@modules/file";
import { randomSecret } from "./utils";
import { RefreshCatch } from "@modules/management/refresh";
import { randomInt } from "crypto";

export default class BotSetting {
	public readonly appID: string;
	public readonly token: string;
	public readonly sandbox: boolean;
	public readonly area: string;
	public readonly master: string;
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
		alistDrive: {
			tip: "Alist 挂载云盘作为存储，其中allDirs为具体的某些文件夹",
			auth: "xxx",
			baseUrl: "https://drive.ethreal.cn",
			baseDir: "/189Cloud"
		}
	}
	
	constructor( file: FileManagement ) {
		
		const initCfg = OtherConfig.initObject;
		const path: string = file.getFilePath( "other.yml" );
		const isExist: boolean = file.isExist( path );
		if ( !isExist ) {
			file.createYAML( "other", initCfg );
		}
		
		const config: any = file.loadYAML( "other" );
		const checkFields: Array<keyof OtherConfig> = [
			'alistDrive', 'atUser', 'atBot'
		];
		
		for ( let key of checkFields ) {
			if ( config[key] === undefined ) {
				config[key] = OtherConfig.initObject[key];
			}
		}
		file.writeYAML( "other", config );
		
		this.atBot = config.atBot;
		this.atUser = config.atUser;
		this.helpPort = config.helpPort;
		/* 公域Ark消息模板需要申请才可以使用 */
		const helpList: string[] = [ "message", "embed", "ark", "card" ];
		this.helpMessageStyle = helpList.includes( config.helpMessageStyle )
			? config.helpMessageStyle : "message";
		
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
			this.alistDrive = config.alistDrive;
			return "other.yml 重新加载完毕";
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: "other.yml 重新加载失败，请前往控制台查看日志"
			};
		}
	}
}

/**
 * Emoji配置文件
 * */
export class ChatConfig {
	private emojiEnable: boolean;
	private chatEnable: boolean;
	private headers: string[];
	private list: string[];
	private regExp: RegExp;
	
	
	public static init = {
		tips: "ikun表情包链接",
		emojiEnable: false,
		chatEnable: false,
		headers: [ "你干嘛", "哎哟", "素质", "树枝" ],
		list: [ "https://img.ethreal.cn/i/2023/03/64081f02b7e69.png",
			"https://img.ethreal.cn/i/2023/03/64081f1c526a7.png",
			"https://img.ethreal.cn/i/2023/03/64081f97644db.png",
			"https://img.ethreal.cn/i/2023/03/64081fc016d93.png",
			"https://img.ethreal.cn/i/2023/03/640878ed4cc20.png" ]
	}
	
	constructor( file: FileManagement ) {
		const initCfg = ChatConfig.init;
		
		const path: string = file.getFilePath( "chat.yml" );
		const isExist: boolean = file.isExist( path );
		if ( !isExist ) {
			file.createYAML( "chat", initCfg );
		}
		
		const config: any = file.loadYAML( "chat" );
		const keysNum = o => Object.keys( o ).length;
		
		/* 检查 defaultConfig 是否更新 */
		if ( keysNum( config ) !== keysNum( initCfg ) ) {
			const c: any = {};
			const keys: string[] = Object.keys( initCfg );
			for ( let k of keys ) {
				c[k] = config[k] ? config[k] : initCfg[k];
			}
			file.writeYAML( "chat", c );
		}
		
		this.chatEnable = config.chatEnable;
		this.emojiEnable = config.emojiEnable;
		this.headers = config.headers;
		this.list = config.list;
		this.regExp = this.buildRegExp( config.headers );
	}
	
	public buildRegExp( headers: string[] ): RegExp {
		if ( headers.length <= 0 ) {
			headers.push( "你干嘛" );
		}
		return new RegExp( `(${ headers.join( "|" ) })`, "i" );
	}
	
	public chatOn() {
		return this.chatEnable;
	}
	
	public emojiOn() {
		return this.emojiEnable;
	}
	
	public get(): string {
		return this.list[randomInt( 0, this.list.length )];
	}
	
	public match( content: string ): boolean {
		return this.regExp.test( content );
	}
	
	public async refresh( config ): Promise<string> {
		try {
			this.emojiEnable = config.emojiEnable;
			this.chatEnable = config.chatEnable;
			this.headers = config.headers;
			this.list = config.list;
			this.regExp = this.buildRegExp( this.headers );
			return "chat 重新加载完毕";
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: "chat 重新加载失败，请前往控制台查看日志"
			};
		}
	}
}