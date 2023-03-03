import bot from "ROOT"
import { getRealName, NameResult } from "../utils/name";
import { scheduleJob } from "node-schedule";
import { CalendarData, InfoResponse, isCharacterInfo, isWeaponInfo } from "../types";
import { randomInt } from "../utils/random";
import { getDailyMaterial, getInfo } from "../utils/api";
import { take } from "lodash";
import { RenderResult } from "@modules/renderer";
import { renderer } from "#genshin/init";
import { calendarPromise, mysInfoPromise } from "#genshin/utils/promise";
import user from "@web-console/backend/routes/user";
import { Cookies } from "#genshin/module/cookies";

export interface DailyMaterial {
	"Mon&Thu": string[];
	"Tue&Fri": string[];
	"Wed&Sat": string[];
}


type DailyInfo = {
	type: "character" | "weapon";
	name: string;
	rarity: number;
	extra: number[];
}

export class DailySet {
	private readonly weaponSet: Record<string, DailyInfo[]>;
	private readonly characterSet: Record<string, DailyInfo[]>;
	private readonly eventData: CalendarData[];
	
	constructor( data: InfoResponse[], events: CalendarData[], sub: Map<string, DailyInfo> ) {
		this.weaponSet = {};
		this.characterSet = {};
		this.eventData = events;
		
		for ( let d of data ) {
			const { name, rarity }: { name: string, rarity: number } = d;
			const priSubInfo = sub.get( name );
			if ( isCharacterInfo( d ) ) {
				this.add( take( d.talentMaterials, 3 ), {
					type: "character",
					name,
					rarity,
					extra: priSubInfo ? priSubInfo.extra : [ 0 ]
				} );
			} else if ( isWeaponInfo( d ) ) {
				this.add( d.ascensionMaterials[0], {
					type: "weapon",
					name,
					rarity,
					extra: priSubInfo ? priSubInfo.extra : [ 0 ]
				} );
			}
		}
	}
	
	private add( keyAsArr: string[], value: any ): void {
		const name: string = `${ value.type }Set`;
		const keys: string[] = Object.keys( this[name] );
		const key: string = JSON.stringify( keyAsArr );
		const find: string | undefined = keys.find( el => el === key );
		
		if ( !find ) {
			this[name][key] = [ value ];
		} else {
			this[name][key].push( value );
		}
	}
	
	public async save( id: string ): Promise<void> {
		await bot.redis.setHash(
			`silvery-star.daily-temp-${ id }`, {
				weapon: JSON.stringify( this.weaponSet ),
				character: JSON.stringify( this.characterSet ),
				event: JSON.stringify( this.eventData )
			} );
	}
}

async function getRenderResult( id: string, username: string, week?: number ): Promise<RenderResult> {
	return await renderer.asBase64( "/daily.html", {
		id,
		username,
		week: week ?? "today"
	} );
}

export class DailyClass {
	private detail: DailyMaterial;
	private allData: InfoResponse[];
	private eventData: CalendarData[] = [];
	
	constructor() {
		this.detail = { "Mon&Thu": [], "Tue&Fri": [], "Wed&Sat": [] };
		this.allData = [];
		getDailyMaterial().then( ( result: DailyMaterial ) => {
			this.detail = result;
		} );
		calendarPromise().then( ( result: CalendarData[] ) => {
			this.eventData = result;
		} );
		scheduleJob( "0 2 12,16 * * *", async () => {
			this.eventData = await calendarPromise();
		} );
		
		scheduleJob( "0 2 16 * * *", async () => {
			this.eventData = await calendarPromise();
		} );
		
		scheduleJob( "0 0 4 * * *", async () => {
			this.detail = await getDailyMaterial();
		} );
		
		scheduleJob( "6 5 4 * * *", async () => {
			const date: Date = new Date();
			
			/* 获取当日副本对应的角色和武器 */
			let week: number = date.getDay();
			week = date.getHours() < 4 ? week === 0 ? 6 : week - 1 : week;
			const todayInfoSet: string[] = this.getDetailSet( week );
			
			/* 获取所有角色和武器的信息 */
			await this.getAllData( todayInfoSet, true );
		} );
	}
	
	private static getDateStr( week: number ): string | null {
		if ( week === 1 || week === 4 ) {
			return "Mon&Thu";
		} else if ( week === 2 || week === 5 ) {
			return "Tue&Fri";
		} else if ( week === 3 || week === 6 ) {
			return "Wed&Sat";
		} else {
			return null;
		}
	}
	
	/* 返回每一天的材料，周天返回全部材料 */
	private getDetailSet( week: number ): string[] {
		const param = DailyClass.getDateStr( week );
		const allMaterial: string[] = [];
		if ( param ) {
			allMaterial.push( ...this.detail[param] );
		} else {
			for ( let detailKey in this.detail ) {
				allMaterial.push( ...this.detail[detailKey] );
			}
		}
		return allMaterial;
	}
	
	/* 0星期天，1-6代表星期1-6 */
	private static getWeek( initWeek?: number ): number {
		let week: number;
		if ( initWeek ) {
			week = initWeek === 7 ? 0 : initWeek;
		} else {
			const date = new Date();
			week = date.getDay();
			week = date.getHours() < 4 ? week === 0 ? 6 : week - 1 : week;
		}
		return week;
	}
	
	/* 获取订阅名称的详细信息 */
	private async getAllData( set: string[], clear: boolean ): Promise<void> {
		if ( clear ) {
			this.allData = [];
		}
		for ( let targetName of set ) {
			try {
				const data = await getInfo( targetName );
				if ( typeof data !== "string" ) {
					this.allData.push( data );
				}
			} catch ( e ) {
				bot.logger.error( `「${ targetName }」信息获取失败: ${ e }` );
			}
		}
	}
	
	/* 获取授权用户的材料需求详细信息 */
	private async getUserPrivateInfo( userID: string, cookie: string ): Promise<Map<string, DailyInfo>> {
		try {
			const mysID = parseInt( Cookies.checkMysID( cookie ) );
			await mysInfoPromise( userID, mysID, cookie );
		} catch ( error ) {
			if ( error !== "gotten" ) {
				throw <string>error;
			}
		}
		
		const uid: string = await bot.redis.getString( `silvery-star.user-querying-id-${ userID }` );
		const data: any = await bot.redis.getHash( `silvery-star.card-data-${ uid }` );
		const avatars = JSON.parse( data.avatars );
		const allData: Map<string, DailyInfo> = new Map<string, DailyInfo>();
		
		avatars.forEach( value => {
			allData.set( value.name, {
				type: 'character',
				name: value.name,
				rarity: value.rarity,
				extra: [ value.skills[0].levelCurrent, value.skills[1].levelCurrent, value.skills[2].levelCurrent ]
			} );
			allData.set( value.weapon.name, {
				type: 'weapon',
				name: value.weapon.name,
				rarity: value.weapon.rarity,
				extra: [ value.weapon.level ]
			} );
		} );
		return allData;
	}
	
	
	/* 主动调用入口 */
	public async getUserDailyMaterial( userID: string, username: string, cookie?: string, initWeek?: number ): Promise<RenderResult> {
		
		/* 获取当日材料数据 */
		const week: number = DailyClass.getWeek( initWeek );
		let todayInfoSet: string[] = this.getDetailSet( week );
		
		
		/* 根据授权信息修改详情需求 */
		let subData = cookie ? await this.getUserPrivateInfo( userID, cookie ).catch() : new Map<string, DailyInfo>();
		if ( subData.size > 0 ) {
			const names = Array.from( subData.keys() );
			todayInfoSet = todayInfoSet.filter( value => {
				return names.includes( value );
			} );
		}
		
		/* 获取所有材料信息填充至 allData */
		await this.getAllData( todayInfoSet, true );
		
		await new DailySet( this.allData, this.eventData, subData ).save( userID );
		return await getRenderResult( userID, username, initWeek === undefined ? undefined : week );
	}
}