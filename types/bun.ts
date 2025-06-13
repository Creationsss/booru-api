type Query = Record<string, string>;
type Params = Record<string, string>;

interface ExtendedRequest extends Request {
	startPerf: number;
	query: Query;
	params: Params;
}

export type { ExtendedRequest, Query, Params };
