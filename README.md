# Mikecremental

An incremental game built with TypeScript, Three.js, and Vite.

## Project Structure

```
Mikecremental/
├── client/          # Frontend application (Vite + TypeScript + Three.js)
│   ├── src/
│   │   ├── main.ts  # Main game entry point
│   │   └── style.css # Game styling
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
└── server/          # Backend server (Express.js)
    ├── server.js
    └── package.json
```

## Features

- **Splash Screen**: Beautiful animated title screen with "MIKECREMENTAL" title and start button
- **Three.js Integration**: 3D graphics ready for game development
- **TypeScript**: Type-safe development environment
- **Vite**: Fast development server and build tool
- **Express Server**: Backend ready for game state management

## Getting Started

### Client (Frontend)

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

### Server (Backend)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3001`

## Available Scripts

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter

### Server
- `npm run dev` - Start development server
- `npm run start` - Start production server

## Technologies Used

- **Frontend**: TypeScript, Three.js, Vite, CSS3
- **Backend**: Node.js, Express.js
- **Development**: ESLint, TypeScript compiler

## Testing the Discard Zone

The Letter Game includes a discard zone feature that allows players to discard unwanted tiles and get new ones. To test this feature:

### Method 1: Play the game naturally
1. Start the game and navigate to the Letter Game
2. Make words to earn tiles (need 100 tiles total)
3. Go to the Tile Shop and purchase the "Trash Bucket" upgrade for 100 tiles
4. Return to the Letter Game - the discard zone should now be visible on the left side

### Method 2: Use testing commands (in browser console)
1. Open the browser developer console (F12)
2. Use these commands:
   - `game.unlockDiscardZoneForTesting()` - Automatically gives 100 tiles and purchases the upgrade
   - `game.giveTestTiles(200)` - Gives any amount of tiles for testing
3. Navigate to the Letter Game to see the discard zone

### Using the Discard Zone
- **Drag tiles** from your hand to the discard slots (red dashed boxes)
- **Click discarded tiles** to move them back to your hand
- **Click the Reroll button** to permanently discard all tiles in the discard zone and draw new ones
- The discard zone can hold up to 5 tiles at once

## Next Steps

The foundation is now ready for building the incremental game mechanics:

1. Add game logic and progression systems
2. Implement 3D models and animations
3. Create UI components for game stats
4. Add backend API for persistent game state
5. Implement save/load functionality 