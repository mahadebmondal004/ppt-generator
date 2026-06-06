# AWS EC2 Deployment Guide

This guide walks you through deploying the **AI PPT & Lesson Plan Generator** on an AWS EC2 instance (Ubuntu 22.04 LTS).

---

## 1. Configure AWS EC2 Instance Security Group
Ensure the security group associated with your EC2 instance allows incoming traffic on the following ports:
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

## 3. Clone and Setup Directory

Create a directory under `/var/www/` for deployment and set permissions:
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

## 4. Install Dependencies & Build Frontend

### Backend Setup
Navigate to the backend, install dependencies, and create the `.env` file:
```bash
cd /var/www/ppt-generator/backend
npm install
nano .env
```
Copy and paste your environment variables into the `.env` file:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
MOCK_AI=false
```

### Frontend Setup
Navigate to the frontend, install dependencies, and build:
```bash
cd /var/www/ppt-generator/frontend
npm install
npm run build
```
This generates optimized static files inside `/var/www/ppt-generator/frontend/dist`.

---

## 5. Process Management (PM2)

Start the Node.js backend using PM2 from the project root directory:
```bash
cd /var/www/ppt-generator
pm2 start ecosystem.config.js
```

### Setup PM2 to Start on Server Boot
```bash
pm2 startup
# Run the command outputted by the screen
pm2 save
```

---

## 6. Configure Nginx Reverse Proxy

Copy the `nginx.conf` template into the Nginx configuration folder:
```bash
sudo cp /var/www/ppt-generator/nginx.conf /etc/nginx/sites-available/ppt-generator
sudo ln -s /etc/nginx/sites-available/ppt-generator /etc/nginx/sites-enabled/
```

Remove the default Nginx configurations:
```bash
sudo rm /etc/nginx/sites-enabled/default
```

Edit the file to replace `your_domain_or_ec2_public_ip` with your actual domain or EC2 Public IP:
```bash
sudo nano /etc/nginx/sites-enabled/ppt-generator
```

Verify and restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. Enable SSL with Let's Encrypt (Certbot)

If you have mapped a domain name (e.g. `yourdomain.com`) to your EC2 IP:
```bash
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d yourdomain.com
```
Follow the prompts, and Certbot will automatically install SSL and redirect HTTP traffic to HTTPS securely.
