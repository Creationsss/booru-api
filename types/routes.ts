import type { Server } from "bun";

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
		server: Server,
		requestBody: unknown,
	) => Promise<Response> | Response;
	routeDef: RouteDef;
};

export type { RouteDef, Query, Params, RouteModule };
