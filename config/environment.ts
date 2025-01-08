import { logger } from "@/helpers/logger";

export const environment: Environment = {
	port: parseInt(process.env.PORT || "6600", 10),
	host: process.env.HOST || "0.0.0.0",
	development:
		process.env.NODE_ENV === "development" ||
		process.argv.includes("--dev"),
};

export const redisConfig: RedisConfig = {
	host: process.env.REDIS_HOST || "dragonfly-redis",
	port: parseInt(process.env.REDIS_PORT || "6379", 10),
	password: process.env.REDIS_PASSWORD || undefined,
};

if (
	!process.env.E621_USER_AGENT ||
	!process.env.E621_USERNAME ||
	!process.env.E621_API_KEY
) {
	logger.error("Missing e621 credentials in .env file");
} else {
	if (
		process.env.E621_USERNAME === "username" ||
		process.env.E621_API_KEY === "apikey"
	) {
		logger.error("Please update your e621 credentials in the .env file");
	}
}

export function getE621Auth(): Record<string, string> {
	const e621UserAgent: string | undefined = process.env.E621_USER_AGENT;
	const e621Username: string | undefined = process.env.E621_USERNAME;
	const e621ApiKey: string | undefined = process.env.E621_API_KEY;

	return {
		"User-Agent": e621UserAgent || "",
		Authorization:
			"Basic " + btoa(`${e621Username || ""}:${e621ApiKey || ""}`),
	};
}
