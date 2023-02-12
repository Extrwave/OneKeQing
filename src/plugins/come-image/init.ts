/**
Author: Ethereal
CreateTime: 2022/6/28
 */

import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";

const coser: OrderConfig = {
	type: "order",
	cmdKey: "extr-wave-come-image",
	desc: [ "小姐姐", "(more)" ],
	headers: [ "cos" ],
	regexps: [ "(more)?" ],
	main: "achieves/coser",
	detail: "获取一张老婆图片，参数：\n" +
		"无参数 获取米游社Cos图片\n" +
		"more 获取更多米游社Cos图片缓存"
}

const charer: OrderConfig = {
	type: "order",
	cmdKey: "extr-wave-come-image-charer",
	desc: [ "绘画", "(角色名)" ],
	headers: [ "char" ],
	regexps: [ "([\\w\\u4e00-\\u9fa5]+)?" ],
	main: "achieves/charer"
}


// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
	return {
		pluginEName: "come-image",
		pluginCName: "来点图片",
		cfgList: [ coser, charer ]
	};
}