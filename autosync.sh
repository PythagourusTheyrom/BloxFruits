#!/bin/bash

# AutoSync Script for BloxFruits
# Usage: ./autosync.sh [optional_commit_message]

while true; do
# Get the current timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Check if a commit message was provided
if [ -z "$1" ]; then
    COMMIT_MSG="AutoSync: $TIMESTAMP"
else
    COMMIT_MSG="AutoSync: $TIMESTAMP - $1"
fi

echo "Starting AutoSync..."
echo "Adding all changes..."
git add .

echo "Committing with message: '$COMMIT_MSG'..."
git commit -m "$COMMIT_MSG"

echo "Pushing to origin..."
# Get current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin $BRANCH

echo "AutoSync Complete!"
done
