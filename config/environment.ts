export const environment: Environment = {
	port: 6600,
	host: "127.0.0.1",
	development:
		process.argv.includes("--dev") ||
		process.argv.includes("--development"),
};
