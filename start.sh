#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Backend and Frontend...${NC}"

# Start backend in background
echo -e "${BLUE}Starting Backend Server...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend in background
echo -e "${BLUE}Starting Frontend Server...${NC}"
cd gamilearn && npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${GREEN}Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C and cleanup
trap cleanup INT TERM

echo -e "${GREEN}Both servers are running!${NC}"
echo -e "Backend PID: $BACKEND_PID"
echo -e "Frontend PID: $FRONTEND_PID"
echo -e "Press Ctrl+C to stop both servers"

# Wait for both processes
wait
