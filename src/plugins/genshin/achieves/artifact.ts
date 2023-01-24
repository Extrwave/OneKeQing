import { InputParameter } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { artClass, renderer } from "../init";

export async function main(
	{ sendMessage, messageData, redis }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const domain: number = messageData.msg.content.length
		? parseInt( messageData.msg.content ) - 1 : -1;
	const reason: string = await artClass.get( userID, domain, redis );
	
	if ( reason !== "" ) {
		await sendMessage( reason );
		return;
	}
	const res: RenderResult = await renderer.asLocalImage(
		"/artifact.html",
		{ userId: userID, type: "init" }
	);
	if ( res.code === "local" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "url" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}