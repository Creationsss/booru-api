import type { Server } from "bun";

declare global {
	type BunServer = Server;
}
