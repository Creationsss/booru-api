import { Echo } from "@atums/echo";
import { serverHandler } from "./server";

export const noFileLog = new Echo({
	disableFile: true,
});

async function main(): Promise<void> {
	serverHandler.initialize();
}

main().catch((error: Error) => {
	noFileLog.error("Error initializing the server:");
	noFileLog.error(error as Error);
	process.exit(1);
});
