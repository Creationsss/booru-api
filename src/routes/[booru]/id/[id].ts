import { determineBooru, postExpectedFormat } from "@helpers/char";
import { fetch } from "bun";

import { redis } from "@/database/redis";
import { logger } from "@/helpers/logger";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

async function handler(
	_request: Request,
	_server: BunServer,
	_requestBody: unknown,
	query: Query,
	params: Params,
): Promise<Response> {
	const { force, tag_format } = query as {
		force: string;
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
	let url: string = `https://${booruConfig.endpoint}/${booruConfig.functions.id}${id}`;

	if (Array.isArray(funcString)) {
		const [start, end] = funcString;

		url = `https://${booruConfig.endpoint}/${start}${id}${end}`;
	}

	const cacheKey: string = `nsfw:${booru}:tag_format(${tag_format}):${id}`;
	if (!force) {
		const cacheData: unknown = await redis
			.getInstance()
			.get("JSON", cacheKey);

		if (cacheData) {
			return Response.json(
				{
					success: true,
					code: 200,
					cache: true,
					post:
						(cacheData as { posts: BooruPost[] }).posts[0] || null,
				},
				{
					status: 200,
				},
			);
		}
	}

	try {
		const headers: IBooruConfig["auth"] | undefined = booruConfig.auth
			? booruConfig.auth
			: undefined;

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

		await redis.getInstance().set("JSON", cacheKey, expectedData, 60 * 30); // 30 minutes

		return Response.json(
			{
				success: true,
				code: 200,
				cache: false,
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
