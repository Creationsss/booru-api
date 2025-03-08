// cSpell:disable

import { getE621Auth } from "./environment";

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
		autocomplete: "ac.rule34.xxx/autocomplete.php?q=",
	},
	"realbooru.com": {
		enabled: false,
		name: "realbooru.com",
		aliases: ["realbooru", "rb", "real34", "realb"],
		endpoint: "realbooru.com",
		functions: booruDefaults,
		autocomplete: "realbooru.com/index.php?page=autocomplete&term=",
	},
	"safebooru.org": {
		enabled: true,
		name: "safebooru.org",
		aliases: ["safebooru", "sb", "s34"],
		endpoint: "safebooru.org",
		functions: booruDefaults,
		autocomplete: "safebooru.org/autocomplete.php?q=",
	},
	"tbib.org": {
		enabled: true,
		name: "tbib.org",
		aliases: ["tbib", "tb", "tbiborg"],
		endpoint: "tbib.org",
		functions: booruDefaults,
		autocomplete: "tbib.org/autocomplete.php?q=",
	},
	"hypnohub.net": {
		enabled: true,
		name: "hypnohub.net",
		aliases: ["hypnohub", "hh", "hypnohubnet"],
		endpoint: "hypnohub.net",
		functions: booruDefaults,
		autocomplete: "hypnohub.net/autocomplete.php?q=",
	},
	"xbooru.com": {
		enabled: true,
		name: "xbooru.com",
		aliases: ["xbooru", "xb", "xboorucom"],
		endpoint: "xbooru.com",
		functions: booruDefaults,
		autocomplete: "xbooru.com/autocomplete.php?q=",
	},
	"e621.net": {
		enabled: true,
		name: "e621.net",
		aliases: ["e621", "e6", "e621net"],
		endpoint: "e621.net",
		autocomplete: "e621.net/tags/autocomplete.json?search[name_matches]=",
		functions: {
			search: "posts.json",
			random: "defaultRandom",
			id: ["posts/", ".json"],
		},
		auth: getE621Auth(),
	},
};
