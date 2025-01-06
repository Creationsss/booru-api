import { redisConfig } from "@config/environment";
import { logger } from "@helpers/logger";
import { createClient, type RedisClientType } from "redis";

class RedisJson {
	private static instance: RedisJson | null = null;
	private client: RedisClientType | null = null;

	private constructor() {}

	public static async initialize(): Promise<RedisJson> {
		if (!RedisJson.instance) {
			RedisJson.instance = new RedisJson();
			RedisJson.instance.client = createClient({
				socket: {
					host: redisConfig.host,
					port: redisConfig.port,
				},
				username: redisConfig.username || undefined,
				password: redisConfig.password || undefined,
			});

			RedisJson.instance.client.on("error", (err: Error) => {
				logger.error("Redis connection error:");
				logger.error((err as Error) || "Unknown error");
				logger.error(redisConfig.host);
				process.exit(1);
			});

			RedisJson.instance.client.on("connect", () => {
				logger.info([
					"Connected to Redis on",
					`${redisConfig.host}:${redisConfig.port}`,
				]);
			});

			await RedisJson.instance.client.connect();
		}

		return RedisJson.instance;
	}

	public static getInstance(): RedisJson {
		if (!RedisJson.instance || !RedisJson.instance.client) {
			throw new Error(
				"Redis instance not initialized. Call initialize() first.",
			);
		}
		return RedisJson.instance;
	}

	public async disconnect(): Promise<void> {
		if (!this.client) {
			logger.error("Redis client is not initialized.");
			process.exit(1);
		}
		try {
			await this.client.disconnect();
			this.client = null;
			logger.info("Redis disconnected successfully.");
		} catch (error) {
			logger.error("Error disconnecting Redis client:");
			logger.error(error as Error);
			throw error;
		}
	}

	public async get(
		type: "JSON" | "STRING",
		key: string,
		path?: string,
	): Promise<
		string | number | boolean | Record<string, unknown> | null | unknown
	> {
		if (!this.client) {
			logger.error("Redis client is not initialized.");
			throw new Error("Redis client is not initialized.");
		}
		try {
			if (type === "JSON") {
				const value: unknown = await this.client.json.get(key, {
					path,
				});

				if (value instanceof Date) {
					return value.toISOString();
				}

				return value;
			} else if (type === "STRING") {
				const value: string | null = await this.client.get(key);
				return value;
			} else {
				throw new Error(`Invalid type: ${type}`);
			}
		} catch (error) {
			logger.error(`Error getting value from Redis for key: ${key}`);
			logger.error(error as Error);
			throw error;
		}
	}

	public async set(
		type: "JSON" | "STRING",
		key: string,
		value: unknown,
		expiresInSeconds?: number,
		path?: string,
	): Promise<void> {
		if (!this.client) {
			logger.error("Redis client is not initialized.");
			throw new Error("Redis client is not initialized.");
		}
		try {
			if (type === "JSON") {
				await this.client.json.set(key, path || "$", value as string);

				if (expiresInSeconds) {
					await this.client.expire(key, expiresInSeconds);
				}
			} else if (type === "STRING") {
				if (expiresInSeconds) {
					await this.client.set(key, value as string, {
						EX: expiresInSeconds,
					});
				} else {
					await this.client.set(key, value as string);
				}
			} else {
				throw new Error(`Invalid type: ${type}`);
			}
		} catch (error) {
			logger.error(`Error setting value in Redis for key: ${key}`);
			logger.error(error as Error);
			throw error;
		}
	}

	public async delete(type: "JSON" | "STRING", key: string): Promise<void> {
		if (!this.client) {
			logger.error("Redis client is not initialized.");
			throw new Error("Redis client is not initialized.");
		}
		try {
			if (type === "JSON") {
				await this.client.json.del(key);
			} else if (type === "STRING") {
				await this.client.del(key);
			} else {
				throw new Error(`Invalid type: ${type}`);
			}
		} catch (error) {
			logger.error(`Error deleting value from Redis for key: ${key}`);
			logger.error(error as Error);
			throw error;
		}
	}

	public async expire(key: string, seconds: number): Promise<void> {
		if (!this.client) {
			logger.error("Redis client is not initialized.");
			throw new Error("Redis client is not initialized.");
		}
		try {
			await this.client.expire(key, seconds);
		} catch (error) {
			logger.error(`Error expiring key in Redis: ${key}`);
			logger.error(error as Error);
			throw error;
		}
	}
}

export const redis: {
	initialize: () => Promise<RedisJson>;
	getInstance: () => RedisJson;
} = {
	initialize: RedisJson.initialize,
	getInstance: RedisJson.getInstance,
};

export { RedisJson };
