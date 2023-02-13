/**
 * @interface
 * 米游社绑定数据
 * @list 通行证绑定的 miHoYo 游戏
 * */
export interface BBS {
	type: "bbs";
	list: Game[];
}

/**
 * @interface
 * 绑定游戏数据
 * @hasRole 角色是否存在
 * @gameId 游戏编号
 * @gameRoleId 游戏内 ID
 * @nickname 游戏内昵称
 * @region 服务器代号
 * @regionName 服务器名
 * @level 游戏等级
 * @backgroundImage 背景图
 * @isPublic 数据是否公开
 * @url 数据 API URL
 * @data 游戏数据
 * @dataSwitches 选择数据
 * */
export interface Game {
	hadRole: boolean;
	gameId: number;
	gameRoleId: string;
	nickname: string;
	region: string;
	regionName: string;
	level: number;
	backgroundImage: string;
	isPublic: boolean;
	url: string;
	data: Data[];
	dataSwitches: DataSwitch[];
}

export interface Data {
	name: string;
	type: number;
	value: string;
}

export interface DataSwitch {
	switchId: number;
	isPublic: boolean;
	switchName: string;
}

/**
 * @interface
 * 版块详细数据
 * @id 版块ID
 * @name 中文名
 * @en_name 英文名
 * @app_icon 版块图标
 * @icon 略缩图
 * @search_trend_word 搜索关键词
 * @level_image
 * @topic_num
 * @op_name
 * @main_color
 * @has_wiki
 */
export interface BBSGameItem {
	id: number,
	name: string,
	en_name: string,
	app_icon: string,
	icon: string,
	search_trend_word: string,
	level_image: string,
	level_text_color: string,
	topic_num: number,
	op_name: string,
	main_color: string,
	has_wiki: boolean
}