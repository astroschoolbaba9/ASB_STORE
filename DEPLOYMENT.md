# ASB Store - VPS Deployment Guide

Follow these steps to deploy and make your application live on your VPS.

## Prerequisites
1.  **Node.js & npm**: Installed on the VPS.
2.  **PM2**: Installed globally (`npm install -g pm2`).
3.  **Nginx**: Installed and running.
4.  **Git**: Installed to pull code from GitHub.

---

## 🚀 Step-by-Step Deployment

### 1. Prepare the Code
Push your local changes (including new config files) to your GitHub repository.
```bash
git add .
git commit -m "chore: production readiness and deployment config"
git push origin main
```

### 2. Update VPS Environment
SSH into your VPS and pull the latest code:
```bash
cd /var/www/asbstore
git pull origin main
```

### 3. Install Dependencies & Build
Install all dependencies and generate production builds for both frontends.
```bash
# Backend
cd asb-backend && npm install && cd ..

# Admin Frontend
cd asb-admin && npm install && npm run build && cd ..

# Client Frontend
cd spiritual-marketplace-ui && npm install && npm run build && cd ..
```

### 4. Start the Services with PM2
Use the provided `ecosystem.config.js` to start the backend with automatic restart support.
```bash
# From the project root
pm2 start ecosystem.config.js
pm2 save
```

### 5. Configure Nginx
Use the `nginx-sample.conf` file provided in the repository to update your Nginx site configuration.
1. Copy the content of `nginx-sample.conf`.
2. Edit your Nginx site config: `sudo nano /etc/nginx/sites-available/asbstore`.
3. Paste and update paths if necessary.
4. Enable the site: `sudo ln -s /etc/nginx/sites-available/asbstore /etc/nginx/sites-enabled/`.
5. Test and Restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🛠 Troubleshooting
- **Logs**: View real-time backend logs using `pm2 logs asb-backend`.
- **Status**: Check process status with `pm2 status`.
- **Build Errors**: Ensure your VPS has enough RAM (min 1GB) to run `npm run build`. If it fails, build locally and rsync the `build` folders.

---
**Application URLs**:
- **Client**: https://asbcrystal.in
- **Admin**: https://admin.asbcrystal.in
- **API**: https://api.asbcrystal.in
