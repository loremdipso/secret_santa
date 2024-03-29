import type { IPair, IPlayer, IResultPair } from "./interfaces";
import SimpleCrypto from "simple-crypto-js";

// we don't actually care about security, we just want some strings to not be
// human-readable
const simpleCrypto = new SimpleCrypto("not a real key");

export function encrypt(data: any): string {
	return simpleCrypto.encrypt(data);
}

export function decrypt(data: string): any {
	return simpleCrypto.decrypt(data) as string;
}

export function cleanedObject(data: any): any {
	let rv: any = {};
	for (let key in data) {
		if (data.hasOwnProperty(key) && data[key] !== null && data[key] !== undefined) {
			rv[key] = data[key];
		}
	}
	return rv;
}

export function findExclusionsForPlayer(players: IPlayer[], exclusions: IPair[], id: number, oneWay: boolean): number[] {
	const toExclude = [];
	for (const exclusion of exclusions) {
		if (exclusion.a === id) {
			toExclude.push(exclusion.b);
		} else if (!oneWay && exclusion.b === id) {
			toExclude.push(exclusion.a);
		}
	}

	// since the list of exclusions isn't always in sync with the list of players, make sure
	// that the player exists for the exclusion we've found
	return toExclude.filter((idToRemove) => findPlayerById(players, idToRemove)).sort((a, b) => a - b);
}

export function playerIsEmpty(player: IPlayer) {
	return (!player) || (!player.name && !player.email);
}

export function pairHasEmail(players: IPlayer[], pair: IPair): boolean {
	let a = findPlayerById(players, pair.a);
	let b = findPlayerById(players, pair.b);
	return !!(a && b && a.email && b.email);
}

export const getPairId = (() => {
	let pairId = 0;
	return () => {
		return pairId++;
	};
})();

export const getPlayerId = (() => {
	let playerId = 0;
	return () => {
		return playerId++;
	};
})();

export function findPlayerById(players: IPlayer[], id: number): IPlayer {
	return players.find((player) => player.id === id);
}

export function findPlayerByName(players: IPlayer[], name: string): IPlayer {
	return players.find((player) => player.name === name);
}

export function getMatchups(
	players: IPlayer[],
	oneWay: boolean
): IResultPair[] {
	if (players.length < 2) {
		return [];
	}

	// TODO: something smarter
	let exclusions: IPair[] = [];
	for (let player of players) {
		for (let exclusion of player.exclusions) {
			exclusions.push({ a: player.id, b: exclusion });
		}
	}

	const shuffledPlayers = shuffleArray([...players]);
	const tempPlayers =
		getFirstPermutation(shuffledPlayers, (tempPlayers: IPlayer[]) => {
			let matchups = playersToMatchups(tempPlayers);
			return validMatchups(matchups, exclusions, oneWay);
		}) || [];

	if (tempPlayers && tempPlayers.length > 1) {
		const matchups = playersToMatchups(tempPlayers);
		return matchups.sort((a, b) => a.a - b.a);
	} else {
		return [];
	}
}

function playersToMatchups(players: IPlayer[]): IResultPair[] {
	let matchups: IResultPair[] = [];
	for (let i = 0; i < players.length - 1; i++) {
		matchups.push({
			a: players[i].id,
			b: players[i + 1].id,
			// id: getPairId(),
		});
	}

	if (players.length > 1) {
		matchups.push({
			a: players[players.length - 1].id,
			b: players[0].id,
			// id: getPairId(),
		});
	}

	return matchups;
}

function validMatchups(
	matchups: IResultPair[],
	exclusions: IPair[],
	oneWay: boolean
) {
	for (let matchup of matchups) {
		let exclusion = exclusions.find(
			(exclusion) =>
				(matchup.a === exclusion.a && matchup.b === exclusion.b) ||
				(!oneWay &&
					matchup.a === exclusion.b &&
					matchup.b === exclusion.a)
		);

		if (exclusion) {
			return false;
		}
	}
	return true;
}

// thanks SO: https://stackoverflow.com/a/60136724/13707438
function getFirstPermutation<T>(
	arr: T[],
	isValid: (players: T[]) => boolean,
	perms: T[][] = [],
	len = arr.length
): T[] {
	if (len === 1) {
		let temp = arr.slice(0);
		if (isValid(temp)) {
			return temp;
		}
	}

	for (let i = 0; i < len; i++) {
		let temp = getFirstPermutation(arr, isValid, perms, len - 1);
		if (temp) {
			return temp;
		}

		len % 2 // parity dependent adjacent elements swap
			? ([arr[0], arr[len - 1]] = [arr[len - 1], arr[0]])
			: ([arr[i], arr[len - 1]] = [arr[len - 1], arr[i]]);
	}

	return null;
}

export function calculateLinkUrl(targetPlayer: IPlayer): string {
	const url = new URL(location.pathname, location.href).href;
	const clean = cleanedObject(targetPlayer);
	const data = encrypt(clean);
	return `${url}?secret=${encodeURIComponent(data)}`;
}

export function decodeLinkUri(uri: string): IPlayer {
	const data = decrypt(decodeURIComponent(uri));
	return data;
}

export function getMatchupsString(matchups: IPair[], players: IPlayer[]): string {
	return matchups
		.map((pair) => {
			let gifter = findPlayerById(players, pair.a);
			let giftee = findPlayerById(players, pair.b);
			let link = calculateLinkUrl(giftee);
			return `${gifter.name}\n${link}`;
		})
		.join("\n\n");
}

export function generateRandomPlayers(count: number, numExclusions: number = 0): IPlayer[] {
	let players: IPlayer[] = [];
	for (let i = 0; i < count; i++) {
		players.push({
			name: `Player ${i}`,
			email: `${i}@email.com`,
			address: `${i}th Street Road`,
			id: getPlayerId(),
			exclusions: [],
		});
	}

	if (numExclusions > 1) {
		for (let i = 0; i < players.length; i++) {
			let player = players[i];
			for (let j = 0; j < players.length && player.exclusions.length < numExclusions; j++) {
				if (i !== j) {
					let otherPlayer = players[j];
					player.exclusions.push(otherPlayer.id);
				}
			}
		}
	}

	// tack on an empty player at the end
	players.push(getEmptyPlayer());

	return players;
}

export function getEmptyPlayer(): IPlayer {
	return {
		name: "",
		id: getPlayerId(),
		exclusions: [],
		email: "",
		address: "",
	};
}

// Thanks https://stackoverflow.com/a/12646864 !!!
function shuffleArray<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}
