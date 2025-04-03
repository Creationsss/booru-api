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
		auth?: Record<string, string>;
	};
};

type IBooruConfig = {
	enabled: boolean;
	name: string;
	aliases: string[];
	endpoint: string;
	functions: IBooruDefaults;
	autocomplete?: string;
	auth?: Record<string, string>;
};
