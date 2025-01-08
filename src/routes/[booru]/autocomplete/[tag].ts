import { determineBooru } from "@helpers/char";
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
	const { force } = query as { force: string };
	const { booru, tag } = params as { booru: string; tag: string };

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

	if (!tag) {
		return Response.json(
			{
				success: false,
				code: 400,
				error: "Missing tag",
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

	if (isE621 && tag.length < 3) {
		return Response.json(
			{
				success: false,
				code: 400,
				error: "Tag must be at least 3 characters long for e621",
			},
			{
				status: 400,
			},
		);
	}

	let editedTag: string = tag;
	if (editedTag.startsWith("-")) {
		editedTag = editedTag.slice(1);
	}
	editedTag = editedTag.replace(/\s/g, "_");

	const cacheKey: string = `nsfw:${booru}:autocomplete:${editedTag}`;

	if (!force) {
		const cacheData: unknown = await redis
			.getInstance()
			.get("JSON", cacheKey);

		if (cacheData) {
			const dataAsType: { count: number; data: unknown } = cacheData as {
				count: number;
				data: unknown;
			};

			if (dataAsType.count === 0) {
				return Response.json(
					{
						success: false,
						code: 404,
						error: "No results found",
					},
					{
						status: 404,
					},
				);
			}

			return Response.json(
				{
					success: true,
					code: 200,
					cache: true,
					count: dataAsType.count,
					data: dataAsType.data,
				},
				{
					status: 200,
				},
			);
		}
	}

	if (!booruConfig.autocomplete) {
		return Response.json(
			{
				success: false,
				code: 501,
				error: `${booruConfig.name} does not support autocomplete (yet)`,
			},
			{
				status: 501,
			},
		);
	}

	const url: string = `https://${booruConfig.autocomplete}${editedTag}`;

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
			logger.error([
				"No data returned",
				`Booru: ${booru}`,
				`Tag: ${editedTag}`,
			]);
			return Response.json(
				{
					success: false,
					code: 404,
					error: "No data was returned",
				},
				{
					status: 404,
				},
			);
		}

		const resultCount: number = (data as unknown[]).length;

		if (resultCount === 0) {
			await redis
				.getInstance()
				.set("JSON", cacheKey, { count: 0, data }, 60 * 60 * 2); // 2 hours

			return Response.json(
				{
					success: false,
					code: 404,
					error: "No results found",
				},
				{
					status: 404,
				},
			);
		}

		await redis
			.getInstance()
			.set("JSON", cacheKey, { count: resultCount, data }, 60 * 60 * 24); // 24 hours

		return Response.json(
			{
				success: true,
				code: 200,
				cache: false,
				count: resultCount,
				data,
			},
			{
				status: 200,
			},
		);
	} catch (error) {
		logger.error([
			"Failed to fetch post",
			`Booru: ${booru}`,
			`Tag: ${editedTag}`,
			`Error: ${error}`,
		]);

		return Response.json(
			{
				success: false,
				code: 500,
				error: "Could not reach booru",
			},
			{
				status: 500,
			},
		);
	}
}

export { handler, routeDef };
