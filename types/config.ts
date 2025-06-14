type Environment = {
	port: number;
	host: string;
	development: boolean;
};

type IBooruDefaults = {
	search: string;
	random: string;
	id: string | [string, string];
};

type IBooruConfigMap = {
	[key: string]: {
		enabled: boolean;
		name: string;
		aliases: string[];
		endpoint: string;
		functions: IBooruDefaults;
		autocomplete?: string;
	};
};

type IBooruConfig = {
	enabled: boolean;
	name: string;
	aliases: string[];
	endpoint: string;
	functions: IBooruDefaults;
	autocomplete?: string;
};

export type { Environment, IBooruDefaults, IBooruConfigMap, IBooruConfig };
