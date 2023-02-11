/**
Author: Extrwave
CreateTime: 2023/2/3
 */

/* 获取随机背景图 */
import bot from "ROOT";
import fetch from "node-fetch";
import FormData from "form-data";
import requests from "@modules/requests";
import { randomInt } from "#genshin/utils/random";
import { Buffer } from "buffer";

/**
 *@0 Help Top BG
 *@1 UID/MYS TOP BG
 *@2 CharIM BG
 * ....
 * @param type
 */
export function getRandomImageUrl( path: string ): Promise<string> {
	const baseUrl = bot.config.alistDrive.baseUrl;
	const baseDown = baseUrl + "/d";
	const baseDir = bot.config.alistDrive.baseDir + path;
	
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

export async function uploadToAlist( path: string, fileName: string, buffer: Buffer ): Promise<{
	code: number,
	message: string,
	data: any
}> {
	const baseUrl = bot.config.alistDrive.baseUrl;
	const baseDir = bot.config.alistDrive.baseDir + path;
	return new Promise( ( resolve, reject ) => {
		requests( {
			method: "PUT",
			url: baseUrl + "/api/fs/put",
			headers: {
				'authorization': bot.config.alistDrive.auth,
				'file-path': baseDir + "/" + fileName
			},
			body: buffer
		} ).then( result => {
			resolve( JSON.parse( result ) );
		} ).catch( reason => {
			reject( reason );
		} )
	} )
}

export async function getImageFormdata( url: string ): Promise<FormData> {
	const down: Response = await fetch( url );
	const buffer = Buffer.from( await down.arrayBuffer() );
	const type = url.substring( url.length - 3 );
	const formData = new FormData();
	formData.append("file_image")
}

