import { Logger } from "log4js";
import MariPluginConfig from "./module/config";
import express from "express";
import * as r from "./routes"

export function createServer( config: MariPluginConfig, logger: Logger ): void {
	const app = express();
	app.use( express.static( __dirname ) );
	
	app.use( "/api/chara", r.CharaRouter );
	
	app.listen( config.serverPort, () => {
		logger.info( "[ mari-plugin ] 插件 Express 服务已在端口启动: " + config.serverPort );
	} );
}