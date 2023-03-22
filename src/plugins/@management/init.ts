import { AuthLevel } from "@modules/management/auth";
import { OrderConfig, SwitchConfig } from "@modules/command";
import { PluginSetting } from "@modules/plugin";


const refresh: OrderConfig = {
	type: "order",
	cmdKey: "adachi-hot-update-config",
	desc: [ "重载配置", "" ],
	headers: [ "refresh" ],
	regexps: [],
	auth: AuthLevel.Master,
	main: "refresh",
	detail: "该指令用于重新加载在 /config 目录中的部分配置文件（setting 不会重新加载）"
}

const announce: OrderConfig = {
	type: "order",
	cmdKey: "adachi-announce",
	desc: [ "发送公告", "(内容)" ],
	headers: [ "sanno" ],
	regexps: [ "(.+\\s?)*" ],
	auth: AuthLevel.Master,
	main: "anno",
	detail: "该指令用于全局发送公告"
}

const callMaster: OrderConfig = {
	type: "order",
	cmdKey: "adachi-leave-message-call",
	desc: [ "反馈", "(内容)" ],
	headers: [ "call" ],
	regexps: [ "(.+\\s?)*" ],
	main: "call",
	detail: "通过BOT与机器人开发者联系 ~ "
}

const replyUser: OrderConfig = {
	type: "order",
	cmdKey: "adachi-leave-message-reply",
	desc: [ "回复", "(内容)" ],
	headers: [ "reply" ],
	regexps: [ "(.+\\s?)*" ],
	auth: AuthLevel.Master,
	main: "reply",
	detail: "回复用户的留言信息 ~ "
}

const setUseChannel: SwitchConfig = {
	type: "switch",
	mode: "divided",
	cmdKey: "adachi-set-use-channel",
	desc: [ "专属频道", "(#子频道)" ],
	header: "channel",
	regexp: [ "(#.+)?" ],
	onKey: "添加子频道",
	offKey: "移除子频道",
	auth: AuthLevel.GuildManager,
	main: "channel",
	detail: "设置BOT专属可用子频道，即不会再其他地方响应指令\n" +
		"并在非专属区域做出提示，引导前往专属子频道\n" +
		"on 设置专属子频道 off 取消专属子频道"
}

const cancelUseChannel: OrderConfig = {
	type: "order",
	cmdKey: "adachi-cancel-use-channel",
	desc: [ "取消专属频道", "" ],
	headers: [ "uchannel" ],
	regexps: [],
	main: "channel",
	auth: AuthLevel.GuildOwner,
	detail: "该操作会使BOT取消所有专属子频道限制 ~ "
}

const upgrade: OrderConfig = {
	type: "order",
	cmdKey: "adachi-hot-update",
	desc: [ "更新", "(-f)" ],
	headers: [ "update" ],
	regexps: [ "(-f)?" ],
	auth: AuthLevel.Master,
	main: "update",
	detail: "该指令用于检测并更新 bot 源码\n" +
		"要求项目必须是通过 git clone 下载的且不能为 win-start 启动\n" +
		"若存在更新则会更新并重启 bot\n" +
		"在指令后追加 -f 来覆盖本地修改强制更新"
}

const restart: OrderConfig = {
	type: "order",
	cmdKey: "adachi-restart",
	desc: [ "重启", "" ],
	headers: [ "restart" ],
	regexps: [],
	auth: AuthLevel.Master,
	main: "restart",
	detail: "用于重启 bot，使用win-start方式启动服务无法使用该指令"
}

const deleteKey: OrderConfig = {
	type: "order",
	cmdKey: "adachi-delete-key",
	desc: [ "删除数据", "[Key]" ],
	headers: [ "del_key" ],
	regexps: [ ".+" ],
	auth: AuthLevel.Master,
	main: "del-key",
	display: false,
	detail: "用于数据存储更新后，按需删除旧数据"
}


export async function init(): Promise<PluginSetting> {
	return {
		pluginEName: "@management",
		pluginCName: "管理",
		cfgList: [
			announce, upgrade, callMaster, replyUser,
			setUseChannel, cancelUseChannel,
			restart, refresh, deleteKey
		]
	}
}