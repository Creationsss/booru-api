// cSpell:disable

import { e621Auth } from "./secrets";

const booruDefaults: IBooruDefaults = {
	search: "index.php?page=dapi&s=post&q=index&json=1",
	random: "s",
	id: "index.php?page=dapi&s=post&q=index&json=1&id=",
};

export const booruConfig: IBooruConfigMap = {
	"rule34.xxx": {
		enabled: true,
		name: "rule34.xxx",
		aliases: ["rule34", "r34", "rule34xxx"],
		endpoint: "api.rule34.xxx",
		functions: booruDefaults,
	},
	"realbooru.com": {
		enabled: false,
		name: "realbooru.com",
		aliases: ["realbooru", "rb", "real34"],
		endpoint: "realbooru.com",
		functions: booruDefaults,
	},
	"safebooru.org": {
		enabled: true,
		name: "safebooru.org",
		aliases: ["safebooru", "sb", "s34"],
		endpoint: "safebooru.org",
		functions: booruDefaults,
	},
	"tbib.org": {
		enabled: true,
		name: "tbib.org",
		aliases: ["tbib", "tb", "tbiborg"],
		endpoint: "tbib.org",
		functions: booruDefaults,
	},
	"hypnohub.net": {
		enabled: true,
		name: "hypnohub.net",
		aliases: ["hypnohub", "hh", "hypnohubnet"],
		endpoint: "hypnohub.net",
		functions: booruDefaults,
	},
	"xbooru.com": {
		enabled: true,
		name: "xbooru.com",
		aliases: ["xbooru", "xb", "xboorucom"],
		endpoint: "xbooru.com",
		functions: booruDefaults,
	},
	"e621.net": {
		enabled: true,
		name: "e621.net",
		aliases: ["e621", "e6", "e621net"],
		endpoint: "e621.net",
		functions: {
			search: "posts.json",
			random: "defaultRandom",
			id: ["posts/", ".json"],
		},
		auth: {
			...e621Auth,
		},
	},
};
