# Brizo Backend Deployment Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+ 
- npm or yarn
- SQLite3

### 2. Installation
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Test Deployment
```bash
# Run comprehensive tests
node scripts/test-deployment.js

# Start development server
npm run dev

# Or start production server
node server.js
```

### 4. Verify Deployment
```bash
# Health check
curl http://localhost:3001/health

# Create test payment
curl -X POST http://localhost:3001/create-payment \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "merchant123", "amount": 0.001, "currency": "sBTC", "description": "Test payment"}'
```

## Production Deployment

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start config/ecosystem-production.config.js

# Monitor
pm2 monit
```

### Using Docker
```bash
# Build image
docker build -t brizo-backend .

# Run container
docker-compose -f docker-compose-production.yml up -d
```

### Using Systemd
```bash
# Copy service file
sudo cp config/brizo-backend-production.service /etc/systemd/system/

# Enable and start
sudo systemctl enable brizo-backend-production
sudo systemctl start brizo-backend-production
```

## Monitoring

### Health Checks
- `GET /health` - Basic health check
- `GET /metrics` - System metrics
- `GET /alerts` - Active alerts
- `GET /security/stats` - Security statistics

### Logs
- Application logs: `./logs/combined.log`
- Error logs: `./logs/error.log`
- Access logs: `./logs/access.log`

## Configuration

### Environment Variables
See `.env.example` for all available configuration options.

### Key Settings
- `NODE_ENV=production` - Production mode
- `PORT=3001` - Server port
- `DB_PATH=./data/brizo.db` - Database path
- `LOG_LEVEL=info` - Logging level

## Security

### Rate Limiting
- General: 100 requests/15 minutes
- Payments: 10 requests/minute
- Auth: 5 requests/15 minutes

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

## Troubleshooting

### Common Issues
1. **Port already in use**: Change PORT in .env
2. **Database locked**: Check file permissions
3. **Memory issues**: Increase Node.js heap size

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
node server.js
```

## Support

For issues or questions:
1. Check logs in `./logs/`
2. Review health check endpoint
3. Check system metrics
4. Review security stats
