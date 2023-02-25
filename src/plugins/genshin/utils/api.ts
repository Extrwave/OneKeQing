import bot from "ROOT";
import request, { formatGetURL, IParams } from "@modules/requests";
import { parse } from "yaml";
import { toCamelCase } from "./camel-case";
import { set } from "lodash";
import { guid } from "../utils/guid";
import { generateDS, getDS, getDS2 } from "./ds";
import { InfoResponse, ResponseBody } from "#genshin/types";
import { SlipDetail } from "../module/slip";
import { DailyMaterial } from "../module/daily";
import { FortuneData } from "../module/almanac";
import fetch from "node-fetch";
import { Sleep } from "@modules/utils";
import { config } from "#genshin/init";
import * as ApiType from "#genshin/types";
import { randomInt, randomString } from "#genshin/utils/random";
import { Cookies } from "#genshin/module";
import { getBBSItemForumIds } from "#genshin/utils/region";

const __API = {
	/* 云端相关配置 */
	FETCH_ARTIFACT: "https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/artifact/artifact.yml",
	FETCH_SLIP: "https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/slip/index.yml",
	FETCH_WISH_CONFIG: "https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/wish/config/$.json",
	FETCH_INFO: "https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/info/docs/$.json",
	FETCH_GUIDE: "https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/guide/$.png",
	FETCH_ALIAS_SET: "https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/alias/alias.yml",
	FETCH_DAILY_MAP: "https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/daily/daily.yml",
	FETCH_ALMANAC: "https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/almanac/almanac.yml",
	FETCH_CHARACTER_ID: "https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/character/id.yml",
	FETCH_UID_HOME: "https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/home/home.yml",
	/* 米游社相关 */
	FETCH_ROLE_ID: "https://api-takumi-record.mihoyo.com/game_record/app/card/wapi/getGameRecordCard",
	FETCH_ROLE_INDEX: "https://api-takumi-record.mihoyo.com/game_record/app/genshin/api/index",
	FETCH_ROLE_CHARACTERS: "https://api-takumi-record.mihoyo.com/game_record/app/genshin/api/character",
	FETCH_ROLE_SPIRAL_ABYSS: "https://api-takumi-record.mihoyo.com/game_record/app/genshin/api/spiralAbyss",
	FETCH_ROLE_DAILY_NOTE: "https://api-takumi-record.mihoyo.com/game_record/app/genshin/api/dailyNote",
	FETCH_ROLE_AVATAR_DETAIL: "https://api-takumi.mihoyo.com/event/e20200928calculate/v1/sync/avatar/detail",
	FETCH_GACHA_LIST: "https://webstatic.mihoyo.com/hk4e/gacha_info/cn_gf01/gacha/list.json",
	FETCH_GACHA_DETAIL: "https://webstatic.mihoyo.com/hk4e/gacha_info/cn_gf01/$/zh-cn.json",
	FETCH_SIGN_IN: "https://api-takumi.mihoyo.com/event/bbs_sign_reward/sign",
	FETCH_SIGN_INFO: "https://api-takumi.mihoyo.com/event/bbs_sign_reward/info",
	FETCH_SIGNIN_AWARD: "https://api-takumi.mihoyo.com/event/bbs_sign_reward/home",
	FETCH_LEDGER: "https://hk4e-api.mihoyo.com/event/ys_ledger/monthInfo",
	FETCH_CALENDAR_LIST: "https://hk4e-api.mihoyo.com/common/hk4e_cn/announcement/api/getAnnList",
	FETCH_CALENDAR_DETAIL: "https://hk4e-api.mihoyo.com/common/hk4e_cn/announcement/api/getAnnContent",
	FETCH_BBS_LIST: "https://bbs-api.miyoushe.com/apihub/api/getGameList",
	FETCH_BBS_SIGN_INFO: "https://bbs-api.miyoushe.com/apihub/sapi/querySignInStatus",
	FETCH_BBS_SIGN_IN: "https://bbs-api.miyoushe.com/apihub/app/api/signIn",
	FETCH_BBS_GET_ALL_FORUM: "https://bbs-api-static.miyoushe.com/apihub/wapi/getAllGamesForums",
	FETCH_BBS_GET_POST: "https://bbs-api.miyoushe.com/post/wapi/getForumPostList",
	FETCH_BBS_FULL_POST: "https://bbs-api.miyoushe.com/post/api/getPostFull",
	FETCH_BBS_UPVOTE_POST: "https://bbs-api.miyoushe.com/apihub/sapi/upvotePost",
	FETCH_BBS_SHARE_POST: "https://bbs-api.miyoushe.com/apihub/api/getShareConf",
	FETCH_BBS_GET_TASK: "https://api-takumi.mihoyo.com/apihub/wapi/getUserMissionsState",
	/* 验证码服务相关 */
	FETCH_GET_VERIFY: "http://challenge.minigg.co/geetest",
	FETCH_GEETEST: "https://api.geetest.com/gettype.php",
	FETCH_CREATE_VERIFICATION: "https://api-takumi-record.mihoyo.com/game_record/app/card/wapi/createVerification",
	FETCH_VERIFY_VERIFICATION: "https://api-takumi-record.mihoyo.com/game_record/app/card/wapi/verifyVerification",
	/* Token转换相关 */
	FETCH_GET_MULTI_TOKEN: "https://api-takumi.mihoyo.com/auth/api/getMultiTokenByLoginTicket",
	FETCH_GET_COOKIE_TOKEN: "https://api-takumi.mihoyo.com/auth/api/getCookieAccountInfoBySToken",
	FETCH_VERIFY_LTOKEN: "https://passport-api-v4.mihoyo.com/account/ma-cn-session/web/verifyLtoken",
	FETCH_GET_LTOKEN_BY_STOKEN: "https://passport-api.mihoyo.com/account/auth/api/getLTokenBySToken"
};

const genshinActivityID: string = "e202009291139501";
const HEADERS = {
	NORMAL: {
		"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.29.1",
		"Referer": "https://webstatic.mihoyo.com/",
		"x-rpc-app_version": "2.29.1",
		"x-rpc-client_type": 5,
		"DS": "",
		"Cookie": ""
	},
	SIGN: {
		"User-Agent": "Mozilla/5.0 (Linux; Android 9; Unspecified Device) AppleWebKit/537.36 (KHTML, like Gecko) " +
			"Version/4.0 Chrome/39.0.0.0 Mobile Safari/537.36 miHoYoBBS/2.3.0",
		"Referer": "https://webstatic.mihoyo.com/bbs/event/signin-ys/index.html" +
			`?bbs_auth_required=true&act_id=${ genshinActivityID }&utm_source=bbs&utm_medium=mys&utm_campaign=icon`,
		"Accept": "application/json, text/plain, */*",
		"Accept-Encoding": "gzip, deflate",
		"Accept-Language": "zh-CN,en-US;q=0.8",
		"Origin": "https://webstatic.mihoyo.com",
		"X-Requested-With": "com.mihoyo.hyperion",
		"x-rpc-app_version": "2.34.1",
		"x-rpc-client_type": 5,
		"x-rpc-platform": "ios",
		"x-rpc-device_model": "iPhone7,1",
		"x-rpc-device_name": "abcd",
		"x-rpc-channel": "appstore",
		"x-rpc-sys_version": "12.4.1",
		"x-rpc-device_id": guid(),
		"DS": ""
	},
	BBS: {
		"Referer": "https://app.mihoyo.com",
		'Host': "bbs-api.mihoyo.com",
		"x-rpc-app_version": "2.34.1",
		"x-rpc-channel": "appstore",
		"x-rpc-client_type": "5",
		"x-rpc-device_id": guid(),
		"x-rpc-device_model": "iPhone7,1",
		"x-rpc-device_name": randomString( 5 ),
		"x-rpc-sys_version": "12.4.1",
		"user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.34.1",
		"DS": "",
		"Cookie": ""
	}
	
	
};

const verifyMsg = "API请求遭遇验证码拦截 ~";
const verifyError = "多次尝试解决验证码失败，请重试或者带上截图前往官频反馈 ~"

/* mihoyo BBS API */
export async function getBaseInfo( mysID: number, cookie: string, time: number = 0 ): Promise<ResponseBody> {
	const query = { uid: mysID };
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: __API.FETCH_ROLE_ID,
			qs: query,
			headers: {
				...HEADERS.NORMAL,
				"DS": getDS( query ),
				"Cookie": cookie,
				"x-rpc-device_id": guid()
			}
		} )
			.then( async ( result ) => {
				const resp = toCamelCase( JSON.parse( result ) );
				const data: ResponseBody = set( resp, "data.type", "bbs" );
				if ( data.retcode !== 1034 ) {
					return resolve( data );
				}
				bot.logger.warn( `[ MysID${ mysID } ][base] 查询遇到验证码` );
				if ( config.verifyEnable && time <= config.verifyRepeat ) {
					const error = await bypassQueryVerification( cookie );
					bot.logger.debug( `[ MysID${ mysID } ][base] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
					return resolve( await getBaseInfo( mysID, cookie, ++time ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getDetailInfo( uid: number, server: string, cookie: string, time: number = 0 ): Promise<ResponseBody> {
	const query = {
		role_id: uid,
		server
	};
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: __API.FETCH_ROLE_INDEX,
			qs: query,
			headers: {
				...HEADERS.NORMAL,
				"DS": getDS( query ),
				"Cookie": cookie,
				"x-rpc-device_id": guid()
			}
		} )
			.then( async ( result ) => {
				const resp = toCamelCase( JSON.parse( result ) );
				const data: ResponseBody = set( resp, "data.type", "user-info" )
				if ( data.retcode !== 1034 ) {
					return resolve( data );
				}
				bot.logger.warn( `[ UID${ uid } ][detail] 查询遇到验证码` );
				if ( config.verifyEnable && time <= config.verifyRepeat ) {
					const error = await bypassQueryVerification( cookie );
					bot.logger.debug( `[ UID${ uid } ][detail] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
					return resolve( await getDetailInfo( uid, server, cookie, ++time ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getCharactersInfo( roleID: number, server: string, charIDs: number[], cookie: string, time: number = 0 ): Promise<ResponseBody> {
	const body = {
		character_ids: charIDs,
		role_id: roleID,
		server
	};
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "POST",
			url: __API.FETCH_ROLE_CHARACTERS,
			json: true,
			body,
			headers: {
				...HEADERS.NORMAL,
				"DS": getDS( undefined, JSON.stringify( body ) ),
				"Cookie": cookie,
				"content-type": "application/json",
				"x-rpc-device_id": guid()
			}
		} )
			.then( async ( result ) => {
				const resp = toCamelCase( result );
				const data: ResponseBody = set( resp, "data.type", "character" );
				if ( data.retcode !== 1034 ) {
					return resolve( data );
				}
				bot.logger.warn( `[ UID${ roleID } ][char] 查询遇到验证码` );
				if ( config.verifyEnable && time <= config.verifyRepeat ) {
					const error = await bypassQueryVerification( cookie );
					bot.logger.debug( `[ UID${ roleID } ][char] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
					return resolve( await getCharactersInfo( roleID, server, charIDs, cookie, ++time ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getDailyNoteInfo( uid: number, server: string, cookie: string, time: number = 0 ): Promise<ResponseBody> {
	const query = {
		role_id: uid,
		server
	};
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: __API.FETCH_ROLE_DAILY_NOTE,
			qs: query,
			headers: {
				...HEADERS.NORMAL,
				"DS": getDS( query ),
				"Cookie": cookie,
				"x-rpc-device_id": guid()
			}
		} )
			.then( async ( result ) => {
				const resp = toCamelCase( JSON.parse( result ) );
				const data: ResponseBody = set( resp, "data.type", "note" );
				if ( data.retcode !== 1034 ) {
					return resolve( data );
				}
				bot.logger.warn( `[ UID${ uid } ][note] 查询遇到验证码` );
				if ( config.verifyEnable && time <= config.verifyRepeat ) {
					const error = await bypassQueryVerification( cookie );
					bot.logger.debug( `[ UID${ uid } ][note] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
					return resolve( await getDailyNoteInfo( uid, server, cookie, ++time ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getAvatarDetailInfo( uid: string, avatarID: number, server: string, cookie: string, time: number = 0 ): Promise<ResponseBody> {
	const query = {
		avatar_id: avatarID,
		region: server,
		uid
	};
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: __API.FETCH_ROLE_AVATAR_DETAIL,
			qs: query,
			headers: {
				...HEADERS.NORMAL,
				"DS": getDS( query ),
				"Cookie": cookie,
				"x-rpc-device_id": guid()
			}
		} )
			.then( async ( result ) => {
				const resp = toCamelCase( JSON.parse( result ) );
				const data: ResponseBody = set( resp, "data.type", "avatar" );
				if ( data.retcode !== 1034 ) {
					return resolve( data );
				}
				bot.logger.warn( `[ UID${ uid } ][avatar] 查询遇到验证码` );
				if ( config.verifyEnable && time <= config.verifyRepeat ) {
					const error = await bypassQueryVerification( cookie );
					bot.logger.debug( `[ UID${ uid } ][avatar] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
					return resolve( await getAvatarDetailInfo( uid, avatarID, server, cookie, ++time ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

/* period 为 1 时表示本期深渊，2 时为上期深渊 */
export async function getSpiralAbyssInfo( roleID: number, server: string, period: number, cookie: string, time: number = 0 ): Promise<ResponseBody> {
	const query = {
		role_id: roleID,
		schedule_type: period,
		server
	};
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: __API.FETCH_ROLE_SPIRAL_ABYSS,
			qs: query,
			headers: {
				...HEADERS.NORMAL,
				"DS": getDS( query ),
				"Cookie": cookie,
				"x-rpc-device_id": guid()
			}
		} )
			.then( async ( result ) => {
				const resp = toCamelCase( JSON.parse( result ) );
				const data: ResponseBody = set( resp, "data.type", "abyss" );
				if ( data.retcode !== 1034 ) {
					return resolve( data );
				}
				bot.logger.warn( `[ UID${ roleID } ][abyss] 查询遇到验证码` );
				if ( config.verifyEnable && time <= config.verifyRepeat ) {
					const error = await bypassQueryVerification( cookie );
					bot.logger.debug( `[ UID${ roleID } ][abyss] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
					return resolve( await getSpiralAbyssInfo( roleID, server, period, cookie, ++time ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getLedger( uid: string, server: string, mon: number, cookie: string, time: number = 0 ): Promise<any> {
	const query = {
		bind_uid: uid,
		bind_region: server,
		month: mon
	};
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: __API.FETCH_LEDGER,
			qs: query,
			headers: {
				...HEADERS.NORMAL,
				"Cookie": cookie,
				"x-rpc-device_id": guid()
			}
		} )
			.then( async ( result ) => {
				const resp = toCamelCase( JSON.parse( result ) );
				const data: ResponseBody = set( resp, "data.type", "ledger" );
				if ( data.retcode !== 1034 ) {
					return resolve( data );
				}
				bot.logger.warn( `[ UID${ uid } ][ledger] 查询遇到验证码` );
				if ( config.verifyEnable && time <= config.verifyRepeat ) {
					const error = await bypassQueryVerification( cookie );
					bot.logger.debug( `[ UID${ uid } ][ledger] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
					return resolve( await getLedger( uid, server, mon, cookie, ++time ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getWishList(): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: __API.FETCH_GACHA_LIST
		} )
			.then( ( result ) => {
				resolve( JSON.parse( result ) );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getWishDetail( wishID: string ): Promise<any> {
	const wishLinkWithID: string = __API.FETCH_GACHA_DETAIL.replace( "$", wishID );
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: wishLinkWithID
		} )
			.then( ( result ) => {
				resolve( JSON.parse( result ) );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

/* calender API */
const calc_query = {
	game: "hk4e",
	game_biz: "hk4e_cn",
	lang: "zh-cn",
	bundle_id: "hk4e_cn",
	platform: "pc",
	region: "cn_gf01",
	level: "55",
	uid: "100000000"
};

export async function getCalendarList(): Promise<ResponseBody> {
	const url = formatGetURL( __API.FETCH_CALENDAR_LIST, calc_query );
	const result: Response = await fetch( url );
	
	const resp = toCamelCase( await result.json() );
	const data: ResponseBody = set( resp, "data.type", "calendar-list" )
	return data;
}

export async function getCalendarDetail(): Promise<ResponseBody> {
	const url = formatGetURL( __API.FETCH_CALENDAR_DETAIL, calc_query );
	const result: Response = await fetch( url );
	
	const resp = toCamelCase( await result.json() );
	const data: ResponseBody = set( resp, "data.type", "calendar-detail" )
	return data;
}

/* OSS API */
export async function getInfo( name: string ): Promise<InfoResponse | string> {
	const charLinkWithName: string = __API.FETCH_INFO.replace( "$", encodeURI( name ) );
	
	const result: Response = await fetch( charLinkWithName )
	
	if ( result.status === 404 ) {
		throw "";
	} else {
		return <InfoResponse><unknown>await result.json();
	}
}

export async function checkGuideExist( name: string ): Promise<boolean | string> {
	const charLinkWithName: string = __API.FETCH_GUIDE.replace( "$", encodeURI( name ) );
	
	return new Promise( ( resolve ) => {
		fetch( charLinkWithName ).then( ( result: Response ) => {
			resolve( result.status !== 404 );
		} ).catch( ( error: Error ) => {
			resolve( error.message );
		} )
	} )
}

export async function getArtifact(): Promise<any> {
	return new Promise( ( resolve ) => {
		fetch( __API.FETCH_ARTIFACT )
			.then( async ( result: Response ) => {
				resolve( parse( await result.text() ) );
			} );
	} );
}

export async function getSlip(): Promise<SlipDetail> {
	return new Promise( ( resolve ) => {
		fetch( __API.FETCH_SLIP )
			.then( async ( result: Response ) => {
				resolve( parse( await result.text() ) );
			} );
	} );
}

export async function getWishConfig( type: string ): Promise<any> {
	const wishLinkWithType: string = __API.FETCH_WISH_CONFIG.replace( "$", type );
	
	return new Promise( ( resolve, reject ) => {
		fetch( wishLinkWithType )
			.then( ( result: Response ) => {
				if ( result.status === 404 ) {
					reject( "" );
				} else {
					resolve( result.json() );
				}
			} );
	} );
}

export async function getAliasName(): Promise<any> {
	return new Promise( ( resolve ) => {
		fetch( __API.FETCH_ALIAS_SET )
			.then( async ( result: Response ) => {
				resolve( parse( await result.text() ).set );
			} );
	} );
}

export async function getDailyMaterial(): Promise<DailyMaterial> {
	return new Promise( ( resolve ) => {
		fetch( __API.FETCH_DAILY_MAP )
			.then( async ( result: Response ) => {
				resolve( parse( await result.text() ) );
			} );
	} );
}

/* 文本来源 可莉特调 https: //genshin.pub/ */
export async function getAlmanacText(): Promise<Record<string, FortuneData[]>> {
	return new Promise( ( resolve ) => {
		fetch( __API.FETCH_ALMANAC )
			.then( async ( result: Response ) => {
				resolve( parse( await result.text() ) );
			} );
	} );
}

export async function getCharacterID(): Promise<Record<string, number>> {
	return new Promise( ( resolve ) => {
		fetch( __API.FETCH_CHARACTER_ID )
			.then( async ( result: Response ) => {
				resolve( parse( await result.text() ) );
			} );
	} );
}

export async function getUidHome(): Promise<any> {
	return new Promise( ( resolve ) => {
		fetch( __API.FETCH_UID_HOME )
			.then( async ( result: Response ) => {
				resolve( parse( await result.text() ).list );
			} );
	} );
}

/* Sign In API */

/* 参考 https://github.com/DGP-Studio/DGP.Genshin.MiHoYoAPI/blob/main/Sign/SignInProvider.cs */
export async function mihoyoGenshinSignIn( uid: string, region: string, cookie: string ): Promise<ResponseBody> {
	const body = {
		act_id: genshinActivityID,
		uid, region
	};
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "POST",
			url: __API.FETCH_SIGN_IN,
			json: true,
			body,
			headers: {
				...HEADERS.SIGN,
				"content-type": "application/json",
				"Cookie": cookie,
				"DS": getDS2(),
				"x-rpc-device_id": guid()
			}
		} )
			.then( async ( result ) => {
				const resp = toCamelCase( result );
				const data: ResponseBody = set( resp, "data.type", "sign-in-result" );
				if ( ApiType.isSignInResult( data.data ) && ( !data.data.gt && data.data.success === 0 ) ) {
					return resolve( data );
				}
				//遇到验证码
				bot.logger.warn( `[ UID${ uid } ][sign] 签到遇到验证码` );
				if ( ApiType.isSignInResult( data.data ) && data.data.gt && data.data.challenge && config.verifyEnable ) {
					bot.logger.debug( `[ UID${ uid } ][sign] 遇到验证码，正在尝试绕过` );
					return resolve( mihoyoBBSVerifySignIn( uid, region, cookie, data.data.gt, data.data.challenge ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getGenshinSignInInfo( uid: string, region: string, cookie: string ): Promise<ResponseBody> {
	const query = {
		act_id: genshinActivityID,
		region, uid
	};
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: __API.FETCH_SIGN_INFO,
			qs: query,
			headers: {
				...HEADERS.SIGN,
				"Cookie": cookie
			}
		} )
			.then( async ( result ) => {
				const resp = toCamelCase( JSON.parse( result ) );
				const data: ResponseBody = set( resp, "data.type", "sign-in-info" )
				resolve( data );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getGenshinSignInReward(): Promise<any> {
	return new Promise( ( resolve ) => {
		fetch( __API.FETCH_SIGNIN_AWARD + `?act_id=${ genshinActivityID }` )
			.then( async ( result: Response ) => {
				resolve( JSON.parse( await result.text() ) );
			} );
	} );
}

/* 米游社任务相关 */
export async function mihoyoBBSGetGameItem(): Promise<any> {
	return new Promise( ( resolve ) => {
		fetch( __API.FETCH_BBS_LIST )
			.then( async ( result: Response ) => {
				resolve( await result.json() );
			} );
	} );
}

export async function mihoyoBBSItemSignInfo( gids: number, cookie: string ): Promise<any> {
	const query = { gids };
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: formatGetURL( __API.FETCH_BBS_SIGN_INFO, query ),
			headers: {
				...HEADERS.BBS,
				cookie,
				DS: getDS( query )
			},
			json: true
		} ).then( result => {
			resolve( result );
		} ).catch( reason => {
			reject( reason );
		} )
	} )
}

export async function mihoyoBBSItemSign( mysID: number, gids: number, cookie: string, time: number = 0 ): Promise<any> {
	const body = { gids };
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "POST",
			url: __API.FETCH_BBS_SIGN_IN,
			headers: {
				...HEADERS.BBS,
				cookie,
				DS: getDS( undefined, JSON.stringify( body ) )
			},
			json: true,
			body: body
		} ).then( async result => {
			if ( result.retcode !== 1034 ) {
				return resolve( result );
			}
			bot.logger.warn( `[ MysID${ mysID } ][myssign] 查询遇到验证码` );
			if ( config.verifyEnable && time <= config.verifyRepeat ) {
				const error = await bypassQueryVerification( cookie );
				bot.logger.debug( `[ MysID${ mysID } ][myssign] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
				return resolve( await mihoyoBBSItemSign( mysID, gids, cookie, ++time ) );
			}
			reject( config.verifyEnable ? verifyError : verifyMsg );
		} ).catch( reason => {
			reject( reason );
		} )
	} )
}

export async function mihoyoBBSGetPosts( cookie: string, gids: number, last_id: string = "", time: number = 0 ): Promise<any> {
	const forumIds = getBBSItemForumIds( gids );
	const query: IParams = {
		forum_id: forumIds[randomInt( 0, forumIds.length - 1 )],
		page_size: 10
	}
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: formatGetURL( __API.FETCH_BBS_GET_POST, query ),
			headers: {
				...HEADERS.NORMAL,
				cookie: cookie
			},
			json: true
		} ).then( async result => {
			if ( result.retcode !== 1034 ) {
				return resolve( result );
			}
			const MysID = Cookies.checkMysID( cookie );
			bot.logger.warn( `[ MysID${ MysID } ][getPost] 查询遇到验证码` );
			if ( config.verifyEnable && time <= config.verifyRepeat ) {
				const error = await bypassQueryVerification( cookie );
				bot.logger.debug( `[ MysID${ MysID } ][getPost] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
				return resolve( await mihoyoBBSGetPosts( cookie, gids, last_id, ++time ) );
			}
			reject( config.verifyEnable ? verifyError : verifyMsg );
		} ).catch( reason => {
			reject( reason );
		} )
	} )
}

export async function mihoyoBBSGetFullPost( cookie: string, postId: string, time: number = 0 ): Promise<any> {
	const query: IParams = { post_id: postId };
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: formatGetURL( __API.FETCH_BBS_FULL_POST, query ),
			headers: {
				...HEADERS.BBS,
				cookie: cookie,
				DS: getDS2()
			},
			json: true
		} )
			.then( async result => {
				if ( result.retcode !== 1034 ) {
					return resolve( result );
				}
				const MysID = Cookies.checkMysID( cookie );
				bot.logger.warn( `[ MysID${ MysID } ][viewPost] 查询遇到验证码` );
				if ( config.verifyEnable && time <= config.verifyRepeat ) {
					const error = await bypassQueryVerification( cookie );
					bot.logger.debug( `[ MysID${ MysID } ][viewPost] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
					return resolve( await mihoyoBBSGetFullPost( cookie, postId, ++time ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} ).catch( reason => {
			reject( reason );
		} );
	} )
}

export async function mihoyoBBSUpvotePost( cookie: string, post_id: string, time: number = 0 ): Promise<any> {
	const body = {
		post_id: post_id,
		is_cancel: false
	}
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "POST",
			url: __API.FETCH_BBS_UPVOTE_POST,
			headers: {
				...HEADERS.BBS,
				cookie: cookie,
				DS: getDS2()
			},
			json: true,
			body: body
		} ).then( async result => {
			if ( result.retcode !== 1034 ) {
				return resolve( result );
			}
			const MysID = Cookies.checkMysID( cookie );
			bot.logger.warn( `[ MysID${ MysID } ][upvote] 查询遇到验证码` );
			if ( config.verifyEnable && time <= config.verifyRepeat ) {
				const error = await bypassQueryVerification( cookie );
				bot.logger.debug( `[ MysID${ MysID } ][upvote] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
				return resolve( await mihoyoBBSUpvotePost( cookie, post_id, ++time ) );
			}
			reject( config.verifyEnable ? verifyError : verifyMsg );
		} ).catch( reason => {
			reject( reason );
		} )
	} )
}

export async function mihoyoBBSSharePost( cookie: string, post_id: string, time: number = 0 ): Promise<any> {
	const data = {
		entity_type: 1,
		entity_id: post_id
	}
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: formatGetURL( __API.FETCH_BBS_SHARE_POST, data ),
			headers: {
				...HEADERS.BBS,
				cookie: cookie,
				DS: getDS2()
			},
			json: true
		} )
			.then( async result => {
				if ( result.retcode !== 1034 ) {
					return resolve( result );
				}
				const MysID = Cookies.checkMysID( cookie );
				bot.logger.warn( `[ MysID${ MysID } ][share] 查询遇到验证码` );
				if ( config.verifyEnable && time <= config.verifyRepeat ) {
					const error = await bypassQueryVerification( cookie );
					bot.logger.debug( `[ MysID${ MysID } ][share] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
					return resolve( await mihoyoBBSSharePost( cookie, post_id, ++time ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} )
			.catch( reason => {
				reject( reason );
			} )
	} )
}

export async function mihoyoBBSGetMyb( cookie: string, time: number = 0 ): Promise<any> {
	const query: IParams = {
		point_sn: "myb"
	}
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: formatGetURL( __API.FETCH_BBS_GET_TASK, query ),
			headers: {
				...HEADERS.BBS,
				cookie: cookie,
				DS: getDS( query )
			},
			json: true
		} )
			.then( async result => {
				if ( result.retcode !== 1034 ) {
					return resolve( result );
				}
				const MysID = Cookies.checkMysID( cookie );
				bot.logger.warn( `[ MysID${ MysID } ][getMyb] 查询遇到验证码` );
				if ( config.verifyEnable && time <= config.verifyRepeat ) {
					const error = await bypassQueryVerification( cookie );
					bot.logger.debug( `[ MysID${ MysID } ][getMyb] 第 ${ time + 1 } 次验证码绕过${ error ? "失败：" + error : "成功" }` );
					return resolve( await mihoyoBBSGetMyb( cookie, ++time ) );
				}
				reject( config.verifyEnable ? verifyError : verifyMsg );
			} )
			.catch( reason => {
				reject( reason );
			} )
	} )
}

/* 验证码相关解决方案 */
export async function bypassQueryVerification( cookie: string, gt?: string, challenge?: string ): Promise<string | undefined> {
	const data = {
		gt: gt ? gt : '',
		challenge: challenge ? challenge : ''
	};
	if ( !gt || !challenge ) {
		//获取验证码
		const createVerify = JSON.parse( await request( {
			method: "GET",
			url: formatGetURL( __API.FETCH_CREATE_VERIFICATION, {
				"is_high": "true"
			} ),
			headers: {
				...HEADERS.NORMAL,
				"DS": getDS( { is_high: true } ),
				"Cookie": cookie
			}
		} ) );
		if ( !createVerify.data ) {
			bot.logger.error( createVerify );
			return "获取验证码失败，请前往官频反馈";
		}
		data.gt = createVerify.data.gt;
		data.challenge = createVerify.data.challenge;
	}
	//提交GEETEST
	await Sleep( 3000 );
	await request( {
		url: formatGetURL( __API.FETCH_GEETEST, {
			"gt": data.gt,
			"challenge": data.challenge
		} ),
		method: "GET"
	} );
	//验证验证码
	let analysisCode = await request( {
		method: "GET",
		url: formatGetURL( __API.FETCH_GET_VERIFY, {
			"token": config.verifyToken,
			"gt": data.gt,
			"challenge": data.challenge
		} ),
		headers: {
			"User-Agent": "Adachi-GBOT"
		}
	} );
	try {
		analysisCode = JSON.parse( analysisCode );
	} catch ( error ) {
		bot.logger.error( analysisCode );
		return "验证码验证失败，请重试或者等待上游服务商解决";
	}
	if ( analysisCode.code !== 0 || analysisCode.info !== "success" ) {
		bot.logger.error( analysisCode );
		return "验证码验证失败，请重试或者等待上游服务商解决";
	}
	const body = {
		geetest_challenge: analysisCode.data.challenge,
		geetest_validate: analysisCode.data.validate,
		geetest_seccode: `${ analysisCode.data.validate }|jordan`
	}
	const verifyResult = await request( {
		method: "POST",
		url: __API.FETCH_VERIFY_VERIFICATION,
		json: true,
		body,
		headers: {
			...HEADERS.NORMAL,
			"DS": getDS( undefined, JSON.stringify( body ) ),
			"Cookie": cookie
		}
	} );
	if ( verifyResult.retcode !== 0 || verifyResult.message !== 'OK' ) {
		bot.logger.error( verifyResult );
		return "提交验证码已过期，请重试或者等待上游服务商解决";
	}
}

export async function mihoyoBBSVerifySignIn( uid: string, region: string, cookie: string, gt: string, challenge: string ): Promise<ResponseBody> {
	const body = {
		act_id: genshinActivityID,
		uid, region
	};
	
	//验证验证码
	let analysisCode = await request( {
		method: "GET",
		url: formatGetURL( __API.FETCH_GET_VERIFY, {
			"token": config.verifyToken,
			"gt": gt,
			"challenge": challenge
		} ),
		headers: {
			"User-Agent": "Adachi-GBOT"
		}
	} );
	try {
		analysisCode = JSON.parse( analysisCode );
	} catch ( error ) {
		bot.logger.error( analysisCode );
		throw "验证码验证失败，请重试或者等待上游服务商解决";
	}
	if ( analysisCode.code !== 0 || analysisCode.info !== "success" ) {
		bot.logger.error( analysisCode );
		throw "验证码验证失败，请重试或者等待上游服务商解决";
	}
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "POST",
			url: __API.FETCH_SIGN_IN,
			json: true,
			body,
			headers: {
				...HEADERS.SIGN,
				"content-type": "application/json",
				"Cookie": cookie,
				"DS": getDS2(),
				"x-rpc-challenge": analysisCode.data.challenge,
				"x-rpc-validate": analysisCode.data.validate,
				"x-rpc-seccode": `${ analysisCode.data.validate }|jordan`
			}
		} )
			.then( async ( result ) => {
				const resp = toCamelCase( result );
				const data: ResponseBody = set( resp, "data.type", "sign-in-result" );
				if ( ApiType.isSignInResult( data.data ) &&
					( !data.data.gt && data.data.success === 0 ) ) {
					return resolve( data );
				}
				//遇到验证码
				reject( verifyError );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

/* Token转换相关API */
export async function getCookieAccountInfoBySToken(
	stoken: string,
	mid: string,
	uid: string ): Promise<ResponseBody> {
	const param = {
		stoken: stoken,
		mid: mid,
		token_types: 3,
		uid: uid
	}
	
	const url = formatGetURL( __API.FETCH_GET_COOKIE_TOKEN, param );
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: url,
			json: true
		} ).then( result => {
			const resp = toCamelCase( result );
			const data: ResponseBody = set( resp, "data.type", "cookie-token" )
			resolve( data );
		} ).catch( ( reason ) => {
			reject( reason );
		} );
	} )
}

export async function getMultiTokenByLoginTicket( uid: number, loginTicket: string, cookie: string ): Promise<ResponseBody> {
	const params = {
		login_ticket: loginTicket,
		token_types: 3,
		uid: uid
	};
	
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: __API.FETCH_GET_MULTI_TOKEN,
			headers: {
				...HEADERS.BBS,
				"host": "api-takumi.mihoyo.com",
				"origin": "https://webstatic.mihoyo.com",
				"referer": "https://webstatic.mihoyo.com/",
				"x-requested-with": "com.mihoyo.hyperion",
				"ds": generateDS(),
				"cookie": cookie
			},
			qs: params,
			timeout: 5000
		} ).then( async ( result ) => {
			const resp = toCamelCase( JSON.parse( result ) );
			if ( !resp.data ) {
				reject( resp.message || resp.msg );
				return;
			}
			const data: ResponseBody = set( resp, "data.type", "multi-token" );
			resolve( data );
		} ).catch( reason => {
			reject( reason );
		} )
	} )
}

export async function verifyLtoken( ltoken: string, ltuid: string ): Promise<ResponseBody> {
	const params = {
		t: Date.now()
	};
	const cookie = `ltoken=${ ltoken }; ltuid=${ ltuid };`;
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "POST",
			url: __API.FETCH_VERIFY_LTOKEN,
			headers: {
				...HEADERS.NORMAL,
				Referer: "https://bbs.mihoyo.com/",
				cookie: cookie
			},
			qs: params,
			timeout: 5000
		} ).then( async ( result ) => {
			const resp = toCamelCase( JSON.parse( result ) );
			if ( !resp.data ) {
				reject( resp.message || resp.msg );
				return;
			}
			const data: ResponseBody = set( resp, "data.type", "verify-ltoken" );
			resolve( data );
		} ).catch( reason => {
			reject( reason );
		} )
	} )
}


export async function getLTokenBySToken( stoken: string, mid: string ): Promise<ResponseBody> {
	const cookie = `stoken=${ stoken }; mid=${ mid };`;
	
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: __API.FETCH_GET_LTOKEN_BY_STOKEN,
			headers: {
				...HEADERS.NORMAL,
				cookie: cookie,
				DS: getDS( undefined, undefined )
			},
			timeout: 5000
		} ).then( async ( result ) => {
			const resp = toCamelCase( JSON.parse( result ) );
			const data: ResponseBody = set( resp, "data.type", "get-ltoken" );
			if ( !resp.data ) {
				reject( resp.message || resp.msg );
				return;
			}
			resolve( data );
		} ).catch( reason => {
			reject( reason );
		} )
	} )
}