import { escapeRegExp } from "lodash";
import { BasicConfig, CommandInfo, Unmatch } from "./main";

export interface OrderMatchResult {
	type: "order";
	header: string;
}

export type OrderConfig = CommandInfo & {
	type: "order";
	headers: string[];
	regexps: string[] | string[][];
	start?: boolean;
	stop?: boolean;
};

interface RegPair {
	header: string;
	genRegExps: RegExp[];
}

export class Order extends BasicConfig {
	public readonly type = "order";
	public readonly regPairs: RegPair[] = [];
	public readonly regParam: string[][];
	
	
	constructor( config: OrderConfig, pluginName: string ) {
		super( config, pluginName );
		
		const headers: string[] = config.headers.map( el => Order.header( el ) );
		if ( this.desc[0].length > 0 ) {
			headers.push( Order.header( this.desc[0] ) ); //添加中文指令名作为识别
		}
		
		let rawRegs = <string[][]>config.regexps;
		const isDeep: boolean = config.regexps.some( el => el instanceof Array );
		if ( !isDeep ) {
			rawRegs = [ <string[]>config.regexps ];
		}
		this.regParam = rawRegs;
		
		for ( let header of headers ) {
			const pair: RegPair = { header, genRegExps: [] };
			for ( let reg of rawRegs ) {
				const r: string = [ "", ...reg ].join( "\\s*?" );
				const h: string = escapeRegExp( header );
				const pattern: string = Order.addStartStopChar(
					h + r,
					config.start !== false,
					config.stop !== false
				);
				pair.genRegExps.push( Order.regexp( pattern, this.ignoreCase ) );
			}
			this.regPairs.push( pair );
		}
	}
	
	public static read( cfg: OrderConfig, loaded ) {
		cfg.headers = loaded.headers;
		cfg.auth = loaded.auth;
		cfg.scope = loaded.scope;
	}
	
	public write() {
		const cfg = <OrderConfig>this.raw;
		return {
			type: "order",
			auth: this.auth,
			scope: this.scope,
			headers: cfg.headers,
			enable: true
		};
	}
	
	public match( content: string ): OrderMatchResult | Unmatch {
		try {
			this.regPairs.forEach( pair => pair.genRegExps.forEach( reg => {
				if ( reg.test( content ) ) {
					throw { type: "order", header: pair.header };
				} else if ( new RegExp( pair.header ).test( content ) ) {
					content = content.replace( pair.header, "" );
					for ( let params of this.regParam ) {
						params = [ pair.header, ...params ];
						const paramReg = new RegExp( `^${ params.join( "\\s*?" ) }$` );
						const matchParam = paramReg.test( pair.header + content );
						if ( matchParam ) {
							throw { type: "order", header: pair.header };
						}
					}
				}
			} ) );
		} catch ( data ) {
			return <OrderMatchResult>data;
		}
		return { type: "unmatch" };
	}
	
	public getFollow(): string {
		const pairs = this.regPairs.concat();
		if ( pairs[pairs.length - 1].header === Order.header( this.desc[0] ) ) {
			pairs.pop();
		}
		const headers: string = pairs
			.map( el => el.header )
			.join( "|" );
		const param = this.desc[1];
		return `${ headers } ${ param }`;
	}
	
	public getDesc(): string {
		const follow = this.getFollow();
		return Order.addLineFeedChar(
			this.desc[0], follow
		);
	}
	
	public getHeaders(): string[] {
		return this.regPairs.map( el => el.header );
	}
	
	/* 获取中文指令头 */
	public getCNHeader(): string {
		return this.desc[0];
	}
	
	public getParams(): string {
		return this.desc[1];
	}
	
	/* 获取中文指令帮助 */
	public getCNDesc(): string {
		return `${ this.getCNHeader() } ${ this.getParams() }`;
	}
}