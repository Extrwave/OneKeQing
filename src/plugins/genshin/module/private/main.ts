import bot from "ROOT";
import { AuthLevel } from "@modules/management/auth";
import { Order } from "@modules/command";
import { NoteService } from "./note";
import { MysQueryService } from "./mys";
import { AbyQueryService } from "./abyss";
import { CharQueryService } from "#genshin/module/private/char";
import { SignInService } from "./sign";
import { Md5 } from "md5-typescript";
import { pull } from "lodash";
import { scheduleJob } from "node-schedule";
import { getRegion } from "#genshin/utils/region";
import { refreshTokenBySToken } from "#genshin/utils/cookie";
import { CloudService } from "#genshin/module/private/cloud";

export interface Service {
	parent: Private;
	FixedField: string;
	getOptions(): any;
	initTest(): Promise<string>;
	loadedHook?(): Promise<any>;
}

/* 获取元组第一位 */
type TupleHead<T extends any[]> = T[0];
/* 弹出元组第一位 */
type TupleShift<T extends Service[]> = T extends [ infer L, ...infer R ] ? R : never;
/* 合并交叉类型 */
type Merge<T> = { [P in keyof T]: T[P] };
/* 向接口中添加新字段 */
type ObjectExpand<T, U extends Service> = Merge<{ [P in keyof T]: T[P] } &
	{ [P in U["FixedField"]]: U }>;
/* 定义扩展授权服务的基本接口 */
type BasicExpand = Record<string, Service>;
/* 递归定义扩展授权服务类型 */
type ExpandedService<T extends any[], E extends BasicExpand = {}> = T extends []
	? E
	: ExpandedService<TupleShift<T>, ObjectExpand<E, TupleHead<T>>>;
/* 定义扩展私有服务 */
type ServiceTuple = [
	NoteService, SignInService, MysQueryService,
	AbyQueryService, CharQueryService, CloudService
];
/* 获取扩展授权服务类型 */
type Services = ExpandedService<ServiceTuple>;

export class UserInfo {
	public readonly uid: string;
	public readonly server: string;
	public readonly userID: string;
	public readonly mysID: number;
	public cookie: string;
	public stoken: string;
	public ytoken: string;
	
	constructor(
		uid: string, cookie: string,
		userID: string, mysID: number,
		stoken: string = "", ytoken: string = ""
	) {
		this.uid = uid;
		this.cookie = cookie;
		this.stoken = stoken;
		this.ytoken = ytoken;
		this.userID = userID;
		this.mysID = mysID;
		this.server = getRegion( uid[0] );
	}
}

const dbPrefix: string = "silvery-star.private-";

/*
* 依据 https://github.com/SilveryStar/Adachi-BOT/issues/70#issuecomment-946331850 重新设计
* */
export class Private {
	public readonly setting: UserInfo;
	public readonly services: Services;
	public readonly dbKey: string;
	
	public id: number;
	public options: Record<string, any>;
	
	static parse( data: Record<string, any> ): Private {
		if ( !data.setting.mysID ) {
			const reg = new RegExp( /.*?tuid=([0-9]+).*?/g );
			const execRes = <RegExpExecArray>reg.exec( data.setting.cookie );
			data.setting.mysID = parseInt( execRes[1] );
		}
		return new Private(
			data.setting.uid, data.setting.cookie,
			data.setting.userID, data.setting.mysID,
			data.id, data.options, data.setting.stoken,
			data.setting.ytoken
		);
	}
	
	constructor(
		uid: string, cookie: string,
		userID: string, mysID: number,
		id: number, options?: Record<string, any>,
		stoken: string = "", ytoken: string = ""
	) {
		this.options = options || {};
		this.setting = new UserInfo( uid, cookie, userID, mysID, stoken, ytoken );
		
		const md5: string = Md5.init( `${ userID }-${ uid }` );
		this.id = id;
		this.dbKey = dbPrefix + md5;
		this.services = {
			[NoteService.FixedField]: new NoteService( this ),
			[SignInService.FixedField]: new SignInService( this ),
			[MysQueryService.FixedField]: new MysQueryService( this ),
			[AbyQueryService.FixedField]: new AbyQueryService( this ),
			[CharQueryService.FixedField]: new CharQueryService( this ),
			[CloudService.FixedField]: new CloudService( this )
		};
		this.options = this.globalOptions();
	}
	
	private globalOptions(): any {
		const options = {};
		for ( let k of Object.keys( this.services ) ) {
			options[k] = this.services[k].getOptions();
		}
		return options;
	}
	
	public stringify(): string {
		return JSON.stringify( {
			id: this.id,
			setting: this.setting,
			options: this.options
		} );
	}
	
	public async refreshDBContent( field?: string ): Promise<void> {
		if ( field ) {
			this.options[field] = this.services[field].getOptions();
		}
		await bot.redis.setString( this.dbKey, this.stringify() );
	}
	
	public async replaceCookie( cookie: string, stoken: string = "" ): Promise<void> {
		stoken ? this.setting.stoken = stoken : "";
		this.setting.cookie = cookie;
		await bot.redis.setString( this.dbKey, this.stringify() );
	}
	
	public async setCloudGameToken( ytoken: string ): Promise<void> {
		this.setting.ytoken = ytoken;
		await bot.redis.setString( this.dbKey, this.stringify() );
	}
	
	public async cancelCloudGameToken(): Promise<void> {
		this.setting.ytoken = "";
		await bot.redis.setString( this.dbKey, this.stringify() );
	}
	
	public updateID( id: number ): void {
		this.id = id;
		this.refreshDBContent();
	}
}

export class PrivateClass {
	private readonly list: Private[];
	
	constructor() {
		this.list = [];
		const tempIDs: Record<string, number> = {};
		
		bot.redis.getKeysByPrefix( dbPrefix ).then( async ( keys: string[] ) => {
			for ( let k of keys ) {
				const data = await bot.redis.getString( k );
				if ( !data ) {
					continue;
				}
				const obj: Record<string, any> = JSON.parse( data );
				if ( !obj.id ) {
					const id: string = obj.setting.userID;
					tempIDs[id] = tempIDs[id] ? tempIDs[id] + 1 : 1;
					obj.id = tempIDs[id];
					await bot.redis.setString( k, JSON.stringify( obj ) );
				}
				const account = Private.parse( obj );
				this.list.push( account );
				
				for ( let s of <Service[]>Object.values( account.services ) ) {
					if ( s.loadedHook ) {
						await s.loadedHook();
					}
				}
			}
		} );
	}
	
	public getUserIDList(): string[] {
		const userIdList = this.list.map( el => el.setting.userID );
		return Array.from( new Set( userIdList ) );
	}
	
	public getUserPrivateList( userID?: string ): Private[] {
		if ( !userID ) {
			return this.list;
		}
		return this.list
			.filter( el => el.setting.userID === userID )
			.sort( ( x, y ) => x.id - y.id );
	}
	
	public async getSinglePrivate( userID: string, privateID: number = 1 ): Promise<Private | string> {
		const list: Private[] = this.getUserPrivateList( userID );
		if ( privateID > list.length || privateID === 0 ) {
			const PRIVATE_LIST = <Order>bot.command.getSingle(
				"silvery-star-private-list", AuthLevel.Master
			);
			return `无效的序号，请使用 [ ${ PRIVATE_LIST.getCNHeader() } ] 检查`;
		} else {
			return list[privateID - 1];
		}
	}
	
	public getUserInfoList( userID: string ): UserInfo[] {
		return this.getUserPrivateList( userID ).map( el => el.setting );
	}
	
	public async addPrivate( uid: string, cookie: string, userID: string, stoken: string = "" ): Promise<string> {
		let isRefresh = false;
		const list: Private[] = this.getUserPrivateList( userID );
		const PRIVATE_UPGRADE = <Order>bot.command.getSingle( "silvery-star-private-replace", AuthLevel.Master );
		//包涵更新Cookie情况，减少用户的疑问
		list.forEach( value => {
			if ( value.setting.uid === uid ) {
				isRefresh = true;
				value.replaceCookie( cookie );
			}
		} );
		if ( isRefresh ) {
			return `UID${ uid } 的授权服务已经更新\n` + `下次可使用 [ ${ PRIVATE_UPGRADE.getCNHeader() } cookie ] 直接更新`;
		}
		
		const reg = new RegExp( /.*?tuid=([0-9]+).*?/g );
		const execRes = <RegExpExecArray>reg.exec( cookie );
		const mysID: number = parseInt( execRes[1] );
		
		const newPrivate = new Private( uid, cookie, userID, mysID, list.length + 1, undefined, stoken );
		this.list.push( newPrivate );
		await bot.redis.setString( newPrivate.dbKey, newPrivate.stringify() );
		
		const values: Service[] = Object.values( newPrivate.services );
		const contents: string[] = await Promise.all( values.map( async el => await el.initTest() ) );
		const msg = `授权服务开启成功，UID: ${ uid }` + [ "", ...contents ].join( "\n" ) +
			`\n\n记得点击BOT头像开放推送限制\n不然每天能发送三条消息...`;
		return msg;
	}
	
	public async delPrivate( p: Private ): Promise<string> {
		Object.values( p.services ).forEach( ( service ) => {
			if ( 'toggleEnableStatus' in service ) {
				service.toggleEnableStatus( false, false );
			}
		} )
		pull( this.list, p );
		await bot.redis.deleteKey( p.dbKey );
		return p.setting.uid;
	}
	
	/* 移除指定用户的某个授权服务 */
	public async delSinglePrivate( userID: string, privateID: number ): Promise<string> {
		const single: Private | string = await this.getSinglePrivate( userID, privateID );
		if ( typeof single === "string" ) {
			return single;
		} else {
			return await this.delPrivate( single );
		}
	}
	
	/* 批量移除指定用户的授权服务 */
	public async delBatchPrivate( userID: string ): Promise<string> {
		const privateList: Private[] = this.getUserPrivateList( userID );
		
		for ( const batch of privateList ) {
			await this.delPrivate( batch );
		}
		
		return `用户${ userID }的授权服务已全部移除`;
	}
	
	/* 创建刷新Cookie_Token任务 */
	public createRefreshCookieJob() {
		/* 每隔五天，执行一次 */
		scheduleJob( "0 3 4 */5 * *", async () => {
			for ( const pri of this.list ) {
				try {
					const { cookie } = await refreshTokenBySToken( pri );
					await pri.replaceCookie( cookie );
				} catch ( error ) {
				}
			}
		} );
	}
	
}