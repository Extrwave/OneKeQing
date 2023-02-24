import bot from "ROOT";
import { Order } from "@modules/command";
import { Private, Service } from "./main";
import { Award, SignInInfo } from "#genshin/types";
import { scheduleJob, Job } from "node-schedule";
import { sendMessage } from "#genshin/utils/private";
import { randomInt, randomSleep } from "#genshin/utils/random";
import { EmbedMsg } from "@modules/utils/embed";
import {
	mihoyoBBSGetMybPromise,
	mihoyoBBSTaskPromise,
	signInInfoPromise,
	signInResultPromise,
	SinInAwardPromise
} from "#genshin/utils/promise";

scheduleJob( "0 5 0 * * *", async () => {
	await SinInAwardPromise();
} );

export class SignInService implements Service {
	public readonly parent: Private;
	public enable: boolean;
	private gameJob?: Job;
	private bbsJob?: Job;
	
	public FixedField = <const>"sign";
	static FixedField = <const>"sign";
	
	constructor( p: Private ) {
		const options: Record<string, any> =
			p.options[SignInService.FixedField] || {};
		
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
		const TOGGLE_SIGN = <Order>bot.command.getSingle( "silvery-star-private-toggle-sign" );
		const content = await this.toggleEnableStatus( true );
		return `${ content }\n「${ TOGGLE_SIGN.getHeaders()[0] }+序号」开关签到功能`;
	}
	
	public async toggleEnableStatus( status?: boolean ): Promise<string> {
		this.enable = status === undefined ? !this.enable : status;
		if ( this.enable ) {
			this.setScheduleJob();
			this.gameSign( true ).catch();
			this.bbsSign( true ).catch();
		} else {
			this.cancelScheduleJob();
		}
		/* 回传进行数据库更新 */
		await this.parent.refreshDBContent( SignInService.FixedField );
		return `米游社签到功能已${ this.enable ? "开启" : "关闭" }`;
	}
	
	public async gameSign( reply: boolean = false ): Promise<void> {
		const { uid, server, cookie } = this.parent.setting;
		let resultMsg: EmbedMsg | string;
		try {
			const info = <SignInInfo>( await signInInfoPromise( uid, server, cookie ) );
			let awards;
			//不能让奖励获取问题，影响到签到执行
			awards = await bot.redis.getString( `adachi.genshin-sign-in-award` );
			awards = awards ? JSON.parse( awards ) : await SinInAwardPromise();
			if ( !info.isSign ) {
				await signInResultPromise( uid, server, cookie );
				const award: Award = awards[info.totalSignDay];
				resultMsg = new EmbedMsg(
					`今日米游社原神签到成功`,
					"",
					`今日米游社原神签到成功`,
					award.icon,
					`原神账号：${ uid }`,
					`今日奖励：${ award.name } × ${ award.cnt }`,
					`本月签到：${ info.totalSignDay + 1 }天`,
					`本月漏签：${ info.signCntMissed }天`,
					`期待明天与你再次相见` );
			} else {
				const award: Award = awards[info.totalSignDay - 1];
				resultMsg = new EmbedMsg(
					`今日米游社原神已签到`,
					"",
					`今日米游社原神已签到`,
					award.icon,
					`原神账号：${ uid }`,
					`今日奖励：${ award.name } × ${ award.cnt }`,
					`本月签到：${ info.totalSignDay }天`,
					`本月漏签：${ info.signCntMissed }天`,
					`期待明天与你再次相见` );
			}
			reply ? await sendMessage( { embed: resultMsg }, this.parent.setting.userID ) : "";
		} catch ( error ) {
			if ( /Cookie已失效/.test( <string>error ) ) {
				await this.toggleEnableStatus( false );
				return await sendMessage( error + "\n自动签到已关闭，请更新 Cookie 后重新开启", this.parent.setting.userID );
			}
			bot.logger.error( error );
			await sendMessage( <string>error, this.parent.setting.userID );
		}
	}
	
	public async bbsSign( reply: boolean = false ) {
		const { mysID, cookie, stoken } = this.parent.setting;
		if ( !stoken ) {
			return reply ? await sendMessage( "未授权SToken，无法支持此任务", this.parent.setting.userID ) : "";
		}
		try {
			bot.logger.info( `[MysID ${ mysID }] 执行每日米游社任务，请耐心等待...` );
			const content = await mihoyoBBSTaskPromise( mysID, stoken );
			const mybData = await mihoyoBBSGetMybPromise( cookie );
			content.push( `今日获取米游币：${ mybData.today_total_points - mybData.can_get_points }` );
			content.push( `当前米游币数量：${ mybData.total_points }` );
			const embedMsg = new EmbedMsg(
				`今日米游社任务结果`,
				"",
				`今日米游社任务结果`,
				"https://img.ethreal.cn/i/2023/02/63e9ca1bd4e09.png",
				...content,
				`期待明天与你再次相见` );
			reply ? await sendMessage( { embed: embedMsg }, this.parent.setting.userID ) : "";
		} catch ( error ) {
			bot.logger.error( <string>error );
			reply ? await sendMessage( `今日米游社任务执行失败\n${ <string>error }`, this.parent.setting.userID ) : "";
		}
	}
	
	private setScheduleJob(): void {
		this.gameJob = scheduleJob( "0 5 6 * * *", () => {
			/* 每日签到一小时内内随机进行 */
			const sec: number = randomInt( 0, 360 );
			const time = new Date().setSeconds( sec * 10 );
			const job: Job = scheduleJob( time, async () => {
				await this.gameSign( true );
				job.cancel();
			} );
		} );
		
		this.bbsJob = scheduleJob( "0 7 8 * * *", () => {
			/* 每日签到两小时内内随机进行 */
			const sec: number = randomInt( 0, 360 * 2 );
			const time = new Date().setSeconds( sec * 10 );
			const job: Job = scheduleJob( time, async () => {
				await this.bbsSign( true );
				job.cancel();
			} );
		} );
	}
	
	private cancelScheduleJob(): void {
		if ( this.gameJob !== undefined ) {
			this.gameJob.cancel();
		}
		if ( this.bbsJob !== undefined ) {
			this.bbsJob.cancel();
		}
	}
}