type Data = {
	post?: Post;
	posts?: Post[];
	[key: string]: unknown;
};

interface Rule34Post {
	preview_url: string;
	sample_url: string;
	file_url: string;
	directory: number;
	hash: string;
	width: number;
	height: number;
	id: number;
	image: string;
	change: number;
	owner: string;
	parent_id: number;
	rating: string;
	sample: boolean;
	sample_height: number;
	sample_width: number;
	score: number;
	tags: string;
	source: string;
	status: string;
	has_notes: boolean;
	comment_count: number;
}

type BooruPost = Rule34Post & {
	post_url: string;
	file_url: string;
};
