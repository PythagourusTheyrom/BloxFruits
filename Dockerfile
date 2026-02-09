# Start from the latest golang base image
FROM golang:1.24-alpine AS builder

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source from the current directory to the Working Directory inside the container
COPY server/ ./server/
COPY client/ ./client/

# Build the Go app
# We need to point to server/main.go properly.
# Assuming we want to build the binary named 'bloxfruits'
RUN go build -o bloxfruits ./server

# Start a new stage from scratch
FROM alpine:latest  

WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/bloxfruits .

# Copy client files if we want to serve them (though Render might just be backend API if static site is elsewhere)
# The current code serves static files from "../client".
# In the container, if we put bloxfruits in /root/, we need client in /root/../client which is /client?
# Or we can change the static path in main.go, or just replicate the structure.
# Let's replicate structure: /app/bin /app/client
# But we are in /root/.
# Let's use /app in runtime too.

WORKDIR /app
COPY --from=builder /app/bloxfruits .
COPY --from=builder /app/client ./client

# Expose port 3000 to the outside world
EXPOSE 3000

# Command to run the executable
CMD ["./bloxfruits"]
