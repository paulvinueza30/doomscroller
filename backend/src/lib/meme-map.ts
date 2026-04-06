// Meme mapping: sentiment score 0-100 → meme filename
const MEME_RANGES: Array<[string, number, number]> = [
  ['crying_jordan.jpg',  0,  10],
  ['this_is_fine.jpg',  11,  20],
  ['crying_jeremy.jpg', 21,  30],
  ['i_have_no_idea.jpg',31,  44],
  ['drake_hotline.jpg', 45,  55],
  ['stonks.jpg',        56,  70],
  ['success_kid.jpg',   71,  85],
  ['chad_yes.jpg',      86, 100],
];

export function getMemeForSentiment(sentiment: number): string {
  const clamped = Math.min(100, Math.max(0, sentiment));
  for (const [meme, min, max] of MEME_RANGES) {
    if (clamped >= min && clamped <= max) return meme;
  }
  return 'drake_hotline.jpg'; // fallback
}

export interface AggregateData {
  sentiment: number;
  status: string;
  message: string;
  evidence: string[];
  top_posts: PostData[];
}

export interface PostData {
  reddit_id: string;
  title: string;
  sentiment: number;
  status: string;
  upvotes: number;
  evidence: string;
  url: string;
}

export interface AggregateWithMeme extends AggregateData {
  meme: string;
}

export function addMemeToAggregate(aggregate: AggregateData): AggregateWithMeme {
  return {
    ...aggregate,
    meme: getMemeForSentiment(aggregate.sentiment),
  };
}
