/**
Author: Extrwave
CreateTime: 2023/2/3
 */

/* 获取随机背景图 */
import bot from "ROOT";
import requests from "@modules/requests";
import { randomInt } from "#genshin/utils/random";

/**
 *@0 Help Top BG
 *@1 UID/MYS TOP BG
 *@2 CharIM BG
 * ....
 * @param type
 */
export function getRandomBackground( type: number ): Promise<string> {
	const baseUrl = bot.config.alistDrive.baseUrl;
	const baseDown = baseUrl + "/d";
	const baseDir = bot.config.alistDrive.baseDir + bot.config.alistDrive.allDirs[type];
	
	return new Promise( ( resolve, reject ) => {
		requests( {
			method: "POST",
			url: baseUrl + "/api/fs/list",
			json: true,
			headers: {
				authorization: bot.config.alistDrive.auth
			},
			body: {
				path: baseDir,
				per_page: 200
			}
		} ).then( result => {
			const ran = randomInt( 0, result.data.content.length );
			const fileAddr = baseDir + "/" + result.data.content[ran].name;
			resolve( baseDown + fileAddr );
		} ).catch( reason => {
			resolve( baseDown + baseDir + "/1.png" );
		} )
	} )
}