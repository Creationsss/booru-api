export const environment: Environment = {
	port: Number.parseInt(process.env.PORT || "6600", 10),
	host: process.env.HOST || "0.0.0.0",
	development:
		process.env.NODE_ENV === "development" || process.argv.includes("--dev"),
};
