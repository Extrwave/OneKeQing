/**
Author: Extrwave
CreateTime: 2023/2/3
 */

/* 获取随机背景图 */
import requests from "@modules/requests";
import { randomInt } from "#genshin/utils/random";

const ADDRESS = [
	"",
	"/HelpTopBG",
	"/UidTopBG",
	"/Clothes"
]


/**
 *@1 Help Top BG
 *@2 UID/MYS TOP BG
 *@3 Clothes TOP BG
 * ....
 * @param type
 */
export function getRandomBackground( type: number ): Promise<string> {
	const baseUrl = "https://drive.ethreal.cn";
	const baseDown = baseUrl + "/d";
	const baseDir = "/OneKeQing" + ADDRESS[type];
	
	return new Promise( ( resolve, reject ) => {
		requests( {
			method: "POST",
			url: baseUrl + "/api/fs/list",
			json: true,
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