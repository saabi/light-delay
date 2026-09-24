export type PlayerStatus = 'idle' | 'playing' | 'paused';

export type PlayerState = {
	status: PlayerStatus;
	shotIndex: number;
	elapsedInShotMs: number;
	detailsOpen: boolean;
};

let player = $state<PlayerState>({
	status: 'idle',
	shotIndex: 0,
	elapsedInShotMs: 0,
	detailsOpen: false
});

export function getPlayerState(): PlayerState {
	return player;
}

export function setShotIndex(index: number) {
	player = { ...player, shotIndex: Math.max(0, index), elapsedInShotMs: 0 };
}

export function setElapsedInShotMs(ms: number) {
	player = { ...player, elapsedInShotMs: Math.max(0, ms) };
}

export function setStatus(status: PlayerStatus) {
	player = { ...player, status };
}

export function toggleDetails() {
	player = { ...player, detailsOpen: !player.detailsOpen };
}

export function setDetailsOpen(open: boolean) {
	player = { ...player, detailsOpen: open };
}

export function play() {
	player = { ...player, status: 'playing' };
}

export function pause() {
	player = { ...player, status: 'paused' };
}

export function stop() {
	player = { ...player, status: 'idle', shotIndex: 0, elapsedInShotMs: 0 };
}
