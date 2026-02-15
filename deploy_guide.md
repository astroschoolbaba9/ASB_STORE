# Final Deployment Guide (ASB - AGPK Academy)

Follow these steps to update your live site on the Hostinger VPS.

## ⚡ Quick Redeploy (After UI/Branding Changes)
Run these commands to pull the latest branding and UI fixes:

```bash
# 1. Update Backend
cd ~/ASB_STORE/asb-backend && git pull origin main && pm2 restart all

# 2. Update Main Website
cd ~/ASB_STORE/spiritual-marketplace-ui && git pull origin main && rm -rf build && npm run build

# 3. Update Admin Panel
cd ~/ASB_STORE/asb-admin && git pull origin main && rm -rf build && npm run build
```

---

## 🛠️ Full Setup / Troubleshooting

### 1. Update Secrets
If you change your SMS API keys or PayU keys, you MUST update them on the VPS:
```bash
cd ~/ASB_STORE/asb-backend
nano .env
# Edit the keys, then Save (Ctrl+O, Enter, Ctrl+X)
pm2 restart all
```

### 2. "Still seeing React App?"
If the browser tab still says "React App" after building:
*   **Force Refresh**: Press `Ctrl + F5`.
*   **Use Incognito**: Open the site in a Private window. 
*   **Nginx Check**: Ensure your Nginx configuration points to `/root/ASB_STORE/spiritual-marketplace-ui/build`.

---

## 📞 Support
If you get a `404` or `500` error, check the logs:
```bash
pm2 logs asb-backend --lines 50
```
