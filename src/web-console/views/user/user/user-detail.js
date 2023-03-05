const template = `<el-dialog v-model="showModal" custom-class="user-detail-dialog no-header" @closed="closeModal" draggable>
	<div class="dialog-body user-detail">
		<div class="section-info">
			<p class="title">信息面板</p>
			<div class="user-base-info">
				<img class="avatar" :src="userInfo.avatar" alt="ERROR" draggable="false" />
				<div class="public-info">
					<p class="user-id">
						<span class="label">用户账号</span>
						<span>{{ userInfo.userID }}</span>
					</p>
					<p class="nickname">
						<span class="label">用户昵称</span>
						<span>{{ userInfo.nickname }}</span>
					</p>
					<p class="nickname">
						<span class="label">权限等级</span>
						<span>具体频道查看</span>
					</p>
				</div>
			</div>
		</div>
		<div class="section-info">
			<p class="title">指令使用分布</p>
			<el-scrollbar class="group-info" wrap-class="scrollbar-wrapper">
				<p v-for="(el, elKey) in userInfo.groupInfoList" :key="elKey">{{ getUsedInfo(el) }}</p>
			</el-scrollbar>
		</div>
		<div class="section-info">
			<p class="title">订阅列表</p>
			<el-scrollbar class="sub-info" wrap-class="scrollbar-wrapper">
				<ul class="sub-list">
					<template v-if="userInfo.subInfo?.length" >
						<li v-for="(s, sKey) of userInfo.subInfo" :key="sKey">{{ s }}</li>
					</template>
					<li class="sub-empty" v-else>该用户暂未使用订阅服务</li>
				</ul>
			</el-scrollbar>
		</div>
	</div>
</el-dialog>`;

import $http from "../../../api/index.js";
import { formatRole } from "../../../utils/format.js";

const { defineComponent, reactive, toRefs, watch } = Vue;
const { ElMessage } = ElementPlus;

export default defineComponent( {
	name: "UserDetail", template, emits: [ "reloadData", "closeDialog" ], props: {
		userInfo: {
			type: Object, default: () => ( {} )
		}, authLevel: {
			type: Array, default: () => []
		}, cmdKeys: {
			type: Array, default: () => []
		}
	}, setup( props, { emit } ) {
		const state = reactive( {
			management: {
				auth: 0, limits: []
			}, current: {
				currentKey: "", currentGuild: ""
			}, keyStatus: 0, showModal: false
		} );
		
		/* 获得地区分布展示内容 */
		function getUsedInfo( el ) {
			if ( typeof el === "string" ) {
				return el;
			}
			return `频道 ${ el.guild_name } - [${ formatRole( el.auth )?.label }] ${ el.nickname }`;
		}
		
		function openModal() {
			state.showModal = true;
		}
		
		function closeModal() {
			emit( "closeDialog" );
		}
		
		return {
			...toRefs( state ),
			getUsedInfo,
			openModal,
			closeModal
		};
	}
} );