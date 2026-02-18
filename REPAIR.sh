#!/bin/bash

# --- ASB STORE VPS REPAIR SCRIPT ---
# This script fixes common Nginx 403 Forbidden, 502 Bad Gateway, 
# and Conflict errors on Ubuntu VPS.

echo "🚀 Starting ASB Store VPS Repair..."

# 1. Clear Nginx Conflicts
echo "🔧 Hunt down conflicting Nginx configs..."
# This finds all files in sites-enabled that contain your domain and removes them
CONFLICTS=$(grep -l "asbcrystal.in" /etc/nginx/sites-enabled/* | grep -v "asbstore")
if [ -n "$CONFLICTS" ]; then
    echo "🗑 Removing conflicting files: $CONFLICTS"
    sudo rm -f $CONFLICTS
fi
sudo rm -f /etc/nginx/sites-enabled/default

# 2. Fix Directory Permissions (Critical for /root folder)
echo "📂 Setting permissions for Nginx to access build files..."
sudo chmod o+x /root
sudo chmod -R 755 /root/ASB_STORE

# 3. Enable the correct config
echo "🔗 Re-linking asbstore config..."
sudo ln -sf /etc/nginx/sites-available/asbstore /etc/nginx/sites-enabled/

# 4. Restart Nginx
echo "🔄 Testing and Restarting Nginx..."
if sudo nginx -t; then
    sudo systemctl restart nginx
    echo "✅ Nginx Restarted Successfully."
else
    echo "❌ Nginx Config Test Failed. Please check manually."
fi

# 5. Ensure Backend is running
echo "⚡ Restarting Backend with PM2..."
cd /root/ASB_STORE
pm2 restart all || pm2 start ecosystem.config.js
pm2 save

echo ""
echo "🏁 REPAIR COMPLETE!"
echo "------------------------------------------------"
echo "🌐 VISIT YOUR SITE AT: http://asbcrystal.in"
echo "⚠️ IMPORTANT: Chrome may redirect you to https:// automatically."
echo "If it fails, try using http:// (unsecured) or install SSL via Certbot."
echo "------------------------------------------------"
