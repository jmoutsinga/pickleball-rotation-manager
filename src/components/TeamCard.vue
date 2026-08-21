<template>
  <section
    class="team"
    :class="[
      `team-${variant}`,
      result ? `team--${result}` : null,
      {
        'team--winner-selectable': winnerSelectable,
        'team--winner-hovered': winnerSelectable && isWinnerHovered
      }
    ]"
    :role="winnerSelectable ? 'button' : undefined"
    :tabindex="winnerSelectable ? 0 : undefined"
    :aria-label="winnerSelectable ? `Designate ${label} as winner` : undefined"
    @click="selectWinner"
    @mouseenter="setWinnerHover(true)"
    @mouseleave="setWinnerHover(false)"
    @keydown.enter.prevent="selectWinner"
    @keydown.space.prevent="selectWinner"
  >
    <span
      v-if="result"
      class="team__result-badge"
      :class="`team__result-badge--${variant === 'a' ? 'right' : 'left'}`"
      :aria-label="`${label} ${result}`"
    >
      {{ result === 'winner' ? 'W' : 'L' }}
    </span>
    <h5>{{ label }}</h5>
    <fieldset
      v-if="showScore"
      class="team__score-control"
      :aria-label="`Score controls ${label}`"
    >
      <button
        type="button"
        class="team__score-step"
        :aria-label="`Decrease score ${label}`"
        :disabled="scoreDisabled || score == null || score <= 0"
        @click.stop="adjustScore(-1)"
      >
        −
      </button>
      <input
        class="team__score"
        type="number"
        min="0"
        max="100"
        step="1"
        required
        :aria-label="`Score ${label}`"
        :value="score ?? ''"
        :disabled="scoreDisabled"
        @click.stop
        @input="updateScore"
      >
      <button
        type="button"
        class="team__score-step"
        :aria-label="`Increase score ${label}`"
        :disabled="scoreDisabled || (score ?? 0) >= 100"
        @click.stop="adjustScore(1)"
      >
        +
      </button>
    </fieldset>
    <div
      class="team-players"
      :data-touch-team-id="team.id"
      @dragover.prevent
      @drop.prevent="emit('player-drop')"
    >
      <div
        v-for="player in team.players"
        :key="player.id"
        class="player-card team-player"
        :data-touch-player-id="player.id"
        draggable="true"
        @dragstart="startDrag($event, player.id)"
        @dragover.prevent
        @drop.stop.prevent="emit('player-swap', player.id)"
      >
        {{ player.name }}
        <button
          type="button"
          class="remove-btn"
          :aria-label="`Remove ${player.name} from ${label}`"
          @click.stop="emit('remove-player', player.id)"
        >
          ×
        </button>
      </div>
      <div v-if="team.players.length < 2" class="player-slot">
        Drag player here ({{ team.players.length }}/2)
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Team } from '@/models'

defineOptions({ name: 'TeamCard' })

const props = defineProps<{
  team: Team
  label: string
  variant: 'a' | 'b'
  showScore?: boolean
  score?: number | null
  scoreDisabled?: boolean
  result?: 'winner' | 'loser' | null
  winnerSelectable?: boolean
}>()

const emit = defineEmits<{
  'player-drag-start': [playerId: string]
  'player-drop': []
  'player-swap': [targetPlayerId: string]
  'remove-player': [playerId: string]
  'score-change': [score: number | null]
  'select-winner': []
}>()

const isWinnerHovered = ref(false)

function updateScore(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  emit('score-change', value === '' ? null : Number(value))
}

function adjustScore(delta: -1 | 1): void {
  const currentScore = props.score ?? 0
  const adjustedScore = Math.min(100, Math.max(0, currentScore + delta))
  emit('score-change', adjustedScore)
}

function selectWinner(): void {
  if (props.winnerSelectable) emit('select-winner')
}

function setWinnerHover(isHovered: boolean): void {
  isWinnerHovered.value = Boolean(props.winnerSelectable) && isHovered
}

function startDrag(event: DragEvent, playerId: string): void {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }

  emit('player-drag-start', playerId)
}
</script>

<style scoped>
.team {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 6px;
  background: #fff;
  transition: background-color 120ms ease;
}

.team h5 {
  width: 100%;
  margin: 0 0 10px;
  color: #42b983;
  font-size: 1rem;
  text-align: center;
}

/*noinspection CssUnusedSelector*/
.team--winner {
  --team-result-color: #ff4600;

  border: 4px solid var(--team-result-color);
}
/*noinspection CssUnusedSelector*/
.team--loser {
  --team-result-color: #8a939b;

  border: 2px solid var(--team-result-color);
}

.team__result-badge {
  position: absolute;
  top: 8px;
  display: inline-flex;
  width: 26px;
  height: 26px;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--team-result-color);
  border-radius: 50%;
  background: #fff;
  color: var(--team-result-color);
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1;
}

/*noinspection CssUnusedSelector*/
.team__result-badge--right {
  right: 8px;
}

/*noinspection CssUnusedSelector*/
.team__result-badge--left {
  left: 8px;
}

/*noinspection CssUnusedSelector*/
.team--winner-selectable {
  cursor: pointer;
}

/*noinspection CssUnusedSelector*/
.team--winner-hovered {
  background: #e2e5e8;
}

/*noinspection CssUnusedSelector*/
.team--winner-selectable:focus-visible {
  outline: 3px solid rgb(255 140 0 / 35%);
  outline-offset: 2px;
}

.team__score-control {
  min-width: 0;
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0 0 10px;
  padding: 0;
  border: 0;
}

.team__score {
  width: 3ch;
  box-sizing: content-box;
  margin: 0;
  padding: 8px 4px;
  border: 1px solid #aeb4b9;
  border-radius: 4px;
  appearance: textfield;
  font: inherit;
  text-align: center;
}

.team__score::-webkit-inner-spin-button,
.team__score::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

.team__score:disabled {
  background: #f1f3f5;
  color: #2c3e50;
}

.team__score-step {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #42b983;
  border-radius: 50%;
  background: #fff;
  color: #2f7d5a;
  cursor: pointer;
  font: inherit;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
}

.team__score-step:disabled {
  border-color: #c5cbd0;
  background: #f1f3f5;
  color: #8a939b;
  cursor: not-allowed;
}

.team__score-step:focus-visible {
  outline: 3px solid rgb(66 185 131 / 30%);
  outline-offset: 2px;
}

.team-players {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.player-card {
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  touch-action: none;
  user-select: none;
}

.player-card:hover {
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
}

.team-player {
  background-color: #e1f5eb;
  border: 1px solid #42b983;
}

.team-b .team-player {
  background-color: #f5e1eb;
  border-color: #b94283;
}

.player-slot {
  padding: 10px;
  border: 2px dashed #ccc;
  border-radius: 4px;
  color: #666;
  text-align: center;
}

.remove-btn {
  padding: 0 5px;
  border: 0;
  background: none;
  color: #f44;
  cursor: pointer;
  font-size: 18px;
}

.remove-btn:hover {
  color: #c00;
}
</style>
