import { createRedisConnection } from "./client";

export const leaderboardChannel = (contestId: string) => `leaderboard:contest:${contestId}`;
const LEADERBOARD_CHANNEL_PATTERN = "leaderboard:contest:*";

let publisher: ReturnType<typeof createRedisConnection> | null = null;
function getPublisher() {
  if (!publisher) publisher = createRedisConnection();
  return publisher;
}

export async function publishLeaderboardUpdate(contestId: string, payload: unknown) {
  await getPublisher().publish(leaderboardChannel(contestId), JSON.stringify(payload));
}


export function subscribeToAllLeaderboards(onMessage: (contestId: string, payload: unknown) => void) {
  const subscriber = createRedisConnection(); 
  subscriber.psubscribe(LEADERBOARD_CHANNEL_PATTERN);
  subscriber.on("pmessage", (_pattern, channel, message) => {
    const contestId = channel.split(":")[2];
    if (!contestId) return;
    onMessage(contestId, JSON.parse(message));
  });
  return () => {
    subscriber.punsubscribe(LEADERBOARD_CHANNEL_PATTERN);
    subscriber.quit();
  };
}