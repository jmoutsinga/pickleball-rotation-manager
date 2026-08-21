<template>
  <section
    class="game-card"
    :class="{
      'game-card--editing': isScoring && isEditing,
      'game-card--resolved': isScoring && game.isResolved && !isEditing
    }"
  >
    <header class="game-card__header">
      <h4>Game N°{{ game.number }}</h4>
      <svg
        v-if="game.isResolved && !isEditing"
        class="game-card__check"
        viewBox="0 0 32 32"
        aria-label="Game validated"
        role="img"
      >
        <circle cx="16" cy="16" r="14" />
        <path
          class="game-card__check-mark"
          d="M8.5 16.5 13.2 21 24 9.5"
        />
      </svg>
    </header>

    <div class="game-card__teams">
      <TeamCard
        :team="teamA"
        label="Team A"
        variant="a"
        :show-score="isScoring"
        :score="scoreTeamA"
        :score-disabled="!isEditing"
        :result="teamResult(teamA.id)"
        :winner-selectable="isTieWaitingForWinner"
        @player-drag-start="emit('player-drag-start', $event)"
        @player-drop="emit('player-drop', teamA.id)"
        @player-swap="emit('player-swap', $event)"
        @remove-player="emit('remove-player', $event)"
        @score-change="scoreTeamA = $event"
        @select-winner="designateWinner(teamA.id)"
      />

      <div class="game-card__middle">
        <strong v-if="isTieWaitingForWinner" class="game-card__winner-question">
          WINNER ?
        </strong>
        <div class="team-divider">VS</div>
        <button
          v-if="isScoring"
          type="button"
          class="game-card__score-action"
          :class="isEditing
            ? 'game-card__score-action--ok'
            : 'game-card__score-action--ko'"
          :disabled="isEditing && !canSubmitScore"
          :aria-label="isEditing
            ? `Validate score for Game ${game.number}`
            : `Edit score for Game ${game.number}`"
          @click="toggleScore"
        >
          <svg
            v-if="isEditing"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <TeamCard
        :team="teamB"
        label="Team B"
        variant="b"
        :show-score="isScoring"
        :score="scoreTeamB"
        :score-disabled="!isEditing"
        :result="teamResult(teamB.id)"
        :winner-selectable="isTieWaitingForWinner"
        @player-drag-start="emit('player-drag-start', $event)"
        @player-drop="emit('player-drop', teamB.id)"
        @player-swap="emit('player-swap', $event)"
        @remove-player="emit('remove-player', $event)"
        @score-change="scoreTeamB = $event"
        @select-winner="designateWinner(teamB.id)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RotationStatus, type Game, type Team } from '@/models'
import TeamCard from './TeamCard.vue'

defineOptions({ name: 'GameCard' })

const props = defineProps<{
  game: Game
  teamA: Team
  teamB: Team
  rotationStatus: RotationStatus
}>()

const emit = defineEmits<{
  'player-drag-start': [playerId: string]
  'player-drop': [targetTeamId: string]
  'player-swap': [targetPlayerId: string]
  'remove-player': [playerId: string]
  'score-game': [command: {
    gameId: string
    scoreTeamA: number
    scoreTeamB: number
  }]
  'score-editing-change': [command: {
    gameId: string
    isEditing: boolean
  }]
  'designate-winner': [command: {
    gameId: string
    winnerTeamId: string
  }]
}>()

const scoreTeamA = ref<number | null>(props.game.scoreTeamA)
const scoreTeamB = ref<number | null>(props.game.scoreTeamB)
const isEditing = ref(!props.game.hasRecordedScore)

const isScoring = computed(
  () => props.rotationStatus === RotationStatus.SCORING
)
const canSubmitScore = computed(() =>
  isValidScore(scoreTeamA.value) && isValidScore(scoreTeamB.value)
)
const isTieWaitingForWinner = computed(() =>
  props.game.hasRecordedScore &&
  !isEditing.value &&
  !props.game.isResolved &&
  props.game.scoreTeamA === props.game.scoreTeamB
)

watch(
  () => props.game.id,
  () => {
    synchronizeScoreDraft()
    isEditing.value = !props.game.hasRecordedScore
  }
)

watch(
  () => [props.game.scoreTeamA, props.game.scoreTeamB],
  synchronizeScoreDraft
)

function synchronizeScoreDraft(): void {
  scoreTeamA.value = props.game.scoreTeamA
  scoreTeamB.value = props.game.scoreTeamB
}

function toggleScore(): void {
  if (!isEditing.value) {
    isEditing.value = true
    emit('score-editing-change', {
      gameId: props.game.id,
      isEditing: true
    })
    return
  }

  if (!canSubmitScore.value) return
  emit('score-game', {
    gameId: props.game.id,
    scoreTeamA: scoreTeamA.value as number,
    scoreTeamB: scoreTeamB.value as number
  })
  isEditing.value = false
  emit('score-editing-change', {
    gameId: props.game.id,
    isEditing: false
  })
}

function designateWinner(winnerTeamId: string): void {
  if (!isTieWaitingForWinner.value) return
  emit('designate-winner', {
    gameId: props.game.id,
    winnerTeamId
  })
}

function teamResult(teamId: string): 'winner' | 'loser' | null {
  if (isEditing.value || !props.game.isResolved) return null
  if (props.game.winnerTeam === teamId) return 'winner'
  if (props.game.loserTeam === teamId) return 'loser'
  return null
}

function isValidScore(score: number | null): score is number {
  return score !== null &&
    Number.isInteger(score) &&
    score >= 0 &&
    score <= 100
}
</script>

<style scoped>
.game-card {
  position: relative;
  padding: 15px;
  background-color: white;
  border-radius: 4px;
  transition: background-color 160ms ease;
}

.game-card--editing {
  background-color: #fff0d9;
}

.game-card--resolved {
  background-color: #e5f7ee;
}

.game-card__header {
  display: flex;
  min-height: 32px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.game-card__header h4 {
  margin: 0;
  color: #2c3e50;
  text-align: left;
}

.game-card__check {
  width: 32px;
  height: 32px;
}

.game-card__check circle {
  fill: #fff;
  stroke: #42b983;
  stroke-width: 2;
}

.game-card__check-mark {
  fill: none;
  stroke: #2f9d6c;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3.5;
}

.game-card__teams {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

.game-card__middle {
  display: flex;
  min-width: 54px;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding-top: 10px;
}

.game-card__winner-question {
  color: #b35c00;
  font-size: 0.8rem;
  white-space: nowrap;
}

.team-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.4rem;
  color: #666;
  font-weight: bold;
}

.game-card__score-action {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
}

.game-card__score-action svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.5;
}

.game-card__score-action--ok {
  background: #2f9d6c;
}

.game-card__score-action--ko {
  background: #d64545;
}

.game-card__score-action:disabled {
  background: #aeb4b9;
  cursor: not-allowed;
}

.game-card__score-action:focus-visible {
  outline: 3px solid rgb(255 140 0 / 35%);
  outline-offset: 2px;
}
</style>
