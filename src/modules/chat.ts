/**
Author: Ethereal
CreateTime: 2022/6/21
 */

import { IMessage } from "qq-guild-bot";
import * as msg from "@modules/message";
import { Message } from "@modules/utils/message";
import { __API, getChatResponse, getTextResponse } from "@modules/utils/chat-api";
import { ChatConfig } from "@modules/config";


export async function autoReply( messageData: Message, sendMessage: msg.SendFunc, chatConfig: ChatConfig, isAt: boolean ): Promise<IMessage | void> {
	//处理传入的数据
	const content: string = messageData.msg.content;
	
	if ( /Help|教程|帮助|Cookie|Start/i.test( content ) ) {
		const message = "频道 枫叶丹 有视频教程 ~ \n" +
			"基本使用教程：https://drive.ethreal.cn/189Cloud/Markdown/bothelp.md\n" +
			"cookie获取教程: https://drive.ethreal.cn/189Cloud/Markdown/cookies.md\n" +
			"云原神签到教程: https://drive.ethreal.cn/189Cloud/Markdown/yystoken.md";
		return await sendMessage( { content: message, image: "https://img.ethreal.cn/i/2023/03/6417ee5f0c85b.png" } );
	}
	
	if ( chatConfig.emojiOn() && chatConfig.match( content ) ) {
		return await sendMessage( { image: chatConfig.get() } );
	}
	
	switch ( true ) {
		case /渣/.test( content ):
			return await sendMessage( await getTextResponse( __API.LOVELIVE ) );
		case /emo/.test( content ):
			return await sendMessage( await getTextResponse( __API.HITOKOTO ) );
		case /诗/.test( content ):
			return await sendMessage( await getTextResponse( __API.POETRY ) );
		case /舔狗/.test( content ):
			return await sendMessage( await getTextResponse( __API.DOGS ) );
		default:
			//调用API回复
			return chatConfig.chatOn() ? isAt ?
				await sendMessage( await getChatResponse( content ) )
				: undefined : undefined;
	}
	
}