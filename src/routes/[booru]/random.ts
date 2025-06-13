import { echo } from "@atums/echo";
import { type Server, fetch } from "bun";
import {
	determineBooru,
	getE621Auth,
	getGelBooruAuth,
	minPosts,
	postExpectedFormat,
	shufflePosts,
	tagsToExpectedFormat,
} from "#lib/char";

import type { BooruPost, Data } from "#types/booruResponses";
import type { ExtendedRequest } from "#types/bun";
import type { IBooruConfig } from "#types/config";
import type { RouteDef } from "#types/routes";

const routeDef: RouteDef = {
	method: "POST",
	accepts: "*/*",
	returns: "application/json",
	needsBody: "json",
};

async function handler(
	request: ExtendedRequest,
	_server: Server,
	requestBody: unknown,
): Promise<Response> {
	const { booru } = request.params as { booru: string };
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
	const isGelbooru: boolean = booruConfig.name === "gelbooru.com";
	const gelbooruAuth: Record<string, string> | null = getGelBooruAuth(
		request.headers,
	);

	if (isGelbooru && !gelbooruAuth) {
		return Response.json(
			{
				success: false,
				code: 401,
				error: "Missing Gelbooru authentication headers",
			},
			{
				status: 401,
			},
		);
	}

	const formattedTags: string = tags ? tagsToExpectedFormat(tags) : "";
	const formattedExcludeTags: string = excludeTags
		? tagsToExpectedFormat(excludeTags, true, isE621)
		: "";

	const tagsString: () => string = (): string => {
		if (formattedTags && formattedExcludeTags) {
			return `tags=${formattedTags}+-${formattedExcludeTags}`;
		}
		if (formattedTags) {
			return `tags=${formattedTags}`;
		}
		if (formattedExcludeTags) {
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

		if (
			isGelbooru &&
			gelbooruAuth &&
			gelbooruAuth.apiKey &&
			gelbooruAuth.userId
		) {
			parts.push("api_key");
			parts.push(gelbooruAuth.apiKey);
			parts.push("&");
			parts.push("user_id");
			parts.push(gelbooruAuth.userId);
			parts.push("&");
		}

		const queryParams: string = [tagsString(), page, resultsString]
			.filter(Boolean)
			.join("&");
		parts.push(queryParams);

		return parts.join("");
	};

	const config: { maxPage: number; maxTries: number } = {
		maxPage: 12,
		maxTries: 6,
	};
	const state: { tries: number; page: number } = { tries: 0, page: 16 };

	while (state.tries < config.maxTries) {
		const url: string = getUrl(pageString(state.page), resultsString);

		try {
			let headers: Record<string, string> = {};

			if (isE621) {
				const e621Auth: Record<string, string> | null = getE621Auth(
					request.headers,
				);

				if (!e621Auth) {
					return Response.json(
						{
							success: false,
							code: 401,
							error: "Missing E621 authentication headers",
						},
						{
							status: 401,
						},
					);
				}

				headers = {
					...e621Auth,
				};
			}

			const response: Response = await fetch(url, {
				headers,
			});

			if (!response.ok) {
				return Response.json(
					{
						success: false,
						code: response.status || 500,
						error: response.statusText || `Could not reach ${booruConfig.name}`,
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
			if (booruConfig.name === "realbooru.com" || isGelbooru) {
				if (parsedData.post) {
					posts = Array.isArray(parsedData.post)
						? parsedData.post
						: [parsedData.post];
				}
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

			const expectedData: { posts: BooruPost[] } | null = postExpectedFormat(
				booruConfig,
				posts,
				tag_format,
			);

			if (!expectedData) continue;

			expectedData.posts = shufflePosts(expectedData.posts);
			expectedData.posts = minPosts(expectedData.posts, results);

			return Response.json(
				{
					success: true,
					code: 200,
					posts: expectedData.posts,
				},
				{
					status: 200,
				},
			);
		} catch {
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

	echo.error([
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
