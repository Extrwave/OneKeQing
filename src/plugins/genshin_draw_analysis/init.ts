import bot from "ROOT"
import { BOT } from "@modules/bot";
import { createServer } from "./server";
import { Renderer } from "@modules/renderer";
import { OrderConfig } from "@modules/command";
import { PluginSetting } from "@modules/plugin";
import { execHandle, findFreePort } from "@modules/utils";
import { checkDependencies } from "./util/util";

export let renderer: Renderer;

const draw_analysis_history: OrderConfig = {
	type: "order",
	cmdKey: "genshin-draw-analysis-history",
	desc: [ "抽卡分析历史", "(序号) (样式)" ],
	headers: [ "drawh" ],
	regexps: [ "(\\d+)?", "(\\d+)?" ],
	detail: "使用历史数据分析, 1: phone样式,2: pc样式，如果只传一个参数优先匹配服务序号。",
	main: "achieves/draw_analysis_history"
};

const draw_analysis: OrderConfig = {
	type: "order",
	cmdKey: "genshin-draw-analysis",
	desc: [ "抽卡分析", "(序号) (样式)" ],
	headers: [ "drawa" ],
	detail: "使用授权SToken拉取数据并合并历史数据分析, 1: phone样式,2: pc样式，如果只传一个参数优先匹配服务序号。",
	regexps: [ "(\\d+)?", "(\\d+)?" ],
	main: "achieves/draw_analysis"
};

const export_gacha_log: OrderConfig = {
	type: "order",
	cmdKey: "genshin-draw-analysis-export",
	desc: [ "导出抽卡记录", "(序号) (excel|json)" ],
	headers: [ "export" ],
	regexps: [ "(\\d+)?", "(excel|json)?" ],
	detail: "导出抽卡记录，目前支持导出Excel和Json格式以及链接。",
	main: "achieves/export"
};

const import_gacha_log: OrderConfig = {
	type: "order",
	cmdKey: "genshin-draw-analysis-import",
	desc: [ "导入抽卡记录", "[json|excel] (文件链接)" ],
	headers: [ "import" ],
	regexps: [ "[A-Za-z0-9-]+\\.(json|excel)" ],
	detail: "导入抽卡记录，目前支持json、excel。先发送文件，然后回复这个文件消息，在此消息中使用该指令，也可以给一个文件的下载链接。",
	main: "achieves/import"
};

const del_gacha_log: OrderConfig = {
	type: "order",
	cmdKey: "genshin-draw-analysis-delete",
	desc: [ "清除抽卡记录", "(序号)" ],
	headers: [ "delete" ],
	regexps: [ "(\\d+)?" ],
	detail: "删除抽卡统计历史数据",
	main: "achieves/delete"
};


export async function init( { renderer: botRender }: BOT ): Promise<PluginSetting> {
	
	/* 实例化渲染器 */
	const port: number = await findFreePort( 58693, bot.logger );
	renderer = bot.renderer.register(
		"genshin_draw_analysis", "/views",
		port, "#app"
	);
	createServer( port, bot.logger );
	return {
		pluginEName: "genshin_draw_analysis",
		pluginCName: "抽卡分析",
		cfgList: [ draw_analysis_history, draw_analysis, export_gacha_log, import_gacha_log, del_gacha_log ]
	};
}