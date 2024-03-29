<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import Button from "smelte/src/components/Button";
	import Checkbox from "smelte/src/components/Checkbox";
	import type { IPlayer } from "../interfaces";
	import { findPlayerById } from "../helpers";
	import FancyDialog from "../common/FancyDialog.svelte";

	export let players: IPlayer[];
	export let playerId: number;
	export let isOneWay = true;
	export let showDialog = false;

	let exclusions = [];
	let reverseExclusions = [];
	$: {
		exclusions = [...(findPlayerById(players, playerId)?.exclusions || [])];

		if (isOneWay) {
			reverseExclusions = [];
		} else {
			let temp = [];
			for (let exclusion of exclusions) {
				let player = findPlayerById(players, exclusion);
				if (player.exclusions.indexOf(playerId) > -1) {
					temp.push(exclusion);
				}
			}
			reverseExclusions = temp;
		}
	}

	let dispatch = createEventDispatcher();

	function updatePlayerExclusions() {
		dispatch("updateExclusions", {
			playerId,
			exclusions,
			reverseExclusions,
		});
	}

	function toggleChecked(otherPlayerId: number) {
		let index = exclusions.indexOf(otherPlayerId);
		let reverseIndex = reverseExclusions.indexOf(otherPlayerId);

		if (isOneWay) {
			if (index === -1) {
				exclusions.push(otherPlayerId);
			} else {
				exclusions.splice(index, 1);
			}
		} else {
			if (index > -1 && reverseIndex > -1) {
				// both has it, so remove from both
				if (index > -1) {
					exclusions.splice(index, 1);
				}
				if (reverseIndex > -1) {
					reverseExclusions.splice(reverseIndex, 1);
				}
			} else {
				// at least one doesn't have it, so add to both
				if (index === -1) {
					exclusions.push(otherPlayerId);
				}
				if (reverseIndex === -1) {
					reverseExclusions.push(otherPlayerId);
				}
			}
		}
		console.log({ exclusions, reverseExclusions });
	}

	function isChecked(playerId: number): boolean {
		if (isOneWay) {
			return exclusions.some((exclusion) => exclusion === playerId);
		} else {
			return (
				exclusions.some((exclusion) => exclusion === playerId) &&
				reverseExclusions.some((exclusion) => exclusion === playerId)
			);
		}
	}
	function isIndeterminate(playerId: number): boolean {
		if (isOneWay) {
			return false;
		} else {
			let a = exclusions.some((exclusion) => exclusion === playerId);
			let b = reverseExclusions.some(
				(exclusion) => exclusion === playerId
			);
			return (a && !b) || (!a && b);
		}
	}
</script>

<FancyDialog bind:showDialog>
	<h5 slot="title">Select Exclusions</h5>

	{#each players as player}
		{#if player.name.length && player.id !== playerId}
			<Checkbox
				classes={(c) => c + " w-full select-none"}
				labelClasses={(c) =>
					c + " overflow-hidden overflow-ellipsis whitespace-nowrap"}
				checked={isChecked(player.id)}
				indeterminate={isIndeterminate(player.id)}
				on:change={() => toggleChecked(player.id)}
				label={player.name}
			/>
		{/if}
	{/each}

	<div slot="actions">
		<Button text on:click={() => (showDialog = false)}>Discard</Button>
		<Button
			text
			on:click={() => {
				// TODO: does it matter the order here?
				updatePlayerExclusions();
				showDialog = false;
			}}
		>
			Save
		</Button>
	</div>
</FancyDialog>
