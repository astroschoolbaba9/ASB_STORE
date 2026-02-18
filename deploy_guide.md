# ASB Crystal Store — Deployment Guide

## 🚀 Quick Redeploy (After Code Changes)

```bash
# 1. Pull latest code
cd ~/ASB_STORE && git pull origin main

# 2. Restart Backend
cd ~/ASB_STORE/asb-backend && pm2 restart asb-backend

# 3. Rebuild Main Website
cd ~/ASB_STORE/spiritual-marketplace-ui && npm run build

# 4. Rebuild Admin Panel
cd ~/ASB_STORE/asb-admin && npm run build
```

---

## 🛠️ First-Time VPS Setup

### 1. Install Node.js & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2
```

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/astroschoolbaba9/ASB_STORE ~/ASB_STORE
cd ~/ASB_STORE/asb-backend && npm install
cd ~/ASB_STORE/spiritual-marketplace-ui && npm install
cd ~/ASB_STORE/asb-admin && npm install
```

### 3. Start Backend with PM2
```bash
cd ~/ASB_STORE
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Build Frontend & Admin
```bash
cd ~/ASB_STORE/spiritual-marketplace-ui && npm run build
cd ~/ASB_STORE/asb-admin && npm run build
```

### 5. Nginx Configuration
Create `/etc/nginx/sites-available/asbcrystal`:
```nginx
# Main Website
server {
    listen 80;
    server_name asbcrystal.in www.asbcrystal.in;
    root /root/ASB_STORE/spiritual-marketplace-ui/build;
    index index.html;
    location / { try_files $uri /index.html; }
}

# Admin Panel
server {
    listen 80;
    server_name admin.asbcrystal.in;
    root /root/ASB_STORE/asb-admin/build;
    index index.html;
    location / { try_files $uri /index.html; }
}

# Backend API
server {
    listen 80;
    server_name api.asbcrystal.in;
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/asbcrystal /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 6. SSL (HTTPS) with Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d asbcrystal.in -d www.asbcrystal.in -d admin.asbcrystal.in -d api.asbcrystal.in
```

---

## 🔑 Admin Login (First Time)

After deploying, promote your phone number to admin:
```bash
cd ~/ASB_STORE/asb-backend
node src/scripts/makeAdmin.js 9911500291
```

Then login at `https://admin.asbcrystal.in` using your phone number via OTP.

---

## 🔧 Update PayU / SMS Keys
```bash
cd ~/ASB_STORE/asb-backend
nano .env
# Edit the keys, then Save (Ctrl+O, Enter, Ctrl+X)
pm2 restart asb-backend
```

---

## 📋 Useful Commands
```bash
pm2 status              # Check if backend is running
pm2 logs asb-backend    # View backend logs
pm2 restart asb-backend # Restart backend
pm2 monit               # Real-time monitoring
```
