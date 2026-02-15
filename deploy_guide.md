# Redeployment Guide (Hostinger VPS)

Follow these steps to pull the latest changes from GitHub and update your live site.

## ⚡ Quick Update (For Branding/UI changes only)
If you only changed the Logo, Favicon, or Text, run this:
```bash
# 1. Update Backend
cd /path/to/asb-backend && git pull origin main && pm2 restart all

# 2. Update Website & Clear Cache
cd /path/to/spiritual-marketplace-ui && git pull origin main && npm run build
# Important: Open in Incognito or press Ctrl+F5 to see the new logo/title.

# 3. Update Admin
cd /path/to/asb-admin && git pull origin main && npm run build
```
---

## Common Issues: "Still seeing React App"
If the logo or title doesn't change after building:
1. **Force Refresh**: Press `Ctrl + F5` on Windows or `Cmd + Shift + R` on Mac.
2. **Incognito**: Open the site in a Private/Incognito window.
3. **Check Path**: Ensure your Nginx/VPS is actually pointing to the `build` folder inside `ASB_STORE`.


## 1. SSH into your VPS
Open your terminal (PowerShell or CMD) and log in:
```bash
ssh root@your_vps_ip
```

## 2. Update the Backend (`asb-backend`)
Navigate to your backend directory and pull changes:
```bash
cd /path/to/your/ASB_STORE/asb-backend
git pull origin main

# Restart the server using PM2
pm2 restart all
# or if you named it: pm2 restart asb-backend
```
> [!IMPORTANT]
> Since we added new variables, make sure your `.env` on the VPS is updated with the real **API Key**, **Sender ID**, and **Template ID**.

## 3. Update the Frontend (`spiritual-marketplace-ui`)
```bash
cd /path/to/your/ASB_STORE/spiritual-marketplace-ui
git pull origin main

# Install dependencies if any new ones were added
npm install

# Build the project
npm run build
```
*If you are using Nginx, the new files in the `build` folder will automatically be served.*

## 4. Update the Admin Panel (`asb-admin`)
```bash
cd /path/to/your/ASB_STORE/asb-admin
git pull origin main

# Install & Build
npm install
npm run build
```

## 5. Verify
Check the logs to make sure everything started correctly:
```bash
pm2 logs
```
