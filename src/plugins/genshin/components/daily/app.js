const template = `<div class="daily-app">
	<Header :week="week" :show-event="showEvent" :user="user" />
	<Material v-if="showMaterial" :data="data" />
	<Event :show-event="showEvent" :show-material="showMaterial" :events="data.event" />
</div>`;

import { parseURL, request } from "../../public/js/src.js";
import Header from "./header.js";
import Material from "./material.js";
import Event from "./event.js";

const { defineComponent, computed } = Vue;

export default defineComponent( {
	name: "DailyApp",
	template,
	components: {
		Header,
		Material,
		Event
	},
	setup() {
		const urlParams = parseURL( location.search );
		const id = urlParams.id;
		const user = decodeURI( urlParams.username );
		const data = request( `/api/daily?id=${ id }` );
		
		const week = urlParams.week;
		
		const objHasValue = params => {
			if ( !data[params] || typeof data[params] !== "object" ) return false;
			return Object.keys( data[params] ).length !== 0;
		}
		
		/* 是否显示素材（素材空） */
		const showMaterial = computed( () => objHasValue( "character" ) || objHasValue( "weapon" ) );
		
		/* 是否显示活动日历 */
		const showEvent = computed( () => week === "today" && data?.event.length !== 0 );
		
		return {
			data,
			week,
			user,
			showMaterial,
			showEvent
		};
	}
} );
