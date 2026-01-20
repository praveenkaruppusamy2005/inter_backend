# Keep Backend Always Active (Free Solution)

Your Render backend goes to sleep after 15 minutes of inactivity on the free tier. Here are free solutions to keep it awake:

## Option 1: UptimeRobot (Recommended - Free)

1. Go to https://uptimerobot.com/
2. Sign up for a free account
3. Click "Add New Monitor"
4. Configure:
   - Monitor Type: HTTP(s)
   - Friendly Name: InterviewPro Backend
   - URL: `https://inter-backend-lpmb.onrender.com/health`
   - Monitoring Interval: 5 minutes (free tier)
5. Click "Create Monitor"

**Result:** Your backend will be pinged every 5 minutes, keeping it awake 24/7.

---

## Option 2: Cron-Job.org (Free Alternative)

1. Go to https://cron-job.org/
2. Sign up for a free account
3. Click "Create Cronjob"
4. Configure:
   - Title: Keep InterviewPro Backend Alive
   - URL: `https://inter-backend-lpmb.onrender.com/health`
   - Execution: Every 10 minutes
5. Save

---

## Option 3: Render Paid Plan (Best for Production)

Upgrade your Render service to a paid plan ($7/month):
- No sleep time
- Better performance
- More reliable
- Professional solution

Go to: https://dashboard.render.com/ → Select your service → Upgrade

---

## Option 4: Self-Ping (Built into Backend)

The backend can ping itself, but this is less reliable:

Add to `backend/server.js`:

```javascript
// Keep-alive ping (only works while backend is awake)
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    try {
      await fetch('https://inter-backend-lpmb.onrender.com/health');
      console.log('🏓 Keep-alive ping sent');
    } catch (error) {
      console.error('❌ Keep-alive ping failed:', error.message);
    }
  }, 10 * 60 * 1000); // Every 10 minutes
}
```

**Note:** This only works while the backend is already awake, so it's not a complete solution.

---

## Current Status

Your backend is configured and working at:
- **URL:** https://inter-backend-lpmb.onrender.com
- **Health Check:** https://inter-backend-lpmb.onrender.com/health

The app will automatically wake up the backend when users try to login, but there will be a 10-30 second delay on first login after sleep.

**Recommendation:** Use UptimeRobot (Option 1) - it's free, reliable, and takes 2 minutes to setup.
