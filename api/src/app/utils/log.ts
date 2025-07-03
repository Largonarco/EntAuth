import axios from "axios";

const BETTER_STACK_TOKEN = "pyeeEcYMDJWTJZWxfurpHyc8";
const BETTER_STACK_URL = "https://in.logs.betterstack.com";

export async function sendLog(message: string, data?: any) {
	try {
		await axios.post(
			BETTER_STACK_URL,
			{
				message,
				server: process.env.API_SERVER,
				...data,
			},
			{
				headers: {
					Authorization: `Bearer ${BETTER_STACK_TOKEN}`,
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		console.error("Failed to send log to Better Stack:", error);
	}
}
