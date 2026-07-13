export type VoteChoice = "a" | "b";

export type CurrentVote = {
  choice: VoteChoice;
} | null;

export type TopicDetail = {
  id: string;
  title: string;
  description: string;
  option_a: string;
  option_b: string;
  vote_a_count: number;
  vote_b_count: number;
  opinion_count: number;
  comment_count: number;
  view_count: number;
  hot_score: number;
  is_today: boolean;
  created_at: string;
};

export type Opinion = {
  id: string;
  topic_id: string;
  user_id: string;
  choice: VoteChoice;
  body: string;
  like_count: number;
  dislike_count: number;
  score: number;
  created_at: string;
};

export type OpinionImage = {
  opinion_id: string;
  storage_bucket: string;
  storage_path: string;
  display_order: number;
  public_url: string;
};

export type Comment = {
  id: string;
  opinion_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type PublicProfile = {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
};

export type OpinionReaction = "like" | "dislike";
