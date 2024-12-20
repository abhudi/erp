#!/bin/bash
set -e 

# Change to your application directory
cd /home/ubuntu/erp_web

# Pull the latest changes from the Git repository
# /usr/bin/git pull origin dev

# Install dependencies, build your application, etc.
# /usr/bin/npm install

# /usr/bin/npm run build

/usr/local/bin/pm2 stop "erp-web" || true
/usr/local/bin/pm2 delete "erp-web" || true
# /usr/local/bin/pm2 start npm --name "erp-web" -- start -- -p 4000

# Step 4: Install 'serve' to serve the build files (optional)
echo "Installing 'serve' to run the build in production..."
/usr/bin/npm install --save-dev serve --no-package-lock

# Step 5: Start the app using PM2
echo "Starting the app with PM2..."
/usr/local/bin/pm2 start "serve -s build -l 4000" --name "erp-web"

# Step 6: (Optional) Save PM2 process list to restart on reboot
echo "Saving PM2 process list..."
/usr/local/bin/pm2 save

# Step 7: (Optional) Enable PM2 startup on system reboot
echo "Setting PM2 to start on reboot..."
/usr/local/bin/pm2 startup

# Step 8: Output the PM2 process list
/usr/local/bin/pm2 list

echo "Deployment completed successfully!"

echo "Deployment to dev server complete."
