const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "text/html",
};

async function handler(): Promise<Response> {
	return new Response("Hello, World!", {
		headers: {
			"content-type": "text/html",
		},
	});
}

export { handler, routeDef };
