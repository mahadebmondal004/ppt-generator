#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Automated Deployment Process..."

# 1. Pull latest code from main branch
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 2. Install backend dependencies
echo "📦 Updating Backend dependencies..."
cd backend
npm install
cd ..

# 3. Install frontend dependencies and build
echo "📦 Updating Frontend dependencies and building static assets..."
cd frontend
npm install
npm run build
cd ..

# 4. Restart backend processes using PM2 configuration
echo "🔄 Reloading backend process via PM2..."
pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js

echo "✅ Deployment completed successfully!"
