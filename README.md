# Pickleball Training Session Manager

A Vue.js application to manage player rotations during pickleball training sessions.

## Features

- Add and remove players from the session
- Manage active players on court
- Track waiting players
- Automatic rotation system
- Modern and responsive UI

## Project Setup

```bash
# Install dependencies
npm install

# Serve with hot-reload for development
npm run serve

# Build for production
npm run build
```

## Usage

1. Start by adding players using the input field
2. Players will be automatically added to the waiting list
3. The first 4 players will be moved to the active court
4. Use the "Rotate Players" button to rotate players between active and waiting lists
5. Remove players at any time using the remove button (×)

## Technologies Used

- Vue.js 3
- Vuex for state management
- Vue Router for navigation
- Modern CSS with Grid and Flexbox
