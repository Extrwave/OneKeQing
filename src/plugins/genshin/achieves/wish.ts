import { InputParameter } from "@modules/command";
import { WishResult, WishTotalSet } from "../module/wish";
import { RenderResult } from "@modules/renderer";
import { wishClass, renderer, config } from "../init";

type WishStatistic = WishResult & {
	count: number;
};

export async function main(
	{ sendMessage, messageData, redis, logger }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const nickname: string = messageData.msg.author.username;
	const param: string = messageData.msg.content;
	
	let choice: string | null = await redis.getString( `silvery-star-wish-choice-${ userID }` );
	
	const wishLimitNum = config.wishLimitNum;
	if ( ( /^\d+$/.test( param ) && parseInt( param ) > wishLimitNum ) ) {
		await sendMessage( `劳逸结合是很不错 ~ \n` + `仅允许使用 ${ wishLimitNum } 次以内的十连抽卡` );
		await sendMessage( "提示: 加上 until 参数可以直接抽到出金为止哦 ~" );
		return;
	}
	
	if ( choice.length === 0 ) {
		choice = "角色"
		await redis.setString( `silvery-star-wish-choice-${ userID }`, "角色" );
		await redis.setHash( `silvery-star-wish-indefinite-${ userID }`, { five: 1, four: 1 } );
		await redis.setHash( `silvery-star-wish-character-${ userID }`, { five: 1, four: 1, isUp: 0 } );
		await redis.setHash( `silvery-star-wish-weapon-${ userID }`, { five: 1, four: 1, isUp: 0, epit: 0 } );
	}
	
	const data: WishTotalSet | null = await wishClass.get( userID, choice, param );
	if ( data === null ) {
		await sendMessage( `${ choice }卡池暂未开放，请在游戏内卡池开放后再尝试` );
		return;
	}
	if ( data.result.filter( el => el.rank >= 4 ).length === 0 ) {
		await sendMessage( "卡池数据获取错误，请联系持有者重启BOT" );
		return;
	}
	
	/* 单次十连 */
	if ( data.total === 10 ) {
		await redis.setString( `silvery-star-wish-result-${ userID }`, JSON.stringify( {
			type: choice,
			data: data.result,
			name: nickname
		} ) );
		const res: RenderResult = await renderer.asBase64(
			"/wish.html",
			{ userId: userID }
		);
		if ( res.code === "base64" ) {
			await sendMessage( { file_image: res.data } );
		} else if ( res.code === "url" ) {
			await sendMessage( { image: res.data } );
		} else {
			await sendMessage( res.data );
		}
		return;
	}
	
	/* 统计抽取的数量 */
	const compressed: WishStatistic[] = data.result
		.filter( el => el.rank >= 4 )
		.reduce( ( pre, cur ) => {
			const find: number = pre.findIndex( el => el.name === cur.name );
			if ( find === -1 ) {
				return [ ...pre, { ...cur, count: 1 } ];
			}
			pre[find].count++;
			return pre;
		}, <WishStatistic[]>[] );
	
	const getSet: ( type: string ) => WishStatistic[] = type => {
		return compressed
			.filter( el => el.type === type )
			.sort( ( x, y ) => {
				return x.rank === y.rank ? y.count - x.count : y.rank - x.rank;
			} );
	};
	
	const charSet = getSet( "角色" );
	const weaponSet = getSet( "武器" );
	
	await redis.setHash( `silvery-star-wish-statistic-${ userID }`, {
		character: JSON.stringify( charSet ),
		weapon: JSON.stringify( weaponSet ),
		total: data.total,
		nickname
	} );
	const res: RenderResult = await renderer.asBase64(
		"/wish-statistic.html",
		{ userId: userID }
	);
	if ( res.code === "base64" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "url" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}