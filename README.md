## G.12-race_tracking
The Race-Tracking system is a project for managing races. It consists of a backend API, a frontend application, and a checkpoint system.

## Checkpoint (/Checkpoint)
Firmware for CircuitDojo nRF9160 Feather device

Reads RFID tags and sends data via MQTT

Built using Zephyr RTOS

## Backend (radbak/python-src)
FastAPI backend for managing races, runners, checkpoints, and more

Uses PostgreSQL for database operations

Includes a forward service (MQTT client) for receiving checkpoint data

## Frontend (radbak/node-src/raceTracker)
React application for viewing and managing races

Uses TypeScript and Vite

Communicates with the backend API

## Development
Use the provided Docker setup for the backend and frontend

Refer to the README files in each subfolder for more details