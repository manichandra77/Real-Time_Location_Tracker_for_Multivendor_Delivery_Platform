# Real-Time Location Tracker for Multivendor Delivery Platform

A comprehensive real-time delivery tracking system built with Next.js, Node.js, and Socket.IO. This platform enables vendors to manage orders, assign delivery partners, and allows customers to track deliveries in real-time on an interactive map.

## Features

### Vendor Dashboard
- **Order Management**: View all pending, assigned, and completed orders
- **Delivery Partner Assignment**: Assign available delivery partners to orders
- **Real-time Order Status**: Live updates on order progress and delivery status
- **Multi-tenant Support**: Each vendor sees only their own orders
- **Order Analytics**: Track delivery performance and completion rates

### Delivery Partner Dashboard
- **Order Queue**: View assigned orders with pickup and delivery details
- **Live Location Tracking**: Real-time GPS tracking with automatic updates every 2-3 seconds
- **Delivery Controls**: Start/pause/complete delivery with one-click actions
- **Route Optimization**: Get directions to pickup and delivery locations
- **Manual Location Override**: Fallback option when GPS is unavailable
- **Delivery History**: View past completed deliveries

### Customer Tracking Page
- **Interactive Map**: Real-time delivery partner location on Google Maps/Leaflet
- **Live ETA Updates**: Dynamic estimated time of arrival calculations
- **Delivery Progress**: Step-by-step delivery status updates
- **Partner Information**: View assigned delivery partner details
- **Auto-refresh**: Location updates every 2-3 seconds without page reload
- **Mobile Responsive**: Optimized for mobile tracking experience

### Technical Features
- **Real-time Communication**: WebSocket-based live updates using Socket.IO
- **JWT Authentication**: Secure token-based authentication for all user types
- **Geolocation API**: Browser-based GPS tracking with fallback support
- **Database Integration**: Support for both MongoDB and PostgreSQL
- **Error Handling**: Robust connection recovery and offline support
- **Scalable Architecture**: Microservice-ready backend design

## Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (v5.0+) or **PostgreSQL** (v13+)
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/realtime-delivery-tracker.git
cd realtime-delivery-tracker
```

### 2. Environment Configuration

Create environment files for both frontend and backend:

#### Backend Environment (.env)
```bash
# Navigate to backend directory
cd backend

# Create .env file
cp .env.example .env
```

Configure the following variables in `backend/.env`:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Database Configuration (Choose one)
# For MongoDB
DATABASE_URL=mongodb://localhost:27017/delivery_tracker
# For PostgreSQL
# DATABASE_URL=postgresql://username:password@localhost:5432/delivery_tracker

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Map Service (Choose one)
# Google Maps API Key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Or OpenStreetMap (no key required for Leaflet)
MAP_SERVICE=leaflet

# Socket.IO Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000
```

#### Frontend Environment (.env.local)
```bash
# Navigate to frontend directory
cd ../frontend

# Create .env.local file
cp .env.example .env.local
```

Configure the following variables in `frontend/.env.local`:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Map Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_MAP_SERVICE=google
# Use 'leaflet' for OpenStreetMap

# App Configuration
NEXT_PUBLIC_APP_NAME=DeliveryTracker
NEXT_PUBLIC_DEFAULT_LAT=17.3850
NEXT_PUBLIC_DEFAULT_LNG=78.4867
```

### 3. Database Setup

#### For MongoDB:
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### For PostgreSQL:
```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Create database
createdb delivery_tracker

# Or using Docker
docker run -d \
  --name postgres \
  -e POSTGRES_DB=delivery_tracker \
  -e POSTGRES_USER=your_username \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:13
```

### 4. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migrations (if using PostgreSQL)
npm run migrate

# Seed initial data (optional)
npm run seed

# Start development server
npm run dev
```

The backend server will start at `http://localhost:5000`

### 5. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 6. Verify Installation

#### Test Backend APIs:
```bash
# Check server health
curl http://localhost:5000/health

# Test authentication endpoint
curl -X POST http://localhost:5000/api/auth/vendor/register \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor@test.com","password":"password123","businessName":"Test Vendor"}'
```

#### Access Frontend:
- **Vendor Dashboard**: `http://localhost:3000/vendor/login`
- **Delivery Dashboard**: `http://localhost:3000/delivery/login`
- **Customer Tracking**: `http://localhost:3000/track/[orderId]`

### 7. Production Deployment

#### Using Docker Compose:
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Manual Deployment:
```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd ../backend
npm run build

# Start production servers
npm run start
```

### 8. Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd ../frontend
npm test

# Run e2e tests
npm run test:e2e
```

## API Documentation

Once the backend is running, access the API documentation at:
- **Swagger UI**: `http://localhost:5000/api-docs`
- **Postman Collection**: Import `docs/api-collection.json`

## Troubleshooting

### Common Issues:

#### Port Already in Use:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env file
PORT=5001
```

#### Database Connection Issues:
```bash
# Check MongoDB connection
mongosh --eval "db.runCommand('ping')"

# Check PostgreSQL connection
pg_isready -h localhost -p 5432
```

#### WebSocket Connection Errors:
- Ensure CORS settings match your frontend URL
- Check firewall settings for Socket.IO ports
- Verify `SOCKET_CORS_ORIGIN` in backend `.env`

#### Map Not Loading:
- Verify Google Maps API key is valid and has required permissions
- For Leaflet, ensure internet connection for tile loading
- Check browser console for API key errors

### Development Tips:

- Use `npm run dev` for hot-reloading during development
- Enable debug logs: `DEBUG=delivery-tracker:* npm run dev`
- Use browser DevTools Network tab to monitor WebSocket connections
- Install Redux DevTools extension for state debugging

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation in `/docs` folder
- Review API examples in `/examples` directory
