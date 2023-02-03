import { InputParameter, SwitchMatchResult } from "@modules/command";
import { dailyClass } from "../init";

export async function main(
	{ sendMessage, messageData, matchResult }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const match = <SwitchMatchResult>matchResult;
	const [ name ] = match.match;
	
	await sendMessage( await dailyClass.modifySubscription(
		userID, match.isOn(), name
	) );
}