import dotenv from "dotenv";

import { logger } from "@/helpers/logger";

try {
	dotenv.config();
} catch {
	logger.error("No .env file found consider creating one");
}

export const environment: Environment = {
	port: parseInt(process.env.PORT || "6600", 10),
	host: process.env.HOST || "0.0.0.0",
	development: process.env.NODE_ENV === "development",
};

export const redisConfig: RedisConfig = {
	host: process.env.REDIS_HOST || "dragonfly-redis",
	port: parseInt(process.env.REDIS_PORT || "6379", 10),
	password: process.env.REDIS_PASSWORD || undefined,
};
