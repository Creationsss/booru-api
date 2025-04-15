import { determineBooru, getE621Auth, getGelBooruAuth } from "@helpers/char";
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

	let url = `https://${booruConfig.autocomplete}${editedTag}`;

	if (isGelbooru && gelbooruAuth) {
		url += `?api_key=${gelbooruAuth.api_key}&user_id=${gelbooruAuth.user_id}`;
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
