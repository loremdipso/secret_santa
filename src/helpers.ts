import { IPair, IPlayer } from "interfaces";
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
	return toExclude.filter((idToRemove) => findPlayer(players, idToRemove)).sort((a, b) => a - b);
}

export function findPlayerByName(players: IPlayer[], name: string) {
	return players.find((player) => player.name === name);
}

export function findPlayer(players: IPlayer[], id: number) {
	return players.find((player) => player.id === id);
}

export function findPlayersForExclusionDropdown(players: IPlayer[], exclusions: IPair[], id: number, oneWay: boolean) {
	if (playerIsEmpty(findPlayer(players, id))) {
		return [];
	}

	let playerExclusions = findExclusionsForPlayer(players, exclusions, id, oneWay);
	let result = players.filter((player) => {
		if (player.id === id) {
			return false;
		}
		if (playerIsEmpty(player)) {
			return false;
		}
		if (playerExclusions.find((exclusionId) => exclusionId === player.id) !== undefined) {
			return false;
		}
		return true;
	});
	return result.sort((a, b) => a.id - b.id);
}

export function playerIsEmpty(player: IPlayer) {
	return (!player) || (!player.name && !player.email);
}

export function pairHasEmail(players: IPlayer[], pair: IPair): boolean {
	let a = findPlayer(players, pair.a);
	let b = findPlayer(players, pair.b);
	return !!(a && b && a.email && b.email);
}
