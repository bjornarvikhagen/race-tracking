# RaceTracker Frontend

This is the frontend for the RaceTracker application, built with React, TypeScript, and Vite.

## Features

- View current races and race details
- Register race participants and users
- Admin functionality to create new races
- Real-time updates using WebSocket

## Setup

1. Install dependencies: npm install
2. Run the development server: cd raceTracker && npm run dev
3. Open the application in your browser: http://localhost:5173

## Configuration

- WebSocket URL is configured in `src/Constants.ts`.
- API base URL is set based on the environment (Cypress or browser) in `src/Constants.ts`.

## Folder Structure

- `src/` - Main source code
  - `api/` - API request functions
  - `components/` - Reusable components
  - `pages/` - Page components
  - `App.tsx` - Main application component
  - `Constants.ts` - Configuration constants
  - `main.tsx` - Entry point
- `cypress/` - Cypress end-to-end tests


