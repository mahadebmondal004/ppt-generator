# AWS EC2 Production Deployment Guide

This guide walks you through deploying the **AI PPT & Lesson Plan Generator** on an AWS EC2 instance (Ubuntu 22.04 LTS) from scratch.

---

## 1. Configure AWS EC2 Security Group
Ensure the security group associated with your EC2 instance allows incoming traffic on these ports:
- **Port 22** (SSH) — For remote access
- **Port 80** (HTTP) — For web access
- **Port 443** (HTTPS) — For secure SSL access

---

## 2. Server Setup (Ubuntu 22.04 LTS)

### Connect via SSH
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

### Update Packages & Install Node.js
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install Git, Nginx, and PM2
```bash
sudo apt install -y git nginx
sudo npm install -g pm2
```

---

## 3. Install and Configure MongoDB (Optional)
If you are NOT using MongoDB Atlas (cloud database) and want to run MongoDB locally on your EC2 instance:

### Install MongoDB Community Edition
```bash
# Import the public GPG key for the latest stable MongoDB
sudo apt-get install gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg --o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor --yes

# Create a list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Reload local package database and install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### Start & Enable MongoDB Service
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```
*Note: Your local connection string will be `mongodb://127.0.0.1:27017/ai_ppt_generator`.*

---

## 4. Clone and Setup Directory

Create a folder under `/var/www/` for the project and set permissions:
```bash
sudo mkdir -p /var/www/ppt-generator
sudo chown -R $USER:$USER /var/www/ppt-generator
```

Clone the repository:
```bash
git clone https://github.com/mahadebmondal004/ppt-generator.git /var/www/ppt-generator
cd /var/www/ppt-generator
```

---

## 5. Environment Configuration & Setup

### Create Backend `.env` File
```bash
cd /var/www/ppt-generator/backend
nano .env
```
Copy and paste your production environment variables:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/ai_ppt_generator   # Use local MongoDB or MongoDB Atlas URL
JWT_SECRET=your_production_secret_key_here
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
MOCK_AI=false
```

---

## 6. Run Initial Build & Start PM2

Make the deployment automation script executable:
```bash
cd /var/www/ppt-generator
chmod +x deploy.sh
```

Run the automated script to install all dependencies, build the React frontend, and launch the Express backend under PM2 management:
```bash
./deploy.sh
```

### Setup PM2 Server Startup Hook
Ensure the backend process auto-starts if the EC2 instance reboots:
```bash
pm2 startup
# Run the command outputted on the terminal screen
pm2 save
```

---

## 7. Configure Nginx Reverse Proxy

Copy the pre-configured Nginx config template to Nginx's sites folder:
```bash
sudo cp /var/www/ppt-generator/nginx.conf /etc/nginx/sites-available/ppt-generator
sudo ln -s /etc/nginx/sites-available/ppt-generator /etc/nginx/sites-enabled/
```

Remove Nginx's default site:
```bash
sudo rm /etc/nginx/sites-enabled/default
```

Edit the site config to replace `your_domain_or_ec2_public_ip` with your actual domain name or EC2 Public IP:
```bash
sudo nano /etc/nginx/sites-enabled/ppt-generator
```

Verify the configuration and restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 8. Enable SSL with Let's Encrypt (Certbot)
If you have pointed a custom domain name (e.g. `yourdomain.com`) to your EC2 public IP:

```bash
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d yourdomain.com
```
Follow the interactive prompts to enable SSL and enforce HTTPS redirection.

---

## 9. Monitoring & Logs (Useful Commands)

- **View Live Logs**: `pm2 logs`
- **Monitor Processes (CPU/RAM)**: `pm2 monit`
- **Restart Application**: `pm2 reload ecosystem.config.js`
- **List Running Apps**: `pm2 list`

To automatically rotate PM2 logs (prevent logs from filling disk space):
```bash
pm2 install pm2-logrotate
```

---

## 10. Deploying Future Updates
Whenever you push new code changes to your GitHub main branch, simply SSH into your EC2 server and run:
```bash
cd /var/www/ppt-generator
./deploy.sh
```
The script will fetch the updates, compile the frontend assets, and cleanly reload the backend backend without any downtime.
