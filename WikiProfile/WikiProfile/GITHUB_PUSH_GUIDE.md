# How to Push pixelsWIKI to GitHub

## Step-by-Step Instructions

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `pixelsWIKI`
3. Description: `Vietnamese wiki profile platform with moderation`
4. Choose: Public or Private
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"

### Step 2: Get Your Repository URL
After creating, you'll see:
```
https://github.com/yourusername/pixelsWIKI.git
```
Copy this URL

### Step 3: Push Code to GitHub

**Option A: From Replit (Easiest)**
1. In Replit, go to Version Control (left sidebar)
2. Click "Connect to GitHub"
3. Follow Replit's OAuth flow
4. Select the pixelsWIKI repository
5. Replit will handle git pushes automatically

**Option B: Manual Git from Command Line**

From your local machine:
```bash
# Clone to your computer
git clone https://github.com/yourusername/pixelsWIKI.git
cd pixelsWIKI

# Verify files are there
ls -la
# You should see:
# - client/
# - server/
# - shared/
# - README.md
# - .env.example
# - package.json
# etc.

# Create initial commit
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "Initial commit: pixelsWIKI platform

- User authentication (Replit Auth + Password signup)
- Wiki entry creation and management
- Admin moderation with card-based UI
- Developer panel for role management
- PostgreSQL persistence
- SEO optimization"

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Verify on GitHub
1. Go to https://github.com/yourusername/pixelsWIKI
2. You should see all your files
3. README.md will show as the project description

### Step 5: GitHub Settings

**Add Topics** (helps with discovery):
1. Click gear icon (Settings)
2. Scroll to "Topics"
3. Add: `react`, `express`, `postgres`, `wiki`, `moderation`, `authentication`

**Enable Features** (Optional but recommended):
1. Enable "Discussions" (for community)
2. Enable "Issues" (for bug reports)
3. Add Contributing guidelines (CONTRIBUTING.md)

## Configuration for Production

### Update Environment Variables
Whoever deploys needs to set:
```
DATABASE_URL = production_database_url
SESSION_SECRET = strong_random_secret_32_chars_minimum
ADMIN_EMAILS = admin@example.com
```

**Generate secure SESSION_SECRET:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Deploy (Replit or Other Platform)

**On Replit:**
1. Import from GitHub (Projects → New Project → Import from GitHub)
2. Select pixelsWIKI repository
3. Replit sets up workspace automatically
4. Go to Secrets tab and add environment variables
5. Click "Publish" button for public URL

**On Railway/Render/Heroku:**
Follow their GitHub import process, then:
1. Set environment variables in dashboard
2. Deploy
3. Test at your domain

## Project Contents Checklist

Before pushing, verify these files exist:

```
✅ README.md - Main documentation
✅ DEPLOYMENT.md - Deployment guide
✅ GITHUB_PUSH_GUIDE.md - This file
✅ replit.md - Internal documentation
✅ .env.example - Template for environment variables
✅ .gitignore - What not to commit
✅ package.json - Node dependencies
✅ tsconfig.json - TypeScript config
✅ vite.config.ts - Frontend bundler config
✅ drizzle.config.ts - Database config
✅ client/ - React frontend
✅ server/ - Express backend
✅ shared/ - Shared types
```

## After Pushing: What to Do Next

### 1. **Test the Live Version**
   - Deploy on Replit or your platform
   - Test signup with password
   - Test OAuth login
   - Test admin dashboard
   - Test moderation features

### 2. **Share with Team**
   - GitHub repo link
   - Live demo URL
   - Admin credentials (for testing)

### 3. **Create Issues for Improvements**
   - Features you want to add
   - Bugs to fix
   - Performance improvements

### 4. **Add CI/CD (Optional)**
   Create `.github/workflows/test.yml` for automated testing

### 5. **Documentation Updates**
   - Add screenshots to README
   - Create CONTRIBUTING.md
   - Add ROADMAP.md for future features

## Common Issues

### Error: "fatal: not a git repository"
```bash
cd pixelsWIKI
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/pixelsWIKI.git
git push -u origin main
```

### Error: "Permission denied (publickey)"
Set up SSH keys:
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
# Add to GitHub: Settings → SSH Keys
```

### Files not pushing
```bash
# Make sure .gitignore isn't excluding them
git status  # See what's staged
git add .
git commit -m "message"
git push
```

## Support

- **GitHub Issues**: https://github.com/yourusername/pixelsWIKI/issues
- **GitHub Discussions**: https://github.com/yourusername/pixelsWIKI/discussions
- **Replit Community**: https://replit.com/community

---

**You're ready to share pixelsWIKI with the world! 🚀**
