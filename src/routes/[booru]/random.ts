import {
	determineBooru,
	minPosts,
	postExpectedFormat,
	shufflePosts,
	tagsToExpectedFormat,
} from "@helpers/char";
import { fetch } from "bun";

import { redis } from "@/database/redis";
import { logger } from "@/helpers/logger";

const routeDef: RouteDef = {
	method: "POST",
	accepts: "*/*",
	returns: "application/json",
	needsBody: "json",
};

async function handler(
	_request: Request,
	_server: BunServer,
	requestBody: unknown,
	query: Query,
	params: Params,
): Promise<Response> {
	const { force } = query as { force: string };
	const { booru } = params as { booru: string };
	const {
		tags,
		results = 5,
		excludeTags,
		tag_format = "formatted",
	} = requestBody as {
		tags: string[];
		results: number;
		excludeTags: string[];
		tag_format: string;
	};

	if (!booru) {
		return Response.json(
			{
				success: false,
				code: 400,
				error: "Missing booru",
			},
			{
				status: 400,
			},
		);
	}

	if (tags && !(typeof tags === "string" || Array.isArray(tags))) {
		return Response.json(
			{
				success: false,
				code: 400,
				error: "Invalid tags, must be a string or array of strings",
			},
			{
				status: 400,
			},
		);
	}

	if (
		excludeTags &&
		!(typeof excludeTags === "string" || Array.isArray(excludeTags))
	) {
		return Response.json(
			{
				success: false,
				code: 400,
				error: "Invalid excludeTags, must be a string or array of strings",
			},
			{
				status: 400,
			},
		);
	}

	if (results && (typeof results !== "number" || results <= 0)) {
		return Response.json(
			{
				success: false,
				code: 400,
				error: "Invalid results, must be a number greater than 0",
			},
			{
				status: 400,
			},
		);
	}

	const booruConfig: IBooruConfig | null = determineBooru(booru);

	if (!booruConfig) {
		return Response.json(
			{
				success: false,
				code: 404,
				error: "Booru not found",
			},
			{
				status: 404,
			},
		);
	}

	if (!booruConfig.enabled) {
		return Response.json(
			{
				success: false,
				code: 403,
				error: "Booru is disabled",
			},
			{
				status: 403,
			},
		);
	}

	const isE621: boolean = booruConfig.name === "e621.net";

	const formattedTags: string = tags ? tagsToExpectedFormat(tags) : "";
	const formattedExcludeTags: string = excludeTags
		? tagsToExpectedFormat(excludeTags, true, isE621)
		: "";

	const tagsString: () => string = (): string => {
		if (formattedTags && formattedExcludeTags) {
			return `tags=${formattedTags}+-${formattedExcludeTags}`;
		} else if (formattedTags) {
			return `tags=${formattedTags}`;
		} else if (formattedExcludeTags) {
			return `tags=-${formattedExcludeTags}`;
		}

		return "";
	};

	const pageString: (page: string | number) => string = (
		page: string | number,
	): string => {
		if (isE621) {
			return `page=${page}`;
		}
		return `pid=${page}`;
	};

	const resultsString: string = `limit=${isE621 ? 320 : 1000}`;

	const getUrl: (pageString: string, resultsString: string) => string = (
		page: string,
		resultsString: string,
	): string => {
		const parts: string[] = [
			`https://${booruConfig.endpoint}/${booruConfig.functions.search}`,
		];

		if (isE621) {
			parts.push("?");
		} else {
			parts.push("&");
		}

		const queryParams: string = [tagsString(), page, resultsString]
			.filter(Boolean)
			.join("&");
		parts.push(queryParams);

		return parts.join("");
	};

	const noResultsCacheKey: string = `nsfw:${booru}:random:noResults:${tagsString()}`;

	if (!force) {
		const cacheData: unknown = await redis
			.getInstance()
			.get("JSON", noResultsCacheKey);

		if (cacheData) {
			return Response.json(
				{
					success: false,
					code: 404,
					cache: true,
					error: "No posts found with the given tags",
				},
				{
					status: 404,
				},
			);
		}
	}

	const config: { maxPage: number; maxTries: number } = {
		maxPage: 12,
		maxTries: 6,
	};
	let state: { tries: number; page: number } = { tries: 0, page: 16 };

	while (state.tries < config.maxTries) {
		const cacheKey: string = `nsfw:${booru}:random:tag_format(${tag_format}):${tagsString()}:${results}:${state.page}`;
		if (!force) {
			const cacheData: unknown = await redis
				.getInstance()
				.get("JSON", cacheKey);

			if (cacheData) {
				const minimizedPosts: BooruPost[] = minPosts(
					(cacheData as { posts: BooruPost[] }).posts,
					results,
				);

				const shuffledPosts: BooruPost[] = shufflePosts(minimizedPosts);

				return Response.json(
					{
						success: true,
						code: 200,
						cache: true,
						posts: shuffledPosts,
					},
					{
						status: 200,
					},
				);
			}
		}

		const url: string = getUrl(pageString(state.page), resultsString);

		try {
			const headers: IBooruConfig["auth"] | undefined = booruConfig.auth
				? booruConfig.auth
				: undefined;
			const response: Response = await fetch(url, {
				headers,
			});

			if (!response.ok) {
				return Response.json(
					{
						success: false,
						code: response.status || 500,
						error:
							response.statusText ||
							`Could not reach ${booruConfig.name}`,
					},
					{
						status: response.status || 500,
					},
				);
			}

			const data: unknown = await response.json();

			if (!data) {
				return Response.json(
					{
						success: false,
						code: 500,
						error: `No data returned from ${booruConfig.name}`,
					},
					{
						status: 500,
					},
				);
			}

			const parsedData: Data = data as Data;

			let posts: BooruPost[] = [];
			if (booruConfig.name === "realbooru.com") {
				posts = parsedData.post || [];
			} else {
				if (parsedData.post) {
					posts = [parsedData.post];
				} else if (parsedData.posts) {
					posts = parsedData.posts;
				} else {
					posts = Array.isArray(data) ? (data as BooruPost[]) : [];
				}
			}

			if (posts.length === 0) continue;

			let expectedData: { posts: BooruPost[] } | null =
				postExpectedFormat(booruConfig, posts, tag_format);

			if (!expectedData) continue;

			expectedData.posts = minPosts(expectedData.posts, results);
			expectedData.posts = shufflePosts(expectedData.posts);

			await redis
				.getInstance()
				.set("JSON", cacheKey, expectedData, 60 * 60 * 1); // 1 hours

			return Response.json(
				{
					success: true,
					code: 200,
					cache: false,
					posts: expectedData.posts,
				},
				{
					status: 200,
				},
			);
		} catch {
			continue;
		} finally {
			state.tries++;

			if (state.tries >= config.maxTries - 1) {
				state.page = 0;
			} else {
				const oldPage: number = state.page;
				do {
					state.page = Math.floor(Math.random() * config.maxPage);
				} while (state.page === oldPage);
			}
		}
	}

	await redis.getInstance().set("JSON", noResultsCacheKey, true, 60 * 10); // 10 minutes

	logger.error([
		"No posts found",
		`Booru: ${booru}`,
		`Tags: ${tagsString()}`,
		`Exclude tags: ${formattedExcludeTags}`,
		`Tries: ${state.tries}`,
	]);

	return Response.json(
		{
			success: false,
			code: 404,
			error: "No posts found with the given tags",
		},
		{
			status: 404,
		},
	);
}

export { handler, routeDef };
