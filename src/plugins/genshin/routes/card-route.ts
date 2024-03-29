import express from "express";
import bot from "ROOT";
import { getMemberAvatar } from "@modules/utils/account";
import { getRandomImageUrl } from "@modules/utils/drive";

async function loadMysData( userID: string ): Promise<any> {
	const uid: string = await bot.redis.getString( `silvery-star.user-querying-id-${ userID }` );
	const data: any = await bot.redis.getHash( `silvery-star.card-data-${ uid }` );
	data.homes = JSON.parse( data.homes );
	data.stats = JSON.parse( data.stats );
	data.explorations = JSON.parse( data.explorations );
	data.avatars = JSON.parse( data.avatars );
	data.allHomes = data.allHomes ? JSON.parse( data.allHomes ) : [];
	data.userAvatar = await getMemberAvatar( userID );
	return data;
}

export default express.Router().get( "/", async ( req, res ) => {
	const userID: string = <string>req.query.userId;
	const data: any = await loadMysData( userID );
	res.send( data );
} );