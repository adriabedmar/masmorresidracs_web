/**
 * Format number of players display
 * -1 returns 'qualsevol' (Any)
 * Otherwise returns the number as string
 */
export const formatNumberOfPlayers = (players: number): string => {
	return players === -1 ? 'qualsevol' : String(players);
};

export const formatAdventureLevel = (level: number): string => {
	return level === -1 ? 'qualsevol' : String(level);
};
