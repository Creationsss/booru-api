import { type Server, fetch } from "bun";
import {
	determineBooru,
	getE621Auth,
	getGelBooruAuth,
	postExpectedFormat,
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
		page = 0,
		tags,
		results = 5,
		excludeTags,
		tag_format = "formatted",
	} = requestBody as {
		page: 0;
		tags: string[] | string;
		results: number;
		excludeTags: string[] | string;
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

	if (results && (typeof results !== "number" || results < 1)) {
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

	const safePage: string | number = Number.isSafeInteger(page) ? page : 0;
	const safeResults: string | number = Number.isSafeInteger(results)
		? results
		: 5;

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

	const pageString: () => string = (): string => {
		if (isE621) {
			return `page=${safePage}`;
		}
		return `pid=${safePage}`;
	};

	const resultsString: string = `limit=${safeResults}`;

	const url: () => string = (): string => {
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

		const queryParams: string = [tagsString(), pageString(), resultsString]
			.filter(Boolean)
			.join("&");
		parts.push(queryParams);

		return parts.join("");
	};

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

		const response: Response = await fetch(url(), {
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
		if (parsedData.post) {
			posts = [parsedData.post];
		} else if (parsedData.posts) {
			posts = parsedData.posts;
		} else {
			posts = Array.isArray(data) ? (data as BooruPost[]) : [];
		}

		if (posts.length === 0) {
			return Response.json(
				{
					success: false,
					code: 404,
					error: "No posts found",
				},
				{
					status: 404,
				},
			);
		}

		const expectedData: { posts: BooruPost[] } | null = postExpectedFormat(
			booruConfig,
			posts,
			tag_format,
		);

		if (!expectedData) {
			return Response.json(
				{
					success: false,
					code: 500,
					error: "Unexpected data format",
				},
				{
					status: 500,
				},
			);
		}

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
	} catch (error) {
		return Response.json(
			{
				success: false,
				code: 500,
				error: (error as Error).message || "Unknown error",
			},
			{
				status: 500,
			},
		);
	}
}

export { handler, routeDef };
