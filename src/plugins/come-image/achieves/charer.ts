import { InputParameter } from "@modules/command";
import { getRealName, NameResult } from "#genshin/utils/name";
import { downloadImage, getRandomImageUrl } from "@modules/utils/drive";
import { getAnimation } from "#come-image/util/api";

/**
Author: Extrwave
CreateTime: 2023/2/1
 */

export async function main( { messageData, sendMessage, logger }: InputParameter ) {
	const content = messageData.msg.content;
	
	if ( !content || content.length === 0 ) {
		//获取一张动漫图片
		return await sendMessage( {
			image: await getAnimation()
		} );
	}
	
	const result: NameResult = getRealName( content );
	
	if ( !result.definite ) {
		const message: string = result.info.length === 0
			? "查询失败，请检查角色名称是否正确"
			: `未找到相关信息，是否要找：${ [ "", ...<string[]>result.info ].join( "\n  - " ) }`;
		await sendMessage( message );
		return;
	}
	const realName: string = <string>result.info;
	
	try {
		const image = await getRandomImageUrl( `/CharIM/${ realName }` );
		const fileImage = await downloadImage( image );
		await sendMessage( { file_image: fileImage } );
	} catch ( error ) {
		error = typeof error === 'string' ? error.replace( "$", realName ) : error;
		await sendMessage( <string>error );
	}
}