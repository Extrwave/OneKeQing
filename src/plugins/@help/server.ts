import bot from "ROOT";
import express from "express";
import { Logger } from "log4js";
import { __RedisKey } from "@modules/redis";

const HelpRoute = express.Router().get( "/", async ( req, res ) => {
	const data = await bot.redis.getString( __RedisKey.HELP_DATA );
	res.send( JSON.parse( data ) );
} )

export function createServer( port: number, logger: Logger ): void {
	const app = express();
	app.use( express.static( __dirname ) );
	app.use( "/api/help", HelpRoute );
	app.listen( port, () => {
		logger.debug( `[ @help ] 插件 Express 服务已在端口启动: ${ port }` );
	} );
}