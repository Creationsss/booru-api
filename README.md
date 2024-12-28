# booru-api

# default config/secrets file

```ts
const redisConfig: RedisConfig = {
	host: "127.0.0.1",
	port: 6379,
};

const e621Auth: Record<string, string> = {
	"User-Agent": "domain/1.0 (by username on e621)",
	Authorization: "Basic " + btoa("username:password"),
};

export { e621Auth, redisConfig };
```