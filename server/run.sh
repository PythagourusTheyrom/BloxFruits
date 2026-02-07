#!/bin/bash

PORT=3000

# Check for custom port argument
if [ ! -z "$1" ]; then
    PORT=$1
fi

# Kill process on port 3000
PID3000=$(lsof -t -i:3000)
if [ ! -z "$PID3000" ]; then
    echo "Killing process $PID3000 on port 3000..."
    kill -9 $PID3000
fi

# Kill process on port 3001
PID3001=$(lsof -t -i:3001)
if [ ! -z "$PID3001" ]; then
    echo "Killing process $PID3001 on port 3001..."
    kill -9 $PID3001
fi


echo "Starting server on port $PORT..."
go run . -port=$PORT
