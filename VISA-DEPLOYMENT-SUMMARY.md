# Visa Eligibility Project Deployment Summary
## visa.leadops.website

**Deployment Date:** April 8, 2026
**Status:** ✅ Successfully Deployed

---

## 🌐 Access Information

### Production URL
- **Main Domain:** https://visa.leadops.website
- **DNS Record:** CNAME visa.leadops.website → leadops.website

### Service Endpoints
- **Frontend (React/Vite):** https://visa.leadops.website/
- **Backend API:** https://visa.leadops.website/api
- **Scraper Service:** https://visa.leadops.website/scraper
- **Health Check:** https://visa.leadops.website/health

---

## 🔧 Port Configuration

### Visa Eligibility Project (No Conflicts)
- **Frontend:** 5174 (internal: 5173) - Vite dev server
- **Backend:** 3002 (internal: 3000) - Express API
- **Scraper:** 3003 (internal: 3001) - Scraping service
- **MongoDB:** 27018 (internal: 27017) - Database

### Leadops Project (Unchanged)
- **Nginx:** 80, 443
- **PostgreSQL:** 5432
- **Redis:** 6379
- **Reverb:** 8080

---

## 🐳 Docker Services

### Containers Running
```
✓ eligibility_frontend  - React frontend with Vite
✓ eligibility_backend   - Express.js API server
✓ eligibility_scraper   - Web scraping service
✓ eligibility_mongo     - MongoDB database
✓ leadops_nginx        - Main nginx proxy (updated)
```

### Networks
- `eligibility_net` - Internal visa project network
- `leadops_leadops_network` - Shared network for inter-service communication

---

## 🔒 Security Configuration

### SSL/TLS
- **Certificate:** Self-signed (temporary)
- **Protocols:** TLSv1.2, TLSv1.3
- **Ciphers:** Strong encryption suites

### Security Headers
```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
```

### Firewall Rules (UFW)
```
22/tcp   ALLOW    Anywhere  (SSH)
80/tcp   ALLOW    Anywhere  (HTTP)
443/tcp  ALLOW    Anywhere  (HTTPS)
```

---

## 📂 File Locations

### Project Directory
- **Main:** `/var/www/Test-d-ligibility-main`
- **Leadops:** `/var/www/leadops`

### Nginx Configuration
- **Visa Config:** `/var/www/leadops/docker/nginx/visa-leadops.website.conf`
- **Certificates:** `/var/www/leadops/docker/nginx/certs/`

### Docker Compose Files
- **Visa Project:** `/var/www/Test-d-ligibility-main/docker-compose.yml`
- **Leadops:** `/var/www/leadops/docker-compose.yml`

---

## 🚀 Management Commands

### Start All Services
```bash
cd /var/www/Test-d-ligibility-main
sudo docker compose up -d
```

### Stop All Services
```bash
cd /var/www/Test-d-ligibility-main
sudo docker compose down
```

### View Logs
```bash
# All services
sudo docker compose logs -f

# Specific service
sudo docker logs eligibility_backend --tail 50 -f
sudo docker logs eligibility_frontend --tail 50 -f
sudo docker logs eligibility_scraper --tail 50 -f
```

### Restart Nginx
```bash
cd /var/www/leadops
sudo docker compose restart nginx
```

---

## 🔍 Troubleshooting

### Check Service Status
```bash
sudo docker ps | grep eligibility
```

### Test Backend API
```bash
curl http://localhost:3002/api/questions
```

### Test Nginx Configuration
```bash
sudo docker exec leadops_nginx nginx -t
```

### Check Network Connectivity
```bash
sudo docker network inspect leadops_leadops_network
```

---

## 📝 Next Steps

### SSL Certificate (Let's Encrypt)
The current setup uses self-signed certificates. For production, replace with Let's Encrypt:

1. **Install Certbot (if not already installed):**
   ```bash
   sudo apt update
   sudo apt install certbot
   ```

2. **Obtain Certificate:**
   ```bash
   sudo certbot certonly --webroot -w /var/www/certbot -d visa.leadops.website
   ```

3. **Update Nginx Config:**
   Point to Let's Encrypt certificates:
   ```nginx
   ssl_certificate /etc/letsencrypt/live/visa.leadops.website/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/visa.leadops.website/privkey.pem;
   ```

4. **Auto-renewal:** Certbot sets up automatic renewal by default

### Environment Variables
Ensure all `.env` files are properly configured:
- `/var/www/Test-d-ligibility-main/backend/.env`
- `/var/www/Test-d-ligibility-main/frontend/.env`
- `/var/www/Test-d-ligibility-main/serveur/.env`

---

## 📊 API Endpoints

### Backend API (Port 3002)
- `GET /api/questions` - Public questions
- `GET /api/admin/questions` - Admin questions
- `POST /api/auth/*` - Authentication
- `GET /api/tests` - Tests

### Scraper API (Port 3003)
- `GET /scrape/:country` - Scrape specific country
- `POST /scrape/all` - Scrape all countries
- `GET /requirements/:country` - Get requirements
- `GET /requirements` - List all countries
- `GET /scraping-report` - Full scraping report
- `GET /ineffective-urls` - Ineffective URLs
- `GET /health` - Service health

---

## 🎯 Technical Stack

### Frontend
- React 19.1.1
- Vite 7.1.7
- TailwindCSS 3.4.0
- React Router 7.9.5

### Backend
- Node.js 20
- Express 5.1.0
- MongoDB 7
- Mongoose 8.19.3

### Infrastructure
- Docker Compose
- Nginx (Alpine)
- UFW Firewall

---

## ✅ Deployment Checklist

- [x] Docker compose configured with non-conflicting ports
- [x] All containers built and running
- [x] Nginx proxy configured for visa.leadops.website
- [x] SSL certificates (self-signed for initial setup)
- [x] Security headers configured
- [x] Firewall rules in place
- [x] Network connectivity verified
- [x] Health checks passing
- [x] DNS CNAME record created (visa.leadops.website)
- [ ] Let's Encrypt SSL certificate (recommended for production)

---

## 📞 Support

For issues or questions, refer to:
- Project README: `/var/www/Test-d-ligibility-main/README.md`
- Tech Spec: `/var/www/Test-d-ligibility-main/TECH_SPEC.md`
- Security Doc: `/var/www/Test-d-ligibility-main/SECURITY.md`

---

**Deployment completed successfully!** 🎉

The visa eligibility service is now accessible at https://visa.leadops.website
