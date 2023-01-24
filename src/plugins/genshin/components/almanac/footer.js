const template =
	`<div class="almanac-footer">
	<img class="dire-title" src="../../public/images/almanac/direction.svg" alt="ERROR"/>
	<div class="dire-content">
		<p>面朝{{ d }}玩原神<br/>稀有掉落概率UP</p>
	</div>
	<p class="design">@Designed 可莉特调</p>
	<p class="author">频道BOT:&nbsp;&nbsp;一碗牛杂</p>
</div>`;

const { defineComponent } = Vue;

export default defineComponent( {
	name: "AlmanacFooter",
	template,
	props: {
		d: String
	}
} );