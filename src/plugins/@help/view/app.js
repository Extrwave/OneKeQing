const template = `<div class="help">
	<header>
		<div :style="topImageStyle" class="top-bg"/>
		<div class="left-header">
			<p>一碗牛杂</p>
			<p>{{ model === "keys" ? "指令key值表" : "使用文档" }}</p>
			<p v-if="data.detailCmd" class="desc">使用 {{ data.detailCmd }} + 指令序号 查看更多信息</p>
			<p class="desc">[ ] 表示必填<br/>( ) 表示选填<br/>&nbsp;| &nbsp;表示选择</p>
		</div>
		<div class="right-header">
			<p class="version">官方频道：&nbsp; 枫叶丹</p>
			<img src="https://cdn.ethreal.cn/img/1675409783562-1675409784.png" alt="枫叶丹官频">
		</div>
	</header>
	<main>
		<section v-for="(commands, pluginName) in data.commands" :key="pluginName" class="cmd-list">
			<h3>{{ getListTitle(pluginName) }}</h3>
			<ul>
				<li v-for="cmd of commands" :key="cmd.id" class="cmd-content clearfix">
					<p class="cmd-index">
						<span>{{ cmd.id }}</span>
					</p>
					<p class="cmd-header">{{ cmd.header }}</p>
					<p class="cmd-desc">{{ model === "keys" ? cmd.cmdKey : cmd.body }}</p>
				</li>
			</ul>
		</section>
	</main>
	<footer>
		<p class="sign">频道BOT:&nbsp;&nbsp;一碗牛杂</p>
	</footer>
</div>`

import { request, parseURL } from "../../public/js/src.js";

const { defineComponent } = Vue;

export default defineComponent( {
	name: "HelpApp",
	template,
	setup() {
		const urlParams = parseURL( location.search );
		const data = request( `/api/help` );
		
		const model = urlParams.model;
		
		const pluginNameMap = {
			"@help": "帮助指令",
			"@management": "管理指令",
		}
		
		const getListTitle = pluginName => pluginNameMap[pluginName] || `${ pluginName } 插件指令`;
		
		const topImageStyle = {
			position: "absolute",
			left: 0,
			top: 0,
			width: "100%",
			height: "100%",
			backgroundSize: "cover",
			backgroundImage: `linear-gradient(to top, #f3f4f7, transparent), url(${ data.bg })`
		};
		
		
		return {
			data,
			model,
			getListTitle,
			topImageStyle
		};
	}
} )