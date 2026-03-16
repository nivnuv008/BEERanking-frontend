export type FeedUser = {
  _id: string;
  username: string;
  profilePic?: string | null;
};

export type FeedBeer = {
  _id: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
};

export type FeedPost = {
  _id: string;
  image: string;
  rating: number;
  description: string;
  createdAt: string;
  updatedAt?: string;
  user: FeedUser;
  beer?: FeedBeer | null;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser?: boolean;
};

export type FeedComment = {
  _id: string;
  text: string;
  createdAt: string;
  user: FeedUser;
};
