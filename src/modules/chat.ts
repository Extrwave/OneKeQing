/**
Author: Ethereal
CreateTime: 2022/6/21
 */

import * as msg from "@modules/message";
import { __API, getChatResponse, getEmoji, getTextResponse } from "@modules/utils/chat-api";
import { Message } from "@modules/utils/message";
import { IMessage } from "qq-guild-bot";

export async function autoReply( messageData: Message, sendMessage: msg.SendFunc, enable: boolean ): Promise<IMessage> {
	//处理传入的数据
	const msg: string = messageData.msg.content;
	//开始匹配回答
	if ( msg.length <= 0 ) {
		//随即回复一个表情包
		return await sendMessage( { content: "找我有何贵干？", image: getEmoji() } );
	} else if ( msg.length >= 20 ) {
		return await sendMessage( { content: "问题太复杂了，要不咱们聊点别的？", image: getEmoji() } );
	}
	
	if ( /Help|教程|帮助|Cookie|Start/i.test( msg ) ) {
		const message = "频道 枫叶丹 有视频教程 ~ \n" +
			"基本使用教程：https://drive.ethreal.cn/189Cloud/Markdown/bothelp.md\n" +
			"cookie获取教程: https://drive.ethreal.cn/189Cloud/Markdown/cookies.md\n" +
			"云原神签到教程: https://drive.ethreal.cn/189Cloud/Markdown/yystoken.md";
		return await sendMessage( message );
	}
	
	switch ( true ) {
		case /渣/.test( msg ):
			return await sendMessage( await getTextResponse( __API.LOVELIVE ) );
		case /emo/.test( msg ):
			return await sendMessage( await getTextResponse( __API.HITOKOTO ) );
		case /诗/.test( msg ):
			return await sendMessage( await getTextResponse( __API.POETRY ) );
		case /舔狗/.test( msg ):
			return await sendMessage( await getTextResponse( __API.DOGS ) );
		default:
			//调用API回复
			return enable ? await sendMessage( await getChatResponse( msg ) )
				: await sendMessage( { content: "找我有何贵干？", image: getEmoji() } );
	}
}