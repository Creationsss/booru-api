import { environment } from "@config/environment";
import { logger } from "@helpers/logger";
import { FileSystemRouter, type MatchedRoute, type Serve } from "bun";

class ServerHandler {
	private router: FileSystemRouter;

	constructor(
		private port: number,
		private host: string,
	) {
		this.router = new FileSystemRouter({
			style: "nextjs",
			dir: "./src/routes",
			origin: `http://${this.host}:${this.port}`,
		});
	}

	public initialize(): void {
		const server: Serve = Bun.serve({
			port: this.port,
			hostname: this.host,
			fetch: this.handleRequest.bind(this),
		});

		logger.info(
			`Server running at http://${server.hostname}:${server.port}`,
			true,
		);

		this.logRoutes();
	}

	private logRoutes(): void {
		logger.info("Available routes:");

		const sortedRoutes: [string, string][] = Object.entries(
			this.router.routes,
		).sort(([pathA]: [string, string], [pathB]: [string, string]) =>
			pathA.localeCompare(pathB),
		);

		for (const [path, filePath] of sortedRoutes) {
			logger.info(`Route: ${path}, File: ${filePath}`);
		}
	}

	private async handleRequest(
		request: Request,
		server: BunServer,
	): Promise<Response> {
		const match: MatchedRoute | null = this.router.match(request);
		let requestBody: unknown = {};
		let response: Response;

		if (match) {
			const { filePath, params, query } = match;

			try {
				const routeModule: RouteModule = await import(filePath);
				const contentType: string | null = request.headers.get("Content-Type");
				const actualContentType: string | null = contentType
					? contentType.split(";")[0].trim()
					: null;

				if (
					routeModule.routeDef.needsBody === "json" &&
					actualContentType === "application/json"
				) {
					try {
						requestBody = await request.json();
					} catch {
						requestBody = {};
					}
				} else if (
					routeModule.routeDef.needsBody === "multipart" &&
					actualContentType === "multipart/form-data"
				) {
					try {
						requestBody = await request.formData();
					} catch {
						requestBody = {};
					}
				}

				if (routeModule.routeDef.method !== request.method) {
					response = Response.json(
						{
							success: false,
							code: 405,
							error: `Method ${request.method} Not Allowed`,
						},
						{ status: 405 },
					);
				} else {
					const expectedContentType: string | null =
						routeModule.routeDef.accepts;

					const matchesAccepts: boolean =
						expectedContentType === "*/*" ||
						actualContentType === expectedContentType;

					if (!matchesAccepts) {
						response = Response.json(
							{
								success: false,
								code: 406,
								error: `Content-Type ${contentType} Not Acceptable`,
							},
							{ status: 406 },
						);
					} else {
						response = await routeModule.handler(
							request,
							server,
							requestBody,
							query,
							params,
						);

						response.headers.set("Content-Type", routeModule.routeDef.returns);
					}
				}
			} catch (error: unknown) {
				logger.error(`Error handling route ${request.url}:`);
				logger.error(error as Error);

				response = Response.json(
					{
						success: false,
						code: 500,
						error: "Internal Server Error",
					},
					{ status: 500 },
				);
			}
		} else {
			response = Response.json(
				{
					success: false,
					code: 404,
					error: "Not Found",
				},
				{ status: 404 },
			);
		}

		const headers: Headers = response.headers;
		let ip: string | null = server.requestIP(request)?.address || null;

		if (!ip) {
			ip =
				headers.get("CF-Connecting-IP") ||
				headers.get("X-Real-IP") ||
				headers.get("X-Forwarded-For") ||
				null;
		}

		logger.info([
			`[${request.method}]`,
			request.url,
			`${response.status}`,
			`(${ip || "unknown"})`,
		]);

		return response;
	}
}
const serverHandler: ServerHandler = new ServerHandler(
	environment.port,
	environment.host,
);

export { serverHandler };
