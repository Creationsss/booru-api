import { logger } from "@helpers/logger";

import { serverHandler } from "./server";

async function main(): Promise<void> {
	serverHandler.initialize();
}

main().catch((error: Error) => {
	logger.error("Error initializing the server:");
	logger.error(error as Error);
	process.exit(1);
});
