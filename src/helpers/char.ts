/* eslint-disable prettier/prettier */

import { booruConfig } from "@config/booru";

export function timestampToReadable(timestamp?: number): string {
	const date: Date =
		timestamp && !isNaN(timestamp) ? new Date(timestamp) : new Date();
	if (isNaN(date.getTime())) return "Invalid Date";
	return date.toISOString().replace("T", " ").replace("Z", "");
}

export function tagsToExpectedFormat(
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

export function shufflePosts<BooruPost>(posts: BooruPost[]): BooruPost[] {
	for (let i: number = posts.length - 1; i > 0; i--) {
		const j: number = Math.floor(Math.random() * (i + 1));
		[posts[i], posts[j]] = [posts[j], posts[i]];
	}
	return posts;
}

export function minPosts<BooruPost>(
	posts: BooruPost[],
	min: number,
): BooruPost[] {
	return posts.slice(0, min);
}

export function determineBooru(
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

export function postExpectedFormat(
	booru: IBooruConfig,
	posts: BooruPost[] | BooruPost,
	tag_format: string = "string",
): { posts: BooruPost[] } | null {
	if (!posts) return null;

	const normalizedPosts: BooruPost[] = Array.isArray(posts) ? posts : [posts];
	if (normalizedPosts.length === 0) return null;

	if (booru.name === "e621.net") {
		return {
			posts: normalizedPosts.map((post: BooruPost) => {
				return {
					...post,
					file_url: post.file.url ?? null,
					post_url:
						post.post_url ??
						`https://${booru.endpoint}/posts/${post.id}`,
					tags:
						tag_format === "unformatted"
							? post.tags
							: Object.values(post.tags || {})
								.flat()
								.join(" "),
				};
			}),
		};
	}

	const fixedDomain: string = booru.endpoint.replace(/^api\./, "");
	const formattedPosts: BooruPost[] = normalizedPosts.map(
		(post: BooruPost) => {
			const postUrl: string =
				post.post_url ??
				`https://${fixedDomain}/index.php?page=post&s=view&id=${post.id}`;
			const imageExtension: string =
				post.image?.substring(post.image.lastIndexOf(".") + 1) ?? "";
			const fileUrl: string | null =
				post.file_url ??
				(post.directory && post.hash && imageExtension
					? `https://${booru.endpoint}/images/${post.directory}/${post.hash}.${imageExtension}`
					: null);

			return {
				...post,
				file_url: fileUrl,
				post_url: postUrl,
			};
		},
	);

	return { posts: formattedPosts };
}
