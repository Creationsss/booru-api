import { booruConfig } from "#environment/constants";

import type { BooruPost } from "#types/booruResponses";
import type { IBooruConfig, IBooruConfigMap } from "#types/config";

export function timestampToReadable(timestamp?: number): string {
	const date: Date =
		timestamp && !Number.isNaN(timestamp)
			? new Date(timestamp * 1000)
			: new Date();
	if (Number.isNaN(date.getTime())) return "Invalid Date";
	return date.toISOString().replace("T", " ").replace("Z", "");
}

export function tagsToExpectedFormat(
	tags: string[] | string | Record<string, string[]>,
	minus = false,
	onlyMinus = false,
): string {
	const delimiter: string = minus ? (onlyMinus ? "-" : "+-") : "+";

	if (!tags) return "";

	const processTag = (tag: string): string | null => {
		const trimmed = tag.trim();
		return trimmed || null;
	};

	if (typeof tags === "string") {
		return tags
			.split(/\s+|,/)
			.map(processTag)
			.filter((tag): tag is string => Boolean(tag))
			.join(delimiter);
	}

	if (Array.isArray(tags)) {
		return tags
			.map(processTag)
			.filter((tag): tag is string => Boolean(tag))
			.join(delimiter);
	}

	const allTags: string[] = Object.values(tags).flat();
	return allTags
		.map(processTag)
		.filter((tag): tag is string => Boolean(tag))
		.join(delimiter);
}

export function shufflePosts<T extends BooruPost>(posts: T[]): T[] {
	if (posts.length <= 1) return posts;

	const shuffled = [...posts];

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const itemI = shuffled[i];
		const itemJ = shuffled[j];

		if (itemI !== undefined && itemJ !== undefined) {
			shuffled[i] = itemJ;
			shuffled[j] = itemI;
		}
	}
	return shuffled;
}

export function minPosts<T extends BooruPost>(posts: T[], min: number): T[] {
	return posts.slice(0, min);
}

export function determineBooru(
	booruName: string,
): IBooruConfigMap[keyof IBooruConfigMap] | null {
	const booru = Object.values(booruConfig).find(
		(booru) =>
			booru.name === booruName ||
			booru.aliases.includes(booruName.toLowerCase()),
	);

	return booru || null;
}

export function postExpectedFormat(
	booru: IBooruConfig,
	posts: BooruPost[] | BooruPost,
	tag_format = "string",
): { posts: BooruPost[] } | null {
	if (!posts) return null;

	const normalizedPosts: BooruPost[] = Array.isArray(posts) ? posts : [posts];
	if (normalizedPosts.length === 0) return null;

	if (booru.name === "e621.net") {
		return {
			posts: normalizedPosts.map((post) => {
				const hasE621Structure =
					"file" in post &&
					post.file &&
					typeof post.file === "object" &&
					"url" in post.file;
				const fileUrl = hasE621Structure ? post.file.url : null;

				return {
					...post,
					file_url: fileUrl ?? null,
					post_url:
						post.post_url ?? `https://${booru.endpoint}/posts/${post.id}`,
					tags:
						tag_format === "unformatted"
							? post.tags
							: typeof post.tags === "object" && post.tags !== null
								? Object.values(post.tags).flat().join(" ")
								: String(post.tags || ""),
				};
			}),
		};
	}

	const fixedDomain: string = booru.endpoint.replace(/^api\./, "");
	const formattedPosts: BooruPost[] = normalizedPosts.map((post) => {
		const postUrl: string =
			post.post_url ??
			`https://${fixedDomain}/index.php?page=post&s=view&id=${post.id}`;

		const hasDefaultStructure =
			"directory" in post && "hash" in post && "image" in post;

		const imageExtension: string =
			hasDefaultStructure && post.image
				? post.image.substring(post.image.lastIndexOf(".") + 1)
				: "";

		const fileUrl: string | null =
			post.file_url ??
			(hasDefaultStructure && post.directory && post.hash && imageExtension
				? `https://${booru.endpoint}/images/${post.directory}/${post.hash}.${imageExtension}`
				: null);

		return {
			...post,
			file_url: fileUrl,
			post_url: postUrl,
		};
	});

	return { posts: formattedPosts };
}

export function getE621Auth(headers: Headers): Record<string, string> | null {
	const userAgent = headers.get("e621UserAgent") ?? "";
	const username = headers.get("e621Username");
	const apiKey = headers.get("e621ApiKey");

	if (!userAgent || !username || !apiKey) return null;

	return {
		"User-Agent": userAgent,
		Authorization: `Basic ${btoa(`${username}:${apiKey}`)}`,
	};
}

export function getGelBooruAuth(
	headers: Headers,
): Record<string, string> | null {
	const apiKey = headers.get("gelbooruApiKey");
	const userId = headers.get("gelbooruUserId");

	if (!apiKey || !userId) return null;

	return {
		apiKey,
		userId,
	};
}
