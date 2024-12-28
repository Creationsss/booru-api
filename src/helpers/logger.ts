import { environment } from "@config/environment";
import type { Stats } from "fs";
import {
	createWriteStream,
	existsSync,
	mkdirSync,
	statSync,
	WriteStream,
} from "fs";
import { EOL } from "os";
import { basename, join } from "path";

import { timestampToReadable } from "./char";

class Logger {
	private static instance: Logger;
	private static log: string = join(__dirname, "../../logs");

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}

		return Logger.instance;
	}

	private writeToLog(logMessage: string): void {
		if (environment.development) return;

		const date: Date = new Date();
		const logDir: string = Logger.log;
		const logFile: string = join(
			logDir,
			`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.log`,
		);

		if (!existsSync(logDir)) {
			mkdirSync(logDir, { recursive: true });
		}

		let addSeparator: boolean = false;

		if (existsSync(logFile)) {
			const fileStats: Stats = statSync(logFile);
			if (fileStats.size > 0) {
				const lastModified: Date = new Date(fileStats.mtime);
				if (
					lastModified.getFullYear() === date.getFullYear() &&
					lastModified.getMonth() === date.getMonth() &&
					lastModified.getDate() === date.getDate() &&
					lastModified.getHours() !== date.getHours()
				) {
					addSeparator = true;
				}
			}
		}

		const stream: WriteStream = createWriteStream(logFile, { flags: "a" });

		if (addSeparator) {
			stream.write(`${EOL}${date.toISOString()}${EOL}`);
		}

		stream.write(`${logMessage}${EOL}`);
		stream.close();
	}

	private extractFileName(stack: string): string {
		const stackLines: string[] = stack.split("\n");
		let callerFile: string = "";

		for (let i: number = 2; i < stackLines.length; i++) {
			const line: string = stackLines[i].trim();
			if (line && !line.includes("Logger.") && line.includes("(")) {
				callerFile = line.split("(")[1]?.split(")")[0] || "";
				break;
			}
		}

		return basename(callerFile);
	}

	private getCallerInfo(stack: unknown): {
		filename: string;
		timestamp: string;
	} {
		const filename: string =
			typeof stack === "string" ? this.extractFileName(stack) : "unknown";

		const readableTimestamp: string = timestampToReadable();

		return { filename, timestamp: readableTimestamp };
	}

	public info(message: string | string[], breakLine: boolean = false): void {
		const stack: string = new Error().stack || "";
		const { filename, timestamp } = this.getCallerInfo(stack);

		const joinedMessage: string = Array.isArray(message)
			? message.join(" ")
			: message;

		const logMessageParts: ILogMessageParts = {
			readableTimestamp: { value: timestamp, color: "90" },
			level: { value: "[INFO]", color: "32" },
			filename: { value: `(${filename})`, color: "36" },
			message: { value: joinedMessage, color: "0" },
		};

		this.writeToLog(`${timestamp} [INFO] (${filename}) ${joinedMessage}`);
		this.writeConsoleMessageColored(logMessageParts, breakLine);
	}

	public warn(message: string | string[], breakLine: boolean = false): void {
		const stack: string = new Error().stack || "";
		const { filename, timestamp } = this.getCallerInfo(stack);

		const joinedMessage: string = Array.isArray(message)
			? message.join(" ")
			: message;

		const logMessageParts: ILogMessageParts = {
			readableTimestamp: { value: timestamp, color: "90" },
			level: { value: "[WARN]", color: "33" },
			filename: { value: `(${filename})`, color: "36" },
			message: { value: joinedMessage, color: "0" },
		};

		this.writeToLog(`${timestamp} [WARN] (${filename}) ${joinedMessage}`);
		this.writeConsoleMessageColored(logMessageParts, breakLine);
	}

	public error(
		message: string | string[] | Error | Error[],
		breakLine: boolean = false,
	): void {
		const stack: string = new Error().stack || "";
		const { filename, timestamp } = this.getCallerInfo(stack);

		const messages: (string | Error)[] = Array.isArray(message)
			? message
			: [message];
		const joinedMessage: string = messages
			.map((msg: string | Error): string =>
				typeof msg === "string" ? msg : msg.message,
			)
			.join(" ");

		const logMessageParts: ILogMessageParts = {
			readableTimestamp: { value: timestamp, color: "90" },
			level: { value: "[ERROR]", color: "31" },
			filename: { value: `(${filename})`, color: "36" },
			message: { value: joinedMessage, color: "0" },
		};

		this.writeToLog(`${timestamp} [ERROR] (${filename}) ${joinedMessage}`);
		this.writeConsoleMessageColored(logMessageParts, breakLine);
	}

	private writeConsoleMessageColored(
		logMessageParts: ILogMessageParts,
		breakLine: boolean = false,
	): void {
		const logMessage: string = Object.keys(logMessageParts)
			.map((key: string) => {
				const part: ILogMessagePart = logMessageParts[key];
				return `\x1b[${part.color}m${part.value}\x1b[0m`;
			})
			.join(" ");
		console.log(logMessage + (breakLine ? EOL : ""));
	}
}

const logger: Logger = Logger.getInstance();
export { logger };
