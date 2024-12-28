import { booruConfig } from "@config/booru";

function timestampToReadable(timestamp?: number): string {
	const date: Date =
		timestamp && !isNaN(timestamp) ? new Date(timestamp) : new Date();
	if (isNaN(date.getTime())) return "Invalid Date";
	return date.toISOString().replace("T", " ").replace("Z", "");
}

function tagsToExpectedFormat(
	tags: string[] | string | Record<string, string[]>,
	minus: boolean = false,
	onlyMinus: boolean = false,
): string {
	const delimiter: string = minus ? (onlyMinus ? "-" : "+-") : "+";

	if (!tags) return "";

	const processTag: (tag: string) => string | null = (tag: string) => {
		const trimmed: string | null = tag.trim();
		return trimmed ? trimmed : null;
	};

	if (typeof tags === "string") {
		return tags
			.split(/\s+|,/)
			.map(processTag)
			.filter((tag: string | null): tag is string => Boolean(tag))
			.join(delimiter);
	}

	if (Array.isArray(tags)) {
		return tags
			.map(processTag)
			.filter((tag: string | null): tag is string => Boolean(tag))
			.join(delimiter);
	}

	const allTags: string[] = Object.values(tags).flat();
	return allTags
		.map(processTag)
		.filter((tag: string | null): tag is string => Boolean(tag))
		.join(delimiter);
}

function determineBooru(
	booruName: string,
): IBooruConfigMap[keyof IBooruConfigMap] | null {
	const booru: IBooruConfigMap[keyof IBooruConfigMap] | undefined =
		Object.values(booruConfig).find(
			(booru: IBooruConfigMap[keyof IBooruConfigMap]) =>
				booru.name === booruName ||
				booru.aliases.includes(booruName.toLowerCase()),
		);

	return booru || null;
}

export { determineBooru, tagsToExpectedFormat, timestampToReadable };
