import type { RouteDef } from "#types/routes";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

async function handler(): Promise<Response> {
	return Response.json(
		{
			success: true,
			code: 200,
			message:
				"Welcome to the booru API, check the documentation for more information",
			links: {
				forgejo: "https://git.creations.works/creations/booru-api",
				GitHub: "https://github.com/Creationsss/booru-api",
			},
		},
		{
			status: 200,
		},
	);
}

export { handler, routeDef };
