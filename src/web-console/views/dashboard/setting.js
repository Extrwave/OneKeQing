const template = `<div class="table-container config">
	<el-alert title="该页内容修改完毕后续重启BOT才能生效" type="warning" show-icon />
	<el-form :model="setting" class="config-form" @submit.prevent>
		<div class="config-section">
			<section-title title="基本设置" />
			
			<form-item label="沙箱环境" desc="沙箱环境只会收到测试频道的事件，且调用openapi仅能操作测试频道">
				<el-switch v-model="setting.sandbox" :disabled="pageLoading" @change="updateConfig('sandbox')" />
			</form-item>
			
			<form-item label="BOT类型">
				<el-radio-group v-model="setting.area" :disabled="pageLoading" @change="updateConfig('area')" >
					<el-radio v-for="(a, aKey) of areaList" :key="aKey" :label="a.value">{{ a.label }}</el-radio>
				</el-radio-group>
			</form-item>
			
			
			<spread-form-item
				v-model="setting.appID"
				:active-spread="activeSpread"
				:disabled="pageLoading"
				label="BotAppID"
				placeholder="请输入AppID"
				type="number"
				@change="updateConfig('appID')"
				@open="activeSpreadItem"
			/>
			<spread-form-item
				v-model="setting.token"
				:active-spread="activeSpread"
				:disabled="pageLoading"
				label="机器人令牌"
				placeholder="请输入Token"
				verifyReg=".+"
				type="password"
				verifyMsg="该项为必填项"
				@change="updateConfig('token')"
				@open="activeSpreadItem"
			/>
			

			
			<spread-form-item
				v-model="setting.master"
				:active-spread="activeSpread"
				:disabled="pageLoading"
				label="BOT主人ID"
				placeholder="请输入BOT主人ID"
				verifyReg=".+"
				verifyMsg="该项为必填项"
				@change="updateConfig('master')"
				@open="activeSpreadItem"
			/>
			<form-item label="日志输出等级" desc="等级从上往下依次递减，日志输出会过滤掉比所设置等级更高的等级日志">
				<el-select v-model="setting.logLevel" placeholder="日志等级" @change="updateConfig('logLevel')">
					<el-option v-for="(l, lKey) of logLevel" :key="lKey" :label="l" :value="l"/>
				</el-select>
			</form-item>
		</div>
		<div class="config-section">
		<section-title title="指令设置" />
			<form-item label="帮助信息样式" desc="指令help响应信息所展示的样式。（ark私域可用，公域需要申请）">
				<el-radio-group v-model="setting.helpMessageStyle" :disabled="pageLoading" @change="updateConfig('helpMessageStyle')" >
					<el-radio v-for="(h, hKey) of helpStyleList" :key="hKey" :label="h.value">{{ h.label }}</el-radio>
				</el-radio-group>
			</form-item>
			<spread-form-item
				v-model="setting.helpPort"
				:active-spread="activeSpread"
				:disabled="pageLoading"
				label="图片帮助端口"
				type="number"
				desc="帮助信息样式为 card 时有效，除非端口冲突否则不需要改动。"
				@change="updateConfig('helpPort')"
				@open="activeSpreadItem"
			/>
		</div>
		<div class="config-section">
			<section-title title="数据库设置" />
			<spread-form-item
				v-model="setting.dbPort"
				:active-spread="activeSpread"
				:disabled="pageLoading"
				label="数据库端口"
				type="number"
				desc="Docker 启动修改此值时，需将 redis.conf 中的 port 修改为与此处相同的值。"
				@change="updateConfig('dbPort')"
				@open="activeSpreadItem"
			/>
			<spread-form-item
				v-model="setting.dbPassword"
				:active-spread="activeSpread"
				:disabled="pageLoading"
				label="数据库密码"
				type="password"
				placeholder="请输入数据库密码"
				desc="非必填项，看个人需求设置。"
				@change="updateConfig('dbPassword')"
				@open="activeSpreadItem"
			/>
		</div>
		<div class="config-section">
			<section-title title="网页控制台相关" />
			<form-item label="启用控制台" desc="开启后即可通过公网ip+页面端口访问本系统。">
				<el-switch v-model="setting.webConsole.enable" :disabled="pageLoading" @change="updateConfig('webConsole.enable')" />
			</form-item>
			<template v-if="setting.webConsole.enable">
				<spread-form-item
					v-model="setting.webConsole.consolePort"
					:active-spread="activeSpread"
					:disabled="pageLoading"
					label="网页页面端口"
					type="number"
					desc="Docker启动修改此值时，需将 docker-compose.yml 中的 services.bot.ports 的第二个数字修改为与此处相同的值。"
					@change="updateConfig('webConsole.consolePort')"
					@open="activeSpreadItem"
				/>
				<spread-form-item
					v-model="setting.webConsole.tcpLoggerPort"
					:active-spread="activeSpread"
					:disabled="pageLoading"
					label="日志输出端口"
					type="number"
					@change="updateConfig('webConsole.tcpLoggerPort')"
					@open="activeSpreadItem"
				/>
				<spread-form-item
					v-model="setting.webConsole.logHighWaterMark"
					:active-spread="activeSpread"
					:disabled="pageLoading"
					label="读日志数据量"
					type="number"
					desc="控制日志单次读取的数据量，单位 kb，不填或置 0 时默认 64，越大读取越快，内存占用越大，反之同理。"
					@change="updateConfig('webConsole.logHighWaterMark')"
					@open="activeSpreadItem"
				/>
				<spread-form-item
					v-model="setting.webConsole.jwtSecret"
					:active-spread="activeSpread"
					:disabled="pageLoading"
					label="JWT验证秘钥"
					type="password"
					placeholder="请输入密钥"
					desc="非登陆密码，开启网页控制台时必填且不要泄露， 可以随意输入长度为 6~16 的仅由字母和数字组成的字符串。"
					verifyReg="[0-9a-zA-Z]{6,16}"
					verifyMsg="要求长度为 6~16，仅由字母和数字组成"
					@change="updateConfig('webConsole.jwtSecret')"
					@open="activeSpreadItem"
				/>
			</template>
		</div>
	</el-form>
</div>`;

import $http from "../../api/index.js";
import FormItem from "../../components/form-item/index.js";
import SpreadFormItem from "../../components/spread-form-item/index.js";
import SectionTitle from "../../components/section-title/index.js";
import { objectGet, objectSet } from "../../utils/utils.js";

const { defineComponent, onMounted, reactive, toRefs } = Vue;
const { ElNotification } = ElementPlus;

export default defineComponent( {
	name: "Setting",
	template,
	components: {
		FormItem,
		SectionTitle,
		SpreadFormItem
	},
	setup() {
		const state = reactive( {
			setting: {
				webConsole: {}
			},
			pageLoading: false,
			activeSpread: ""
		} );
		
		const areaList = [ {
			label: "私域",
			value: "private"
		}, {
			label: "公域",
			value: "public"
		} ];
		const authList = [ "master", "manager", "user" ];
		const helpStyleList = [ {
			label: "文字",
			value: "message"
		}, {
			label: "图片",
			value: "card"
		}, {
			label: "ARK",
			value: "ark"
		} ];
		
		const logLevel = [ "trace", "debug", "info", "warn", "error", "fatal", "mark", "off" ];
		
		function getSettingConfig() {
			state.pageLoading = true;
			$http.CONFIG_GET( { fileName: "setting" }, "GET" ).then( res => {
				state.setting = res.data;
				state.pageLoading = false;
			} ).catch( () => {
				state.pageLoading = false;
			} )
		}
		
		async function updateConfig( field ) {
			state.pageLoading = true;
			const value = objectGet( state.setting, field );
			const data = {};
			objectSet( data, field, value );
			try {
				await $http.CONFIG_SET( { fileName: "setting", data } );
				ElNotification( {
					title: "成功",
					message: "更新成功。",
					type: "success",
					duration: 1000
				} );
				state.pageLoading = false;
			} catch ( error ) {
				state.pageLoading = false;
			}
		}
		
		/* 设置当前正在展开的项目 */
		function activeSpreadItem( index ) {
			state.activeSpread = index;
		}
		
		onMounted( () => {
			getSettingConfig();
		} );
		
		return {
			...toRefs( state ),
			areaList,
			authList,
			helpStyleList,
			logLevel,
			activeSpreadItem,
			updateConfig
		}
	}
} )