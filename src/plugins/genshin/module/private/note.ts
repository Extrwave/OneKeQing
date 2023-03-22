import bot from "ROOT";
import { Order } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";
import { Expedition, Note } from "#genshin/types";
import { Private, Service, UserInfo } from "./main";
import { Job, scheduleJob } from "node-schedule";
import { dailyNotePromise } from "#genshin/utils/promise";
import { sendMessage } from "#genshin/utils/private";
import { EmbedMsg } from "@modules/utils/embed";
import { config } from "#genshin/init";

interface PushEvent {
	type: "resin" | "homeCoin" | "transformer" | "expedition";
	job: Job;
}

interface PushInfo {
	/* 后续按需添加，Promise内如何获取this对象的属性？*/
	currentResin: number,
	detail: string[]
}


export class NoteService implements Service {
	public readonly parent: Private;
	public enable: boolean;
	
	private timePoint: number[];
	private events: PushEvent[] = [];
	private globalEvent?: Job;
	private globalData: Note | string = "[ NoteService ] - ";
	private readonly feedbackCatch: () => Promise<void>;
	
	public FixedField = <const>"note";
	static FixedField = <const>"note";
	
	constructor( p: Private ) {
		const options: Record<string, any> =
			p.options[NoteService.FixedField] || {};
		
		this.parent = p;
		this.timePoint = options.timePoint || [ 120, 155 ];
		this.enable = options.enable === undefined
			? true : options.enable;
		
		this.feedbackCatch = async () => {
			await sendMessage( <string>this.globalData, this.parent.setting.userID );
		};
		
		if ( this.enable ) {
			this.scheduleJobOn();
		}
	}
	
	public getOptions(): any {
		return {
			timePoint: this.timePoint,
			enable: config.noteNotify ? this.enable : false
		};
	}
	
	public async initTest(): Promise<string> {
		await this.getData();
		if ( typeof this.globalData === "string" ) {
			return "实时便笺功能开启失败：\n" +
				this.globalData + "\n" +
				"可能是因为米游社数据未公开或未开启实时便笺";
		} else {
			const SET_TIME = <Order>bot.command.getSingle( "silvery-star-note-set-time", AuthLevel.Master );
			const TOGGLE_NOTE = <Order>bot.command.getSingle( "silvery-star-private-toggle-note", AuthLevel.Master );
			
			const appendSetTime = SET_TIME ? `[ ${ SET_TIME.getCNHeader() }+账户序号+树脂量 ] 调整推送条件\n` : "";
			const appendToggleNote = TOGGLE_NOTE ? `[ ${ TOGGLE_NOTE.getCNHeader() }+账户序号 ] 关闭上述推送\n` : "";
			
			return config.noteNotify ?
				"\n实时便笺功能已开启：\n" +
				"树脂数量达到 120 和 155 时会私聊推送\n" +
				appendSetTime +
				"宝钱、质变仪、派遣提醒功能已开启\n" +
				appendToggleNote :
				"\n实时便笺功能暂未开放";
		}
	}
	
	public async toggleEnableStatus( status?: boolean, message: boolean = true ): Promise<string> {
		this.enable = status === undefined ? !this.enable : status;
		if ( !config.noteNotify ) {
			this.enable = false;
			await this.parent.refreshDBContent( NoteService.FixedField );
			return "实时便笺功能暂未开放";
		}
		if ( this.enable ) {
			this.scheduleJobOn();
		} else {
			this.scheduleJobOff();
			this.clearEvents();
		}
		/* 回传进行数据库更新 */
		await this.parent.refreshDBContent( NoteService.FixedField );
		return `实时便筏提醒功能已${ this.enable ? "开启" : "关闭" }`;
	}
	
	private scheduleJobOn(): void {
		this.refreshPushEvent().catch( this.feedbackCatch );
		this.globalEvent = scheduleJob( "0 5 */3 * * *", () => {
			this.refreshPushEvent().catch( this.feedbackCatch );
		} );
	}
	
	private scheduleJobOff(): void {
		if ( this.globalEvent !== undefined ) {
			this.globalEvent.cancel();
		}
	}
	
	public async modifyTimePoint( time: number[] ): Promise<void> {
		/* 过滤超过 160 的树脂量 */
		this.timePoint = time.filter( el => el <= 160 );
		this.refreshPushEvent().catch( this.feedbackCatch );
		/* 回传进行数据库更新 */
		await this.parent.refreshDBContent( NoteService.FixedField );
	}
	
	public async toJSON(): Promise<string> {
		await this.getData();
		if ( typeof this.globalData === "string" ) {
			throw new Error( this.globalData );
		}
		return JSON.stringify( {
			...<Note>this.globalData,
			uid: this.parent.setting.uid
		} );
	}
	
	private async getData(): Promise<void> {
		try {
			const setting: UserInfo = this.parent.setting;
			this.globalData = <Note>await dailyNotePromise(
				setting.uid,
				setting.server,
				setting.cookie
			);
		} catch ( error ) {
			this.globalData = <string>error;
			if ( /Cookie/i.test( <string>error ) ) {
				await this.toggleEnableStatus( false, false );
				this.globalData += "\n自动提醒已停止，请更新 Cookie 后重新开启"
			}
		}
	}
	
	private clearEvents(): void {
		for ( let e of this.events ) {
			e.job.cancel();
		}
		this.events = [];
	}
	
	private async refreshPushInfo(): Promise<PushInfo> {
		
		await this.getData();
		if ( typeof this.globalData === "string" ) {
			return Promise.reject( this.globalData );
		}
		
		function getHomeCoinValue( globalData: Note ) {
			if ( globalData.maxHomeCoin === 0 ) return "尚未开启";
			return `${ globalData.currentHomeCoin }/${ globalData.maxHomeCoin }`;
		}
		
		function getTransformerValue( globalData: Note ) {
			const { recoveryTime, obtained } = globalData.transformer;
			if ( !obtained ) return "尚未获得";
			let { day, hour, minute, second, reached } = recoveryTime;
			if ( reached ) return "已就绪";
			const sday = day ? day + "天" : "";
			const shour = hour ? hour + "小时" : "";
			const sminute = minute ? minute + "分" : "";
			const ssecond = second ? second + "秒" : "";
			return `${ sday + shour + sminute + ssecond }`;
		}
		
		const info: PushInfo = {
			currentResin: this.globalData.currentResin,
			detail: []
		};
		info.detail.push( `原粹树脂恢复：${ this.globalData.currentResin }/${ this.globalData.maxResin }` );
		info.detail.push( `每日委托任务：${ this.globalData.finishedTaskNum }/${ this.globalData.totalTaskNum }` );
		info.detail.push( `每日委托奖励：${ this.globalData.isExtraTaskRewardReceived ? "已" : "未" }领取` );
		info.detail.push( `探索派遣数量：${ this.globalData.currentExpeditionNum }/${ this.globalData.maxExpeditionNum }` );
		info.detail.push( `周本减半次数：${ this.globalData.remainResinDiscountNum }/${ this.globalData.resinDiscountNumLimit }` );
		info.detail.push( `参量质变冷却：${ getTransformerValue( this.globalData ) }` );
		info.detail.push( `洞天宝钱数量：${ getHomeCoinValue( this.globalData ) }` );
		return info;
	}
	
	private async refreshPushEvent(): Promise<void> {
		const now: number = new Date().getTime();
		
		await this.getData();
		if ( typeof this.globalData === "string" ) {
			return Promise.reject( this.globalData );
		}
		
		/* 清空当前事件 */
		this.clearEvents();
		
		/* 树脂提醒 */
		for ( let t of this.timePoint ) {
			/* 当前树脂量超过设定量则不处理 */
			if ( this.globalData.currentResin >= t ) {
				continue;
			}
			
			const recovery: number = parseInt( this.globalData.resinRecoveryTime );
			const remaining: number = recovery - ( this.globalData.maxResin - t ) * 8 * 60;
			const time = new Date( now + remaining * 1000 );
			
			const job: Job = scheduleJob( time, async () => {
				const pushInfo = await this.refreshPushInfo().catch( this.feedbackCatch );
				/* 树脂量一小时内已使用，当前树脂与预期差距大于 20 时不推送 */
				if ( pushInfo && Math.abs( pushInfo.currentResin - t ) <= 20 ) {
					const embedMsg = new EmbedMsg(
						`树脂量已经到达 ${ t } 啦 ~`,
						"",
						`树脂量已经到达 ${ t } 啦 ~`,
						"https://adachi-bot.oss-cn-beijing.aliyuncs.com/images/common/Item_Fragile_Resin.png",
						`原神UID账号：${ this.parent.setting.uid }`,
						...pushInfo.detail );
					await sendMessage( { embed: embedMsg }, this.parent.setting.userID );
				}
			} );
			this.events.push( { type: "resin", job } );
		}
		
		/* 宝钱提醒 */
		if ( this.globalData.maxHomeCoin !== 0 && this.globalData.currentHomeCoin < this.globalData.maxHomeCoin ) {
			const recovery: number = parseInt( this.globalData.homeCoinRecoveryTime );
			const time = new Date( now + recovery * 1000 );
			
			const job: Job = scheduleJob( time, async () => {
				const pushInfo = await this.refreshPushInfo().catch( this.feedbackCatch );
				if ( pushInfo ) {
					const embedMsg = new EmbedMsg(
						`洞天宝钱已经满啦 ~`,
						"",
						`洞天宝钱已经满啦 ~`,
						"https://adachi-bot.oss-cn-beijing.aliyuncs.com/images/common/Item_Serenitea_Pot.png",
						`原神UID账号：${ this.parent.setting.uid }`,
						...pushInfo.detail );
					await sendMessage( { embed: embedMsg }, this.parent.setting.userID );
				}
			} );
			this.events.push( { type: "homeCoin", job } );
		}
		
		/* 参变仪提醒 */
		if ( this.globalData.transformer.obtained ) {
			const { day, hour, minute, second, reached } = this.globalData.transformer.recoveryTime;
			if ( !reached ) {
				const recovery = ( ( day * 24 + hour ) * 60 + minute ) * 60 + second;
				const time = new Date( now + recovery * 1000 );
				
				const job: Job = scheduleJob( time, async () => {
					const pushInfo = await this.refreshPushInfo().catch( this.feedbackCatch );
					if ( pushInfo ) {
						const embedMsg = new EmbedMsg(
							`参量质变仪已就绪啦 ~`,
							"",
							`参量质变仪已就绪啦 ~`,
							"https://adachi-bot.oss-cn-beijing.aliyuncs.com/images/common/Item_Parametric_Transformer.png",
							`原神UID账号：${ this.parent.setting.uid }`,
							...pushInfo.detail );
						await sendMessage( { embed: embedMsg }, this.parent.setting.userID );
					}
				} );
				this.events.push( { type: "homeCoin", job } );
			}
		}
		
		/* 派遣提醒 */
		const expeditions: Expedition[] = this.globalData.expeditions
			.filter( el => el.status === "Ongoing" )
			.sort( ( x, y ) => {
				return parseInt( x.remainedTime ) - parseInt( y.remainedTime );
			} );
		if ( expeditions.length === 0 ) {
			return Promise.resolve();
		}
		
		const compressed: any = [];
		let num: number = 0;
		
		compressed.push( { num: 1, ...expeditions.shift() } );
		for ( let e of expeditions ) {
			if ( parseInt( e.remainedTime ) - parseInt( compressed[num].remainedTime ) <= 30 ) {
				compressed[num].num++;
				compressed[num].remainedTime = e.remainedTime;
			} else {
				num++;
				compressed.push( { num: 1, ...e } );
			}
		}
		
		for ( let c of compressed ) {
			const time = new Date( now + parseInt( c.remainedTime ) * 1000 );
			const job: Job = scheduleJob( time, async () => {
				const pushInfo = await this.refreshPushInfo().catch( this.feedbackCatch );
				if ( pushInfo ) {
					const embedMsg = new EmbedMsg(
						`已有 ${ c.num } 个探索派遣任务完成啦 ~`,
						"",
						`已有 ${ c.num } 个探索派遣任务完成 ~`,
						`${ typeof this.globalData === 'string' ? "" : this.globalData.expeditions[0].avatarSideIcon }`,
						`原神UID账号：${ this.parent.setting.uid }`,
						...pushInfo.detail );
					await sendMessage( { embed: embedMsg }, this.parent.setting.userID );
				}
			} );
			this.events.push( { type: "expedition", job } );
		}
	}
}