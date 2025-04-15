import {
	determineBooru,
	getE621Auth,
	getGelBooruAuth,
	postExpectedFormat,
} from "@helpers/char";
import { fetch } from "bun";

import { logger } from "@helpers/logger";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

async function handler(
	request: Request,
	_server: BunServer,
	_requestBody: unknown,
	query: Query,
	params: Params,
): Promise<Response> {
	const { tag_format } = query as {
		tag_format: string;
	};
	const { booru, id } = params as { booru: string; id: string };

	if (!booru || !id) {
		return Response.json(
			{
				success: false,
				code: 400,
				error: "Missing booru or id",
			},
			{
				status: 400,
			},
		);
	}

	const booruConfig: IBooruConfig | null = determineBooru(booru);
	const isE621: boolean = booruConfig?.name === "e621.net";
	const isGelbooru: boolean = booruConfig?.name === "gelbooru.com";
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

	const funcString: string | [string, string] = booruConfig.functions.id;
	let url = `https://${booruConfig.endpoint}/${booruConfig.functions.id}${id}`;

	if (isGelbooru && gelbooruAuth) {
		url += `?api_key=${gelbooruAuth.api_key}&user_id=${gelbooruAuth.user_id}`;
	}

	if (Array.isArray(funcString)) {
		const [start, end] = funcString;

		url = `https://${booruConfig.endpoint}/${start}${id}${end}`;
	}

	try {
		let headers: Record<string, string> | undefined;

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
			logger.error([
				"Failed to fetch post",
				`Booru: ${booru}`,
				`ID: ${id}`,
				`Status: ${response.status}`,
				`Status Text: ${response.statusText}`,
			]);

			return Response.json(
				{
					success: false,
					code: response.status || 500,
					error: response.statusText || "Could not reach booru",
				},
				{
					status: response.status || 500,
				},
			);
		}

		const data: unknown = await response.json();

		if (!data) {
			logger.error(["No data returned", `Booru: ${booru}`, `ID: ${id}`]);
			return Response.json(
				{
					success: false,
					code: 404,
					error: "Post not found, or no json data was returned",
				},
				{
					status: 404,
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
			logger.error(["No posts found", `Booru: ${booru}`, `ID: ${id}`]);
			return Response.json(
				{
					success: false,
					code: 404,
					error: "Post not found",
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
			logger.error([
				"Unexpected data format",
				`Booru: ${booru}`,
				`ID: ${id}`,
				`Data: ${JSON.stringify(data)}`,
			]);
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
				post: expectedData?.posts[0] || null,
			},
			{
				status: 200,
			},
		);
	} catch {
		return Response.json(
			{
				success: false,
				code: 500,
				error: "Internal Server Error",
			},
			{
				status: 500,
			},
		);
	}
}

export { handler, routeDef };
