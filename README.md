# Alfred Ordering - Campus Dining Application

A full-stack campus ordering application for Alfred State College dining services, built with the MEVB stack (MongoDB, Express, Vue, Bun).

## Features

- **Real-time Availability Tracking** - No more ordering out-of-stock items
- **Dynamic Menu Management** - Add/remove items and toggle extras independently
- **Historical Price Snapshots** - Orders preserve pricing at time of purchase
- **JWT Authentication** - Secure customer login with httpOnly cookies
- **Complete Order Workflow** - From menu browsing to checkout and order history

## Tech Stack

- **Backend**: Express 5 with TypeScript
- **Runtime**: Bun
- **Database**: MongoDB 7.0
- **Frontend**: Vue 3 with Pinia and Vue Router
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose

---

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)

---

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/LutherWJ/AlfredOrdering
cd AlfredOrdering
```

### 2. Start the application
```bash
docker compose up -d --build
```

This single command will:
- Build the server application
- Start MongoDB database
- Start the Express API server
- Set up networking between containers

### 3. Access the application

Once the containers are running, access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### 4. Verify it's running
```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Test the API health endpoint
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Alfred Ordering API is running"
}
```

### 5. Stop the application
```bash
# Stop containers (keeps data)
docker compose down

# Stop and remove all data (including database)
docker compose down -v
```

---

## Docker Details

The application runs in two containers:

1. **alfred_ordering_db** (MongoDB)
   - Image: `mongo:7.0`
   - Port: `27017:27017`
   - Data persisted in Docker volume

2. **alfred_ordering_server** (Express API)
   - Built from local Dockerfile
   - Port: `3000:3000`
   - Waits for database health check before starting

### Data Persistence

MongoDB data is stored in a Docker volume named `mongodb_data`, which persists even when containers are stopped. To completely remove all data, use:

```bash
docker compose down -v
```

---

## Troubleshooting

### Port Already in Use

If ports 3000, 5173, or 27017 are already in use:

```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :5173
sudo lsof -i :27017

# Stop the process or modify docker compose.yml to use different ports
```

### Viewing Logs

```bash
# View all container logs
docker compose logs -f

# View specific container logs
docker compose logs -f mongodb
docker compose logs -f server
```

### Containers Won't Start

```bash
# Check container status
docker compose ps

# Restart containers
docker compose restart

# Rebuild and restart
docker compose up -d --build
```

### Fresh Start

To remove everything and start fresh:

```bash
docker compose down -v
docker compose up -d --build
```
