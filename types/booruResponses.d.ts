type Data = {
	post?: Post;
	posts?: Post[];
	[key: string]: unknown;
};

interface DefaultPost {
	directory: number;
	hash: string;
	id: number;
	image: string;
	tags: string;
}

type E621Post = {
	id: number;
	file: {
		url: string;
	};
	tags: string;
};

type BooruPost = {
	file_url?: string | null;
	post_url?: string;
} & (DefaultPost | e621Post);
