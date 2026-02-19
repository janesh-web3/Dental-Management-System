# 🚀 Production Deployment Guide - Muskan Dental Clinic

## Overview
This guide covers deploying the Dental Management System backend to cPanel hosting for Muskan Dental Clinic.

## Pre-Deployment Checklist

### 1. Environment Configuration
- ✅ `.env.production` file created with production values
- ✅ All API keys and secrets configured
- ✅ MongoDB Atlas connection string verified
- ✅ Cloudinary credentials configured
- ✅ Frontend URL updated to production domain

### 2. Database Setup
- ✅ MongoDB Atlas cluster created
- ✅ Database user created with appropriate permissions
- ✅ Network access configured (whitelist cPanel server IP)
- ✅ Database indexes will be created automatically on first run

### 3. Domain & SSL
- ✅ Domain `muskanserver.crownagi.com` configured
- ✅ SSL certificate installed (Let's Encrypt recommended)
- ✅ DNS records pointing to cPanel server

## Deployment Steps

### Step 1: Upload Files to cPanel

1. **Connect via FTP/SFTP or File Manager:**
   ```
   Upload backend folder to: /home/username/muskanserver.crownagi.com/
   ```

2. **Verify file structure:**
   ```
   /home/username/muskanserver.crownagi.com/
   ├── backend/
   │   ├── config/
   │   ├── controller/
   │   ├── model/
   │   ├── routes/
   │   ├── utils/
   │   ├── index.js
   │   ├── package.json
   │   └── .env.production
   ```

### Step 2: Setup Node.js Application in cPanel

1. **Navigate to cPanel → Software → Setup Node.js App**

2. **Create Application:**
   - **Node.js version:** 18.x or higher
   - **Application mode:** Production
   - **Application root:** `muskanserver.crownagi.com/backend`
   - **Application URL:** `muskanserver.crownagi.com`
   - **Application startup file:** `index.js`
   - **Environment variables:** Copy from `.env.production`

3. **Click "Create"**

### Step 3: Install Dependencies

1. **Access Terminal in cPanel or SSH:**
   ```bash
   cd /home/username/muskanserver.crownagi.com/backend
   ```

2. **Install Node modules:**
   ```bash
   npm install --production
   ```

3. **Verify installation:**
   ```bash
   npm list --depth=0
   ```

### Step 4: Configure Environment Variables

**Option A: Using cPanel Node.js App Interface**
1. Go to Node.js App settings
2. Add each variable from `.env.production`
3. Click "Save"

**Option B: Using .env file**
1. Rename `.env.production` to `.env`:
   ```bash
   mv .env.production .env
   ```
2. Ensure file permissions are secure:
   ```bash
   chmod 600 .env
   ```

### Step 5: Configure Reverse Proxy

Create `.htaccess` in domain root (`/home/username/public_html/muskanserver.crownagi.com/`):

```apache
# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy to Node.js application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:5000/$1 [P,L]

# CORS Headers
Header always set Access-Control-Allow-Origin "https://muskan.crownagi.com"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
Header always set Access-Control-Allow-Credentials "true"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

### Step 6: Start the Application

1. **Using cPanel Node.js App:**
   - Click "Start App" button in Node.js App interface
   - Monitor the status indicator

2. **Using PM2 (Recommended for better process management):**
   ```bash
   npm install -g pm2
   pm2 start index.js --name muskan-backend
   pm2 save
   pm2 startup
   ```

3. **Verify application is running:**
   ```bash
   pm2 status
   # or
   curl http://localhost:5000/api/health
   ```

### Step 7: Test the Deployment

1. **Test API endpoint:**
   ```bash
   curl https://muskanserver.crownagi.com/api/health
   ```

2. **Expected response:**
   ```json
   {
     "status": "ok",
     "message": "Server is running"
   }
   ```

3. **Test from frontend:**
   - Open `https://muskan.crownagi.com`
   - Try logging in
   - Verify API calls work

### Step 8: Configure Monitoring

1. **Setup PM2 monitoring (if using PM2):**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

2. **View logs:**
   ```bash
   pm2 logs muskan-backend
   # or
   tail -f ~/logs/muskanserver.crownagi.com-error_log
   ```

## Post-Deployment Configuration

### 1. Database Indexes
Indexes are created automatically on first startup. Verify in logs:
```bash
pm2 logs muskan-backend | grep "indexes"
```

### 2. MongoDB Atlas Network Access
Add your cPanel server IP to MongoDB Atlas:
1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Enter your cPanel server IP
4. Click "Confirm"

### 3. Cloudinary Configuration
Verify Cloudinary uploads work:
1. Test patient photo upload
2. Test document upload
3. Check Cloudinary dashboard for uploaded files

### 4. SMS Configuration
Test SMS functionality:
1. Send test SMS from admin panel
2. Verify SMS delivery
3. Check SMS credit balance

## Troubleshooting

### Issue: 503 Service Unavailable

**Causes:**
- Node.js app not running
- Port conflict
- Database connection failed

**Solutions:**
```bash
# Check if app is running
pm2 status

# Restart app
pm2 restart muskan-backend

# Check logs
pm2 logs muskan-backend --lines 100

# Check port
netstat -tulpn | grep 5000
```

### Issue: Database Connection Error

**Causes:**
- MongoDB Atlas IP not whitelisted
- Wrong connection string
- Network issues

**Solutions:**
1. Verify MongoDB Atlas network access
2. Check `.env` DB_URL is correct
3. Test connection:
   ```bash
   node -e "require('mongoose').connect(process.env.DB_URL).then(() => console.log('Connected')).catch(err => console.error(err))"
   ```

### Issue: CORS Errors

**Causes:**
- Wrong CORS_ORIGIN in .env
- Missing CORS headers in .htaccess

**Solutions:**
1. Verify CORS_ORIGIN matches frontend URL
2. Check .htaccess CORS headers
3. Restart application

### Issue: File Upload Fails

**Causes:**
- Wrong Cloudinary credentials
- File size limit exceeded
- Network issues

**Solutions:**
1. Verify Cloudinary credentials in .env
2. Check MAX_REQUEST_SIZE setting
3. Test Cloudinary connection

## Maintenance

### Regular Tasks

**Daily:**
- Monitor application logs
- Check error rates
- Verify SMS credit balance

**Weekly:**
- Review performance metrics
- Check database size
- Update dependencies if needed

**Monthly:**
- Rotate API keys
- Review security logs
- Database backup verification

### Backup Strategy

1. **MongoDB Atlas Automatic Backups:**
   - Enabled by default
   - Retention: 7 days
   - Point-in-time recovery available

2. **Manual Backup:**
   ```bash
   mongodump --uri="your_mongodb_connection_string" --out=/backup/$(date +%Y%m%d)
   ```

3. **Application Files Backup:**
   ```bash
   tar -czf backup-$(date +%Y%m%d).tar.gz /home/username/muskanserver.crownagi.com/
   ```

### Updating the Application

1. **Backup current version:**
   ```bash
   cp -r backend backend-backup-$(date +%Y%m%d)
   ```

2. **Upload new files:**
   - Upload via FTP/SFTP
   - Or use Git pull if repository is set up

3. **Install new dependencies:**
   ```bash
   npm install --production
   ```

4. **Restart application:**
   ```bash
   pm2 restart muskan-backend
   ```

5. **Verify deployment:**
   ```bash
   curl https://muskanserver.crownagi.com/api/health
   pm2 logs muskan-backend
   ```

## Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use strong, unique passwords
   - Rotate API keys regularly

2. **Database Security:**
   - Use strong MongoDB passwords
   - Limit IP access in MongoDB Atlas
   - Enable MongoDB encryption at rest

3. **Application Security:**
   - Keep Node.js and dependencies updated
   - Enable rate limiting
   - Use HTTPS only
   - Implement proper authentication

4. **Server Security:**
   - Keep cPanel and OS updated
   - Use firewall rules
   - Enable fail2ban
   - Regular security audits

## Support & Resources

- **MongoDB Atlas:** https://cloud.mongodb.com
- **Cloudinary Dashboard:** https://cloudinary.com/console
- **cPanel Documentation:** https://docs.cpanel.net
- **PM2 Documentation:** https://pm2.keymetrics.io/docs

## Contact

For deployment issues or questions:
- Email: janeshtimilsena@gmail.com
- Review logs: `pm2 logs muskan-backend`
- Check cPanel error logs: `~/logs/muskanserver.crownagi.com-error_log`
