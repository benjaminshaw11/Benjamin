# Deployment Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (optional)
- Git

## Local Development

### 1. Setup Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

### 2. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Setup Database
```bash
cd backend
npm run migrate
```

### 4. Run Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Docker Deployment

### Using Docker Compose
```bash
docker-compose up -d
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Production Deployment

### AWS EC2 Deployment

1. **Launch EC2 Instance**
   - Instance type: t3.medium or higher
   - OS: Ubuntu 22.04 LTS
   - Storage: 50GB EBS
   - Security group: Allow ports 80, 443, 5000

2. **Install Dependencies**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git docker.io docker-compose postgresql postgresql-contrib redis-server

# Start services
sudo systemctl start docker postgresql redis-server
sudo usermod -aG docker $USER
```

3. **Clone Repository**
```bash
git clone https://github.com/benjaminshaw11/Benjamin.git
cd Benjamin
```

4. **Setup Environment**
```bash
cd backend
cp .env.example .env
# Edit .env with production values
```

5. **Run with Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Heroku Deployment

1. **Install Heroku CLI**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
heroku login
```

2. **Create Heroku App**
```bash
heroku create betting-platform
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
```

3. **Set Environment Variables**
```bash
heroku config:set JWT_SECRET=your_secret
heroku config:set RAZORPAY_KEY_ID=your_key
heroku config:set RAZORPAY_KEY_SECRET=your_secret
```

4. **Deploy**
```bash
git push heroku main
```

### DigitalOcean App Platform

1. **Connect GitHub**
   - Go to DigitalOcean console
   - Click "Create" > "Apps"
   - Connect your GitHub account
   - Select Benjamin repository

2. **Configure Services**
   - Backend: Node.js service
   - Frontend: Static site
   - Add managed database and Redis

3. **Deploy**
   - Set environment variables
   - Click "Deploy"

## SSL/TLS Certificate

### Using Let's Encrypt with Nginx

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Configure Nginx
sudo nano /etc/nginx/sites-available/betting

# Restart Nginx
sudo systemctl restart nginx
```

## Monitoring & Maintenance

### Health Checks
```bash
# Backend health
curl http://localhost:5000/api/health

# Database
sudo -u postgres psql -c "SELECT version();"

# Redis
redis-cli ping
```

### Backups
```bash
# PostgreSQL daily backup
0 2 * * * pg_dump betting_platform > /backups/db_$(date +\%Y-\%m-\%d).sql

# Upload to cloud storage
0 3 * * * aws s3 sync /backups s3://your-bucket/backups/
```

### Logs
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Application logs
tail -f /var/log/betting-platform/app.log
```

## Scaling

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Run multiple backend instances
- Use managed Redis for caching
- Database read replicas

### Vertical Scaling
- Upgrade instance type
- Increase RAM and CPU
- Optimize database queries
- Cache strategies

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS
- [ ] Setup firewall rules
- [ ] Enable 2FA
- [ ] Regular security updates
- [ ] Database encryption at rest
- [ ] API rate limiting
- [ ] DDoS protection
- [ ] Regular backups
- [ ] Security audits

## Troubleshooting

### Port Already in Use
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

### Database Connection Issues
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U postgres -d betting_platform -h localhost
```

### Redis Connection
```bash
redis-cli ping
redis-cli FLUSHALL  # Clear cache
```

## Support
For issues, create a GitHub issue or contact support@bettingplatform.com
