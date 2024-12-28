type RouteDef = {
	method: string;
	accepts: string | null;
	returns: string;
	needsBody?: "multipart" | "json";
};

type Query = Record<string, string>;
type Params = Record<string, string>;

type RouteModule = {
	handler: (
		request: Request,
		server: BunServer,
		requestBody: unknown,
		query: Query,
		params: Params,
	) => Promise<Response> | Response;
	routeDef: RouteDef;
};
