# PokerPal Application - Quick Start Guide

## 🎉 Your PokerPal app is ready to use!

Both servers are currently running:

### Backend Server (API)
- **URL**: http://localhost:3000
- **Status**: ✅ Running
- **Health Check**: http://localhost:3000/api/health

### Frontend Server (Web App)
- **URL**: http://localhost:8080
- **Status**: ✅ Running
- **Access**: Open http://localhost:8080 in your browser

## 🚀 What You Can Do Now

### 1. **Create Your Profile**
- Go to http://localhost:8080
- Click "Create a profile" or enter a computing ID and click "Create Profile"
- Fill in your information (Computing ID, name, experience, etc.)

### 2. **Login and Explore**
- Use your Computing ID to log in
- Explore the home dashboard
- View your profile information

### 3. **Track Poker Sessions**
- Click "Session Tracking" from the home page
- **Check In**: Start a new poker session
  - Select today's date (auto-filled)
  - Enter your starting chip amount or use chip breakdown
  - Upload a photo of your chip stack (optional)
  - Click "Check In"

- **Check Out**: End your poker session
  - Enter your ending chip amount or use chip breakdown
  - Upload a photo of your final chip stack (optional)
  - Click "Check Out"
  - View your net winnings!

### 4. **View Leaderboard**
- Click "Leaderboard" to see player rankings
- See total winnings for all players

### 5. **Edit Your Profile**
- Click "Profile" to update your information
- Change experience level, major, etc.

## 🎯 Current Features Working

✅ **Authentication System**
- Login with Computing ID
- Profile creation and editing
- Session management

✅ **Player Management**
- Create and update profiles
- View player statistics
- Leaderboard functionality

✅ **Session Tracking**
- Check-in and check-out system
- Photo upload for verification
- Chip counting with breakdown
- Automatic winnings calculation
- Session history

✅ **Database Integration**
- SQLite database with all tables
- Data persistence
- Audit logging

## 🔧 Technical Details

### Database
- Location: `server/database/poker_tracker.db`
- Tables: players, entries, chip_values, audit_logs
- Default chip values: White($1), Red($2), Green($5), Black($20), Blue($50)

### API Endpoints Available
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/players` - Create player profile
- `GET /api/players/:id` - Get player info
- `PUT /api/players/:id` - Update player
- `GET /api/players/leaderboard` - Get leaderboard
- `POST /api/sessions` - Check-in/check-out
- `GET /api/sessions/:id` - Get player sessions
- And many more...

## 🐛 If Something Goes Wrong

### Restart Backend Server
```bash
cd server
npm start
```

### Restart Frontend Server
```bash
python -m http.server 8080
```

### Reset Database
```bash
cd server
npm run reset-db
```

## 🎮 Try It Out!

**Open your browser and go to: http://localhost:8080**

1. Create a profile with a unique Computing ID
2. Log in with your Computing ID
3. Start a poker session (check-in)
4. End the session (check-out) with different chip amounts
5. See your winnings calculated automatically!
6. Check the leaderboard to see your ranking

Enjoy your PokerPal app! 🃏💰