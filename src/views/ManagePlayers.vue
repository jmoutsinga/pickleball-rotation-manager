<template>
  <div class="manage-players">
    <h1>Manage Players</h1>
    
    <div class="player-form card">
      <h2>{{ editingPlayer ? 'Edit Player' : 'Create New Player' }}</h2>
      <div class="form-group">
        <label for="player-name">Name:</label>
        <input 
          id="player-name"
          v-model="newPlayerName" 
          placeholder="Enter player name" 
          @keyup.enter="savePlayer"
        >
      </div>
      
      <div class="form-actions">
        <button class="save-button" @click="savePlayer">{{ editingPlayer ? 'Update' : 'Create' }}</button>
        <button v-if="editingPlayer" class="cancel-button" @click="cancelEdit">Cancel</button>
      </div>
    </div>

    <div class="player-list card">
      <h2>Existing Players</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in allPlayers" :key="player.id">
            <td>{{ player.name }}</td>
            <td>
              <button class="edit-button" @click="startEdit(player)">Edit</button>
              <button class="delete-button" @click="deletePlayer(player.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { PlayerBuilder } from '../models';

export default {
  name: 'ManagePlayers',
  data() {
    return {
      newPlayerName: '',
      editingPlayer: null
    };
  },
  computed: {
    ...mapState({
      allPlayers: state => state.players
    })
  },
  methods: {
    ...mapActions(['addPlayer', 'updatePlayer', 'removePlayer']),
    savePlayer() {
      if (!this.newPlayerName.trim()) return;

      if (this.editingPlayer) {
        const updated = new PlayerBuilder()
          .withId(this.editingPlayer.id)
          .withName(this.newPlayerName)
          .withStatus(this.editingPlayer.status)
          .build();
        this.updatePlayer(updated);
        this.editingPlayer = null;
      } else {
        const newPlayer = new PlayerBuilder()
          .withName(this.newPlayerName)
          .build();
        this.addPlayer(newPlayer);
      }
      this.newPlayerName = '';
    },
    startEdit(player) {
      this.editingPlayer = player;
      this.newPlayerName = player.name;
    },
    cancelEdit() {
      this.editingPlayer = null;
      this.newPlayerName = '';
    },
    deletePlayer(playerId) {
      if (confirm('Are you sure you want to delete this player?')) {
        this.removePlayer(playerId);
        if (this.editingPlayer && this.editingPlayer.id === playerId) {
          this.cancelEdit();
        }
      }
    }
  }
};
</script>

<style scoped>
.manage-players {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
  text-align: left;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.save-button {
  background-color: #42b983;
  color: white;
}

.cancel-button {
  background-color: #999;
  color: white;
}

.edit-button {
  background-color: #2196F3;
  color: white;
  margin-right: 5px;
}

.delete-button {
  background-color: #f44336;
  color: white;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

th {
  background-color: #f8f8f8;
}
</style>
