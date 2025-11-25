# Alfred Ordering - Mobile Ordering App

A campus/institution mobile ordering application built with the MEVB stack (MongoDB, Express, Vue, Bun).

## Tech Stack

- **Backend**: Express.js with TypeScript
- **Runtime**: Bun
- **Database**: MongoDB 7.0
- **ODM**: Mongoose
- **Frontend**: Vue 3 (planned)
- **Containerization**: Docker & Docker Compose

---

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)
- [Bun](https://bun.sh/) (optional, for local development only)

---

## Quick Start (For Grading/Production)

This is the recommended way to run the project for grading - everything runs in Docker containers.

### 1. Clone the repository
```bash
git clone <repository-url>
cd AlfredOrdering
```

### 2. Start the application
```bash
docker-compose up -d --build
```

This single command will:
- Build the server application
- Start MongoDB database
- Start the Express API server
- Set up networking between containers

### 3. Verify it's running
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Test the API
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Alfred Ordering API is running"
}
```

### 4. Stop the application
```bash
docker-compose down
```

To stop and remove all data (including database):
```bash
docker-compose down -v
```

---

## Available NPM Scripts

The project includes convenient scripts for various operations:

### Production (Docker)
```bash
# Build and start everything in production mode
bun run production

# Or manually:
bun run docker:build    # Build Docker images
bun run docker:up       # Start all containers
bun run docker:down     # Stop all containers
bun run docker:logs     # View container logs
bun run docker:restart  # Restart containers
bun run docker:clean    # Stop and remove all containers and volumes
```

### Database Only (Docker)
```bash
bun run db:start        # Start only MongoDB container
bun run db:stop         # Stop MongoDB container
```

### Client (Frontend)
```bash
bun run dev:client      # Start Vite dev server with hot-reload
bun run build:client    # Build for production
bun run preview:client  # Preview production build
```

### Local Development (No Docker)
```bash
# Terminal 1: Start MongoDB
bun run db:start

# Terminal 2: Run the backend server with hot-reload
bun run dev

# Terminal 3: Run the frontend client with hot-reload
bun run dev:client

# Access:
# - Client: http://localhost:5173
# - Server: http://localhost:3000
```

---

## Project Structure

```
AlfredOrdering/
├── server/                   # Backend API
│   ├── config/
│   │   └── connection.ts    # MongoDB connection
│   ├── controllers/         # Business logic (to be added)
│   ├── middleware/          # Express middleware (to be added)
│   ├── models/              # Mongoose schemas (to be added)
│   ├── routes/              # API routes (to be added)
│   ├── utils/               # Helper functions (to be added)
│   ├── types/               # TypeScript types (to be added)
│   └── index.ts             # Server entry point
├── client/                  # Frontend Vue 3 app
│   ├── src/
│   │   ├── App.vue          # Main Vue component
│   │   ├── main.ts          # Client entry point
│   │   └── style.css        # Global styles with Tailwind
│   ├── index.html           # HTML entry point
│   └── tailwind.config.js   # Tailwind configuration
├── docker-compose.yml       # Docker orchestration
├── Dockerfile               # Server container configuration
├── vite.config.ts           # Vite configuration
├── postcss.config.js        # PostCSS configuration
├── .dockerignore            # Files to exclude from Docker build
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── .env.example             # Environment variables template
```

---

## Configuration

### Environment Variables

The Docker setup uses the following default configuration (defined in `docker-compose.yml`):

- **Server Port**: 3000
- **MongoDB Port**: 27017
- **Database Name**: alfred_ordering_db
- **MongoDB User**: admin
- **MongoDB Password**: securepassword

For local development, create a `.env` file:
```bash
cp .env.example .env
```

Then edit `.env` with your local settings:
```env
PORT=3000
MONGODB_URI=mongodb://admin:securepassword@localhost:27017/alfred_ordering_db?authSource=admin
```

---

## Docker Details

### Containers

The application runs two containers:

1. **alfred_ordering_db** (MongoDB)
   - Image: `mongo:7.0`
   - Port: `27017:27017`
   - Data persisted in Docker volume

2. **alfred_ordering_server** (Express API)
   - Built from local Dockerfile
   - Port: `3000:3000`
   - Waits for database health check before starting

### Networking

Containers communicate over a bridge network called `alfred-network`. The server connects to MongoDB using the hostname `mongodb` (Docker's internal DNS).

### Data Persistence

MongoDB data is stored in a Docker volume named `mongodb_data`, which persists even when containers are stopped.

---

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "message": "Alfred Ordering API is running"
}
```

*More endpoints will be added as development progresses.*

---

## Development Workflow

### Option 1: Full Docker Development (Recommended for Grading)
```bash
# Start everything
docker-compose up -d --build

# Make code changes...

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f server
```

### Option 2: Local Development with Docker Database
```bash
# Start only the database
bun run db:start

# Run server locally with hot-reload
bun run dev

# Server automatically restarts on file changes
```

---

## Troubleshooting

### Port Already in Use
If ports 3000 or 27017 are already in use:

```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :27017

# Stop the process or modify docker-compose.yml to use different ports
```

### Database Connection Issues
```bash
# Check if MongoDB is healthy
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

# Restart the database
docker-compose restart mongodb
```

### Server Won't Start
```bash
# View server logs
docker-compose logs server

# Rebuild the server container
docker-compose up -d --build server
```

### Clean Slate
```bash
# Remove everything and start fresh
docker-compose down -v
docker-compose up -d --build
```

---

## Testing

*Testing setup will be added in future development.*

---

## Deployment Notes for Graders

This project is fully containerized for easy grading:

1. **Single Command Start**: `docker-compose up -d --build`
2. **No Local Dependencies**: Only Docker and Docker Compose needed
3. **Isolated Environment**: Runs in containers, won't conflict with system
4. **Easy Cleanup**: `docker-compose down -v` removes everything
5. **Consistent Across Systems**: Works the same on any OS with Docker

### To Grade This Project:

```bash
# 1. Navigate to project directory
cd AlfredOrdering

# 2. Start the application
docker-compose up -d --build

# 3. Test the API
curl http://localhost:3000/health

# 4. View logs if needed
docker-compose logs

# 5. Stop when done
docker-compose down
```

---

## License

[Specify your license here]

---

## Contact

For questions or issues, please contact [your-email@example.com]
