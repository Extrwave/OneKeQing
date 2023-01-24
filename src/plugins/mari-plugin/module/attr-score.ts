import { ArtAttr, Artifact, Avatar } from "#mari-plugin/types";

/**
Author: Extrwave
CreateTime: 2023/1/24
 */

export function getAttrScore( attrs: ArtAttr[] ): number {
	let score = 0;
	attrs.forEach( value => {
		if ( value.attr === "暴击率" ) {
			score += parseFloat( value.value.replace( "%", "" ) ) * 2;
		} else if ( value.attr === "暴击伤害" ) {
			score += parseFloat( value.value.replace( "%", "" ) );
		}
	} );
	return score;
}