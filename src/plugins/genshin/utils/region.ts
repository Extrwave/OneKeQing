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