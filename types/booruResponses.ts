type Data = {
	post?: BooruPost;
	posts?: BooruPost[];
	[key: string]: unknown;
};

interface DefaultPost {
	directory?: number;
	hash?: string;
	id: number;
	image?: string;
	tags: string | Record<string, string[]>;
}

type E621Post = {
	id: number;
	file: {
		url: string;
	};
	tags: Record<string, string[]>;
};

type BooruPost = {
	file_url?: string | null;
	post_url?: string;
} & (DefaultPost | E621Post);

export type { Data, DefaultPost, E621Post, BooruPost };
