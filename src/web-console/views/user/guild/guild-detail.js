const template = `<el-dialog v-model="showModal" custom-class="guild-detail-dialog no-header" @closed="closeModal" draggable>
	<div class="dialog-body user-detail">
		<div class="section-info">
			<p class="title">信息面板</p>
			<div class="user-base-info">
				<img class="avatar" :src="guildInfo.guildAvatar" alt="ERROR" draggable="false" />
				<div class="public-info">
					<p class="user-id">
						<span class="label">频道ID</span>
						<span>{{ guildInfo.guildId }}</span>
					</p>
					<p class="nickname">
						<span class="label">频道名字</span>
						<span>{{ guildInfo.guildName }}</span>
					</p>
					<p class="auth">
						<span class="label">权限等级</span>
						<span>{{ authLevel[1]?.label }}</span>
					</p>
					<p class="role">
						<span class="label">频道身份</span>
						<span :style="{ color: role.color }" >{{ role.label }}</span>
					</p>
				</div>
			</div>
		</div>
	</div>
</el-dialog>`;

const { defineComponent, reactive, toRefs } = Vue;
const { ElMessage } = ElementPlus;

export default defineComponent( {
	name: "GuildDetail",
	template,
	emits: [ "reloadData", "closeDialog" ],
	props: {
		guildInfo: {
			type: Object,
			default: () => ( {} )
		},
		authLevel: {
			type: Array,
			default: () => []
		},
	},
	setup( props, { emit } ) {
		const state = reactive( {
			role: {
				label: "未知",
				color: "#999"
			},
			management: {
				auth: 0,
			},
			showModal: false
		} );
		
		function openModal() {
			state.showModal = true;
		}
		
		function closeModal() {
			emit( "closeDialog" );
		}
		
		return {
			...toRefs( state ),
			openModal,
			closeModal
		};
	}
} );