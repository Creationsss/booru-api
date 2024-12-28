type ILogMessagePart = { value: string; color: string };

type ILogMessageParts = {
	level: ILogMessagePart;
	filename: ILogMessagePart;
	readableTimestamp: ILogMessagePart;
	message: ILogMessagePart;
	[key: string]: ILogMessagePart;
};
