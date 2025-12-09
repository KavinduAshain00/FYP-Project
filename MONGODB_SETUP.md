# MongoDB Setup Instructions

## Quick MongoDB Setup for GamiLearn

### Option 1: Install MongoDB Locally (macOS)

#### Using Homebrew:
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB as a service
brew services start mongodb-community

# Verify it's running
brew services list | grep mongodb
```

#### Manual Start:
```bash
# Start MongoDB manually
mongod --config /usr/local/etc/mongod.conf --fork

# Or with default settings
mongod --dbpath ~/data/db
```

### Option 2: MongoDB Atlas (Cloud - Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a free cluster (M0)
4. Get your connection string
5. Update `backend/.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/gamilearn?retryWrites=true&w=majority
```

### Option 3: Docker

```bash
# Pull and run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Check if running
docker ps | grep mongodb
```

## Verify Connection

After starting MongoDB, test the connection:

```bash
cd backend
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/gamilearn').then(() => { console.log('✅ Connected!'); process.exit(0); }).catch(err => { console.error('❌ Error:', err.message); process.exit(1); });"
```

## Seed the Database

Once MongoDB is running and connected:

```bash
cd backend
npm run seed
```

Expected output:
```
MongoDB connected
Cleared existing modules
Inserted 6 sample modules
Seed completed successfully!
```

## Verify Data

### Using MongoDB Shell:
```bash
mongosh

use gamilearn
db.modules.find().pretty()
db.users.find().pretty()
```

### Using MongoDB Compass (GUI):
1. Download from https://www.mongodb.com/products/compass
2. Connect to `mongodb://localhost:27017`
3. Browse the `gamilearn` database

## Common Issues

### Port 27017 Already in Use
```bash
# Find process using the port
lsof -i :27017

# Kill the process
kill -9 <PID>

# Or stop all MongoDB services
brew services stop mongodb-community
```

### Permission Denied
```bash
# Create data directory with proper permissions
sudo mkdir -p /usr/local/var/mongodb
sudo chown -R $(whoami) /usr/local/var/mongodb
```

### Connection Timeout
- Check firewall settings
- Verify MongoDB is running: `ps aux | grep mongod`
- Check MongoDB logs: `tail -f /usr/local/var/log/mongodb/mongo.log`

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  knowsJavaScript: Boolean,
  learningPath: String ('javascript-basics' | 'advanced' | 'none'),
  completedModules: [{
    moduleId: ObjectId,
    completedAt: Date
  }],
  currentModule: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Modules Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  difficulty: String ('beginner' | 'intermediate' | 'advanced'),
  category: String ('javascript-basics' | 'game-development' | 'advanced-concepts'),
  order: Number,
  content: String,
  starterCode: {
    html: String,
    css: String,
    javascript: String
  },
  objectives: [String],
  hints: [String],
  createdAt: Date,
  updatedAt: Date
}
```

## Sample Data

After seeding, you'll have:
- 2 JavaScript Basics modules
- 4 Game Development modules

All modules include:
- Starter code for HTML, CSS, and JavaScript
- Learning objectives
- Helpful hints
- Appropriate difficulty levels

---

**Once MongoDB is running and seeded, your backend will be fully operational!** 🚀
