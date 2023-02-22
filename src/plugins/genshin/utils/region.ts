/**
 * @1|2 官服
 * @5 B服
 * @6 美服
 * @7 欧服
 * @8 亚服
 * @9 港澳服
 * @param first
 */
export function getRegion( first: string ): string {
	switch ( first ) {
		case "1":
			return "cn_gf01";
		case "2":
			return "cn_gf01";
		case "5":
			return "cn_qd01";
		default:
			return "unknown";
	}
}

/**
 * 获取游戏分区的ForumId
 *
 * @param gids 分区ID
 */
export function getBBSItemForumIds( gids: number ) {
	switch ( gids ) {
		case 1:
			return [ 1, 14, 6, 4, 41, ];
		case 2:
			return [ 26, 43, 28, 29, 49, 50, ];
		case 3:
			return [ 30, 51, 31, 40, 32 ];
		case 5:
			return [ 54, 35, 34, 39, 47, 48, 55, 36 ]
		case 4:
			return [ 37, 60, 42, 38, 33 ];
		case 6:
			return [ 52, 61, 53, 56 ];
		case 8:
			return [ 57, 58, 59, ];
		default:
			return [ 26, 43, 28, 29, 49, 50, ];
	}
}