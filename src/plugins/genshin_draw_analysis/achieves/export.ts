import moment from "moment";
import { randomSecret } from "@modules/utils";
import { InputParameter } from "@modules/command";
import {
	convert2Lang,
	convert2Readable,
	get_sheet_name,
	getColor
} from "#genshin_draw_analysis/util/util";
import {
	Gacha_Info,
	Standard_Gacha,
	Standard_Gacha_Data,
	Standard_Gacha_Excel,
	Standard_Gacha_Excel_Origin_Data,
	Standard_Gacha_Info
} from "#genshin_draw_analysis/util/types";
import { getPrivateAccount } from "@plugins/genshin/utils/private";
import { Buffer } from "buffer";
import { uploadToAlist } from "@modules/utils/drive";


const gacha_types = [ "301", "400", "302", "100", "200" ];

async function export2JSON( export_data: Standard_Gacha, {
	sendMessage,
	logger,
	config
}: InputParameter ) {
	if ( export_data.list.length === 0 ) {
		await sendMessage( `当前账号${ export_data.info || "" }无历史抽卡数据.` );
		return;
	}
	export_data.list.sort( ( a, b ) => {
		const n1 = BigInt( a.id || "0" );
		const n2 = BigInt( b.id || "0" );
		if ( n1 > n2 ) {
			return 1;
		} else if ( n1 === n2 ) {
			return 0;
		} else {
			return -1;
		}
	} )
	const json = JSON.stringify( export_data );
	const file_name = `UIGF-${ export_data.info.uid }-${ moment( export_data.info.export_timestamp * 1000 ).format( "yyMMDDHHmmss" ) }.json`;
	const buffer = Buffer.from( json );
	//上传JSON文件,上传到 Alist
	try {
		const result = await uploadToAlist( "/WishAbout/Export", file_name, buffer );
		if ( result.code === 200 ) {
			await sendMessage( `上传云存储成功，获取地址为:\n` +
				`${ config.alistDrive.baseUrl }${ config.alistDrive.baseDir }/WishAbout/Export/${ file_name }` );
			return sendMessage( "如文件不显示，请点击右下角刷新按钮刷新缓存即可" );
		}
		logger.error( "抽卡记录导出成功，上传云存储失败！", result );
		await sendMessage( "抽卡记录导出成功，上传云存储失败！\n" + result.message );
		return;
	} catch ( error ) {
		logger.error( "抽卡记录导出成功，上传 Alist 失败！", error );
		await sendMessage( `文件导出成功，上传云存储失败，请前往官频反馈该问题。` );
	}
}


async function addRowAndSetStyle( sheet, data: Standard_Gacha_Excel ) {
	const row = sheet.addRow( data );
	row.eachCell( { includeEmpty: true }, cell => {
		cell.alignment = {
			horizontal: 'center',
			vertical: 'middle'
		}
		cell.font = {
			color: { argb: getColor( data.rank_type ) },
			bold: data.rank_type === "5"
		}
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'ffebebeb' }
		}
		cell.border = {
			top: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			left: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			bottom: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			right: { style: 'thin', color: { argb: 'ffc4c2bf' } }
		}
	} );
	row.commit();
}

function setHeaderStyle( headers: string[], sheet ) {
	headers.forEach( ( value, index ) => {
		const cell = sheet.getCell( 1, index + 1 );
		cell.border = {
			top: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			left: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			bottom: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			right: { style: 'thin', color: { argb: 'ffc4c2bf' } }
		}
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'ffdbd7d3' },
		}
		cell.font = {
			color: { argb: "ff757575" },
			bold: true
		}
		cell.alignment = {
			horizontal: 'center',
			vertical: 'middle'
		}
	} );
}

async function export2Excel( {
	                             info: { uid, lang, export_timestamp },
	                             list
                             }: Standard_Gacha, {
	                             sendMessage,
	                             config,
	                             logger,
                             }: InputParameter ) {
	if ( list.length === 0 ) {
		await sendMessage( `当前账号${ uid || "" }无历史抽卡数据.` );
		return;
	}
	// 按照 ID 升序排列
	list = list.sort( ( a, b ) => {
		const n1 = BigInt( a.id || "0" );
		const n2 = BigInt( b.id || "0" );
		if ( n1 > n2 ) {
			return 1;
		} else if ( n1 === n2 ) {
			return 0;
		} else {
			return -1;
		}
	} )
	const gacha_csv_objects: Standard_Gacha_Excel[] = list.map( ( {
		                                                              time,
		                                                              name,
		                                                              gacha_type,
		                                                              rank_type,
		                                                              item_type
	                                                              } ) => ( {
		time,
		name,
		item_type,
		rank_type,
		gacha_type
	} ) );
	const ExcelJS = require( 'exceljs' );
	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'adachi-gbot';
	workbook.lastModifiedBy = 'adachi-gbot';
	workbook.created = new Date();
	workbook.modified = new Date();
	
	
	const sheet_names: string[] = gacha_types.filter( value => value !== '400' );
	for ( let type of sheet_names ) {
		const sheet = workbook.addWorksheet( get_sheet_name( type ), {
			views: [ {
				state: 'frozen',
				ySplit: 1,
				zoomScale: 260
			} ]
		} );
		let width = [ 24, 14, 8, 8, 20 ]
		if ( !lang.includes( 'zh-' ) ) {
			width = [ 24, 32, 16, 12, 24 ]
		}
		const headers = Object.keys( gacha_csv_objects[0] );
		sheet.columns = headers.map( ( key, index ) => {
			return {
				header: convert2Lang( key, lang ),
				key,
				width: width[index]
			}
		} );
		setHeaderStyle( headers, sheet );
		const filter_gacha_data: Standard_Gacha_Excel[] = gacha_csv_objects.filter( ( { gacha_type } ) => {
			return type === '301' && gacha_type === '400' ? true : gacha_type === type;
		} );
		
		for ( let data of filter_gacha_data ) {
			data.gacha_type = convert2Readable( data.gacha_type, lang );
			await addRowAndSetStyle( sheet, data );
		}
		// 设置保护模式，避免用户随意修改内容
		await sheet.protect( randomSecret( 20 ), {
			formatCells: true,
			formatRows: true,
			formatColumns: true,
			sort: true,
			autoFilter: true,
			pivotTables: true
		} );
	}
	
	// 添加一个原始数据的表
	const sheet = workbook.addWorksheet( "原始数据", {
		views: [ {
			state: 'frozen',
			ySplit: 1,
			zoomScale: 260
		} ]
	} );
	let width = [ 24, 18, 8, 12, 12, 12, 8, 24, 20, 12, 18 ]
	if ( !lang.includes( 'zh-' ) ) {
		width = [ 24, 24, 8, 12, 12, 12, 8, 24, 20, 12, 18 ]
	}
	const origin_data_list: Standard_Gacha_Excel_Origin_Data[] = list.map( ( data: Standard_Gacha_Data ) => {
		return {
			...data,
			lang,
			uid
		}
	} );
	const headers = Object.keys( origin_data_list[0] );
	sheet.columns = headers.map( ( key, index ) => {
		return {
			header: key,
			key,
			width: width[index]
		}
	} );
	setHeaderStyle( headers, sheet );
	for ( const data of origin_data_list ) {
		await addRowAndSetStyle( sheet, data );
	}
	// 设置保护模式，避免用户随意修改内容
	await sheet.protect( randomSecret( 20 ), {
		formatCells: true,
		formatRows: true,
		formatColumns: true,
		sort: true,
		autoFilter: true,
		pivotTables: true
	} );
	
	const file_name = `UIGF-${ uid }-${ moment( export_timestamp * 1000 ).format( "yyMMDDHHmmss" ) }.xlsx`;
	const buffer = workbook.xlsx.writeBuffer();
	//发送Excel文件，上传到 OSS
	try {
		const result = await uploadToAlist( "/WishAbout/Export", file_name, buffer );
		if ( result.code === 200 ) {
			await sendMessage( `上传Alist成功，获取地址为:
			${ config.alistDrive.baseUrl }${ config.alistDrive.baseDir }/WishAbout/Export/${ file_name }` );
			return sendMessage( "如文件不显示，请点击右下角刷新按钮刷新缓存即可" );
		}
		logger.error( "抽卡记录导出成功，上传 Alist 失败！", result );
		await sendMessage( "抽卡记录导出成功，上传 Alist 失败！\n" + result.message );
	} catch ( error ) {
		logger.error( "抽卡记录导出成功，上传 Alist 失败！", error );
		await sendMessage( `文件导出成功，上传云存储失败，请前往官频反馈该问题。` );
	}
}

export async function main( i: InputParameter ): Promise<void> {
	const { sendMessage, messageData, redis, logger } = i;
	const userID = messageData.msg.author.id;
	const raw_message = messageData.msg.content;
	const reg = new RegExp( /(?<sn>\d+)?(\s)*(?<fileType>(json|excel))?/ );
	const res: RegExpExecArray | null = reg.exec( raw_message );
	const fileType: string = res?.groups?.fileType || "";
	const sn: string = res?.groups?.sn || "1";
	
	const account = await getPrivateAccount( userID, sn );
	if ( typeof account === "string" ) {
		await sendMessage( account );
		return;
	}
	const uid = account.setting.uid;
	
	const gacha_data_list: Standard_Gacha_Data[] = [];
	// 获取存储的抽卡记录数据
	let lang: string = "zh-cn";
	for ( let gacha_type of gacha_types ) {
		const gacha_data_map: Record<string, string> = await redis.getHash( `genshin_draw_analysis.data-${ gacha_type }-${ uid }` );
		const gacha_data_strings: string[] = Object.values( gacha_data_map );
		for ( let gacha_data_str of gacha_data_strings ) {
			const gacha_data: Gacha_Info = JSON.parse( gacha_data_str );
			lang = gacha_data.lang;
			const export_gacha_data: Standard_Gacha_Data = {
				id: gacha_data.id,
				name: gacha_data.name,
				item_id: gacha_data.item_id,
				item_type: gacha_data.item_type,
				rank_type: gacha_data.rank_type,
				gacha_type: gacha_data.gacha_type,
				count: gacha_data.count,
				time: gacha_data.time,
				uigf_gacha_type: gacha_data.gacha_type === "400" ? "301" : gacha_data.gacha_type
			};
			gacha_data_list.push( export_gacha_data );
		}
	}
	
	const info: Standard_Gacha_Info = {
		uid,
		lang,
		export_app: '一碗牛杂',
		export_app_version: '1.0.0',
		export_time: moment().format( "yy-MM-DD HH:mm:ss" ),
		export_timestamp: Date.now() / 1000 | 0,
		uigf_version: 'v2.2'
	}
	const export_data: Standard_Gacha = {
		info,
		list: gacha_data_list
	}
	
	if ( fileType === 'json' ) {
		await export2JSON( export_data, i );
	} else if ( fileType === 'excel' ) {
		await export2Excel( export_data, i );
	} else {
		const url = await redis.getString( `genshin_draw_analysis.url-${ uid }` );
		if ( url ) {
			const QRCode = require( "qrcode" );
			const options = {
				errorCorrectionLevel: 'H',
				margin: 1,
				color: {
					dark: '#000',
					light: '#FFF',
				}
			}
			QRCode.toDataURL( url, options, async ( err: any, image: string ) => {
				if ( err || !image ) {
					logger.error( "二维码生成失败：", err );
					await sendMessage( `二维码生成失败：${ err }` );
					return;
				}
				//发送二维码
				image = image.replace( "data:image/png;base64,", "" );
				await sendMessage( { content: "请扫描二维码获取链接，可用于其他软件分析统计", file_image: image } );
			} );
		} else {
			await sendMessage( "链接已经过期，请重新使用抽卡分析指令获取" );
		}
	}
}