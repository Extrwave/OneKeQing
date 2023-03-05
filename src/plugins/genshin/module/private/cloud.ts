/**
Author: Extrwave
CreateTime: 2023/3/5
 */
import bot from "ROOT";
import { Order } from "@modules/command";
import { Private, Service } from "./main";
import { scheduleJob, Job } from "node-schedule";
import { sendMessage } from "#genshin/utils/private";
import { randomInt } from "#genshin/utils/random";
import { EmbedMsg } from "@modules/utils/embed";
import { cloudGameSignPromise } from "#genshin/utils/promise";

export class CloudService implements Service {
	public readonly parent: Private;
	public enable: boolean;
	private cloudJob?: Job;
	
	public FixedField = <const>"cloud";
	static FixedField = <const>"cloud";
	
	constructor( p: Private ) {
		const options: Record<string, any> =
			p.options[CloudService.FixedField] || {};
		
		this.parent = p;
		this.enable = options.enable === undefined
			? false : options.enable;
	}
	
	public async loadedHook(): Promise<void> {
		if ( this.enable ) {
			const delay: number = randomInt( 0, 99 );
			/* 启动时候签到一小时内进行 */
			setTimeout( async () => {
				this.setScheduleJob();
			}, delay * 100 );
		}
	}
	
	public getOptions(): any {
		return { enable: this.enable };
	}
	
	public async initTest(): Promise<string> {
		const CLOUD_SIGN = <Order>bot.command.getSingle( "extr-wave-cloud-game-enable" );
		const content = await this.toggleEnableStatus( true );
		return `${ content }\n[ ${ CLOUD_SIGN.getCNHeader() } ] 开启云原神签到功能`;
	}
	
	public async toggleEnableStatus( status?: boolean ): Promise<string> {
		this.enable = status === undefined ? !this.enable : status;
		
		if ( !this.parent.setting.ytoken ) {
			this.enable = false;
			await this.parent.refreshDBContent( CloudService.FixedField );
			return "云原神签到服务未授权";
		}
		
		if ( this.enable ) {
			this.setScheduleJob();
			this.cloudSign( false ).catch();
		} else {
			this.cancelScheduleJob();
		}
		/* 回传进行数据库更新 */
		await this.parent.refreshDBContent( CloudService.FixedField );
		return `云原神签到功能已${ this.enable ? "开启" : "关闭" }`;
	}
	
	public async cloudSign( reply: boolean = false ): Promise<void> {
		const { uid, ytoken } = this.parent.setting;
		try {
			const result = await cloudGameSignPromise( uid, ytoken );
			const embedMsg = new EmbedMsg(
				`今日云原神签到成功`,
				"",
				`今日云原神签到成功`,
				"https://webstatic.mihoyo.com/upload/op-public/2021/10/09/def1f2abcfc2af0bbe2e5900a60a5ee1_5699547505742166353.png",
				`原神账号：${ uid }`,
				`畅玩卡状态：${ result.play_card.short_msg }`,
				`当前米云币数量：${ result.coin.coin_num }`,
				`今日获得分钟数：15`,
				`当前剩余免费时间：${ result.free_time.free_time } / ${ result.free_time.free_time_limit }`,
				`当前剩余总分钟数：${ result.total_time } ` );
			reply ? await sendMessage( { embed: embedMsg }, this.parent.setting.userID ) : "";
		} catch ( error ) {
			if ( /防沉迷/.test( <string>error ) ) {
				await this.toggleEnableStatus( false );
				return await sendMessage( error + "\n云原神签到已关闭，请更新 Token 后重新开启", this.parent.setting.userID );
			}
			bot.logger.error( error );
			await sendMessage( <string>error, this.parent.setting.userID );
		}
	}
	
	private setScheduleJob(): void {
		this.cloudJob = scheduleJob( "0 6 7 * * *", () => {
			/* 每日签到一小时内内随机进行 */
			const sec: number = randomInt( 0, 360 );
			const time = new Date().setSeconds( sec * 10 );
			const job: Job = scheduleJob( time, async () => {
				await this.cloudSign( true );
				job.cancel();
			} );
		} );
	}
	
	private cancelScheduleJob(): void {
		if ( this.cloudJob !== undefined ) {
			this.cloudJob.cancel();
		}
	}
}