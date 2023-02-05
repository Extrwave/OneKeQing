import express from "express";
import bot from "ROOT";
import { Md5 } from 'md5-typescript'
import { getToken } from "@web-console/backend/jwt";

export default express.Router().post( "/", ( req, res ) => {
	const num = <string>req.body.num;
	const pwd = req.body.pwd;
	
	if ( bot.setting.webConsole.adminName === num &&
		( pwd === bot.setting.webConsole.adminPwd || pwd === Md5.init( bot.setting.webConsole.adminPwd ) )
	) {
		res.status( 200 ).send( {
			token: getToken(
				bot.setting.webConsole.jwtSecret, parseInt( bot.setting.appID )
			)
		} );
	} else {
		res.status( 401 ).send( { msg: "Number or password is incorrect" } );
	}
} );