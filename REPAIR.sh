#!/bin/bash

# --- ASB STORE VPS REPAIR SCRIPT ---
# This script fixes common Nginx 403 Forbidden, 502 Bad Gateway, 
# and Conflict errors on Ubuntu VPS.

echo "🚀 Starting ASB Store VPS Repair..."

# 1. Clear Nginx Conflicts
echo "🔍 Searching for all Nginx configs claiming your domains..."
# This is more thorough: searches all of /etc/nginx
ALL_CONFLICTS=$(sudo grep -r "asbcrystal.in" /etc/nginx | grep "server_name" | cut -d: -f1 | sort -u | grep -v "asbstore")
if [ -n "$ALL_CONFLICTS" ]; then
    echo "🗑 Removing conflicting files: $ALL_CONFLICTS"
    for file in $ALL_CONFLICTS; do
        sudo rm -f "$file"
        # also check enabled links
        filename=$(basename "$file")
        sudo rm -f "/etc/nginx/sites-enabled/$filename"
    done
fi
sudo rm -f /etc/nginx/sites-enabled/default

# 1.5 Check if Backend is actually on 8080
echo "🔌 Checking if Backend is listening on port 8080..."
if ! sudo netstat -tpln | grep -q ":8080"; then
    echo "⚠️ Warning: Nothing is listening on port 8080. Restarting PM2..."
    pm2 restart all || pm2 start /root/ASB_STORE/ecosystem.config.js
fi

# 2. Fix Directory Permissions (Critical for /root folder)
echo "📂 Setting permissions for Nginx to access build files..."
sudo chmod o+x /root
sudo chmod -R 755 /root/ASB_STORE

# 3. Enable the correct config
echo "🔗 Re-linking asbstore config..."
sudo ln -sf /etc/nginx/sites-available/asbstore /etc/nginx/sites-enabled/

# 4. Fresh Slate (Clean old builds)
echo "🧹 Cleaning old builds and installing dependencies..."
cd /root/ASB_STORE/asb-admin && rm -rf build node_modules
npm install
npm run build

cd /root/ASB_STORE/spiritual-marketplace-ui && rm -rf build node_modules
npm install
npm run build

# 5. Restart Nginx
echo "🔄 Testing and Restarting Nginx..."
if sudo nginx -t; then
    sudo systemctl restart nginx
    echo "✅ Nginx Restarted Successfully."
else
    echo "❌ Nginx Config Test Failed. Please check manually."
fi

# 6. Ensure Backend is running
echo "⚡ Restarting Backend with PM2..."
cd /root/ASB_STORE/asb-backend
npm install
cd /root/ASB_STORE
pm2 restart all || pm2 start ecosystem.config.js
pm2 save

echo ""
echo "🏁 TOTAL REPAIR COMPLETE!"
echo "------------------------------------------------"
echo "🌐 VISIT YOUR SITE AT: http://asbcrystal.in"
echo "🌐 ADMIN PANEL AT: http://admin.asbcrystal.in"
echo "🌐 API STATUS: http://api.asbcrystal.in/api/health"
echo "💡 If you still see old icons, press Ctrl+F5 in your browser."
echo "------------------------------------------------"
