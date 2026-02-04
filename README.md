# ChatRoom - Random Matching Chat Application

A real-time chat application that connects users randomly for temporary conversations, with the ability to save chats and create group conversations. Built for Bits College students with institutional email authentication.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [User Manual](#user-manual)
- [Architecture Documentation](#architecture-documentation)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

### Random Matching
- Match with random users based on shared interests
- Temporary chats with 15-minute expiration
- Real-time matching with Socket.IO
- Save chats to make them permanent

### Real-Time Messaging
- Instant messaging with Socket.IO
- Text and image messages
- Typing indicators
- Read receipts
- Message history

### Group Chats
- Create groups with saved contacts (2-10 members)
- Group messaging with member avatars
- View group member profiles
- Start one-on-one chats with group members

### User Management
- Clerk authentication with email verification
- User profiles with bio, hobbies, and interests
- Block/unblock users
- Report inappropriate behavior
- Admin dashboard for moderation

### Modern UI
- Dark/Light theme support
- Smooth animations
- Responsive design
- Custom color scheme

## Tech Stack

### Backend
- **Node.js** with **Express** - REST API server
- **TypeScript** - Type-safe development
- **Socket.IO** - Real-time bidirectional communication
- **PostgreSQL** with **Prisma** - User data and relationships
- **MongoDB** with **Mongoose** - Chat messages and temporary data
- **Redis** - Caching and session management
- **Clerk** - Authentication and user management
- **Cloudinary** - Image upload and storage
- **Winston** - Logging

### Mobile App
- **React Native** with **Expo** - Cross-platform mobile app
- **TypeScript** - Type-safe development
- **Expo Router** - File-based navigation
- **Socket.IO Client** - Real-time communication
- **Clerk Expo** - Authentication
- **AsyncStorage** - Local data persistence
- **Axios** - HTTP client

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Redis** (v7 or higher) - [Download](https://redis.io/download/)

### Optional Software
- **Git** - For version control
- **Expo Go** app - For testing on physical devices
- **Android Studio** or **Xcode** - For emulators

### Required Accounts
- **Clerk Account** - [Sign up](https://clerk.com/) for authentication
- **Cloudinary Account** - [Sign up](https://cloudinary.com/) for image storage

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chatroom.git
cd chatroom
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Setup PostgreSQL Database
```bash
# Create database
createdb chatroom

# Or using psql
psql -U postgres
CREATE DATABASE chatroom;
\q
```

#### Setup MongoDB
```bash
# Start MongoDB service
# On Windows:
net start MongoDB

# On macOS (with Homebrew):
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod
```



#### Configure Environment Variables

Create `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database URLs
DATABASE_URL="postgresql://postgres:password@localhost:5432/chatroom?schema=public"
MONGODB_URI="mongodb://localhost:27017/chatroom"
REDIS_URL="redis://localhost:6379"

# Clerk Authentication
CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
CLERK_SECRET_KEY="sk_test_your_secret_key_here"
ALLOWED_EMAIL_DOMAIN="bitscollege.edu.et"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# CORS Configuration
CORS_ORIGIN="http://localhost:8081,http://localhost:19006"
CORS_CREDENTIALS="true"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=100


```

#### Setup Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Enable Email authentication
4. Copy your Publishable Key and Secret Key
5. Add to `.env` file

#### Setup Cloudinary

1. Go to [Cloudinary Console](https://console.cloudinary.com/)
2. Copy your Cloud Name, API Key, and API Secret
3. Add to `.env` file

#### Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 3. Mobile App Setup

#### Install Dependencies
```bash
cd ../mobile
npm install
```

#### Configure Environment Variables

Create `.env` file in the `mobile` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Backend API URL
# For physical device, use your computer's IP address
# For emulator, use localhost
EXPO_PUBLIC_API_URL="http://192.168.1.100:5000/api"

# Clerk Configuration
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
```

**Finding Your IP Address:**
- Windows: `ipconfig` (look for IPv4 Address)
- macOS/Linux: `ifconfig` or `ip addr` (look for inet)

## Configuration

### Backend Configuration

#### Prisma Schema (`backend/prisma/schema.prisma`)
The database schema is already configured. If you need to modify it:

```bash
# After making changes to schema.prisma
npx prisma generate
npx prisma migrate dev --name your_migration_name
```

#### CORS Configuration
Update `CORS_ORIGIN` in `.env` to include your mobile app's URL:
```env
CORS_ORIGIN="http://localhost:8081,http://192.168.1.100:8081"
```

### Mobile Configuration

#### Update API URL
In `mobile/src/services/api/client.ts`, the API URL is automatically set from environment variables:

```typescript
const API_URL = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000/api'
  : 'https://your-production-url.com/api';
```

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:5000`

**Verify Backend is Running:**
- API: http://localhost:5000/api
- Health Check: http://localhost:5000/health
- Prisma Studio: `npx prisma studio` (optional)

### Start Mobile App

```bash
cd mobile
npx expo start
```

**Run on Device:**
- Press `a` for Android emulator
- Press `i` for iOS simulator (macOS only)
- Scan QR code with Expo Go app for physical device

**Troubleshooting Connection:**
If the mobile app can't connect to the backend:
1. Ensure backend is running
2. Check your IP address is correct in `.env`
3. Ensure your phone and computer are on the same network
4. Check firewall settings allow port 5000

## User Manual

### Getting Started

#### 1. Sign Up
1. Open the app
2. Tap "Create Account"
3. Enter your name
4. Enter your Bits College email (@bitscollege.edu.et)
5. Create a password (minimum 8 characters)
6. Tap "Create Account"
7. Check your email for verification code
8. Enter the 6-digit code
9. Tap "Verify"

#### 2. Complete Your Profile
1. Go to "Profile" tab
2. Tap "Edit Profile"
3. Add your information:
   - Bio (optional)
   - Gender (optional)
   - Age (optional)
   - Country (optional)
   - Hobbies (comma-separated, e.g., "Reading, Gaming, Music")
4. Tap "Save Changes"

#### 3. Change Profile Picture
1. Go to "Profile" tab
2. Tap the camera icon on your avatar
3. Choose "Camera" or "Gallery"
4. Crop and confirm
5. Picture updates automatically

### Using Random Match

#### Starting a Match
1. Go to "Match" tab (home screen)
2. Tap "Start Random Match"
3. Wait for a match (up to 5 minutes)
4. When matched, you'll be taken to a temporary chat

#### Temporary Chat
- You have 15 minutes to chat
- Timer shows remaining time at the top
- Chat will expire if not saved

#### Saving a Chat
1. In temporary chat, tap "Save Chat" banner
2. If both users save, chat becomes permanent
3. If only you save, wait for the other user
4. Saved chats appear in "Chats" tab

### Managing Chats

#### Viewing Chats
1. Go to "Chats" tab
2. See all your chats (one-on-one and groups)
3. Unread messages show a badge
4. Tap a chat to open it

#### Sending Messages
1. Open a chat
2. Type your message in the input field
3. Tap send button
4. Or tap image icon to send a photo

#### Chat Features
- **Typing Indicator**: See when the other person is typing
- **Read Receipts**: See when messages are read
- **Online Status**: Green dot shows if user is online
- **Image Messages**: Tap to view full size

#### Deleting a Chat
1. In "Chats" tab, swipe left on a chat
2. Tap "Delete"
3. Confirm deletion
4. Chat is removed from your list

### Creating Groups

#### Create a Group
1. Go to "Chats" tab
2. Tap "Create Group" button
3. Enter group name
4. (Optional) Add group avatar
5. Select members from your saved contacts
6. Must select 2-10 members
7. Tap "Create Group"

#### Group Chat Features
- See sender name and avatar for each message
- Tap a member's avatar to view their profile
- Start one-on-one chat with group members

#### Managing Groups
1. Open a group chat
2. Tap info icon (top right)
3. View group details:
   - Group name and avatar
   - Member list
   - Your role (Admin or Member)

#### Admin Actions
- **Edit Group**: Change name or avatar
- **Add Members**: Invite more people
- **Remove Members**: Remove someone from group
- **Delete Group**: Permanently delete the group

#### Member Actions
- **Leave Group**: Exit the group
- **Start Chat**: Message a member privately

### Blocking Users

#### Block a User
1. Open chat with the user
2. Tap info icon
3. Tap "Block User"
4. Confirm blocking
5. Chat is deleted and user can't contact you

#### View Blocked Users
1. Go to "Profile" tab
2. Tap settings icon
3. Tap "Blocked Users"
4. See list of blocked users

#### Unblock a User
1. In "Blocked Users" list
2. Tap "Unblock" next to their name
3. User can now contact you again

### Reporting Users

#### Report Inappropriate Behavior
1. Open chat with the user
2. Tap info icon
3. Tap "Report User"
4. Select reason:
   - Spam
   - Harassment
   - Inappropriate Content
   - Other
5. (Optional) Add description
6. Tap "Submit Report"
7. Admin will review the report

### Settings

#### Theme
1. Go to "Profile" tab
2. Tap settings icon
3. Toggle "Dark Mode"
4. Theme changes immediately

#### Edit Profile
1. Go to "Profile" tab
2. Tap "Edit Profile"
3. Update your information
4. Tap "Save Changes"

#### Logout
1. Go to "Profile" tab
2. Scroll down
3. Tap "Logout" button
4. Confirm logout

### Tips & Best Practices

#### For Better Matches
- Complete your profile with hobbies
- Be specific about your interests
- Update your profile regularly

#### For Safe Chatting
- Don't share personal information
- Report inappropriate behavior
- Block users who make you uncomfortable
- Use temporary chats to test compatibility

#### For Group Chats
- Give groups descriptive names
- Only add people you've chatted with
- Respect all group members
- Use groups for common interests



## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All API requests (except `/auth/sync`) require a Clerk JWT token in the Authorization header:
```
Authorization: Bearer <clerk_jwt_token>
```

### Endpoints

#### Authentication
- `POST /auth/sync` - Sync Clerk user to database
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout user

#### Users
- `GET /users/:id` - Get user by ID
- `PUT /users/profile` - Update profile
- `GET /users/search` - Search users
- `POST /users/report` - Report user

#### Matching
- `POST /match/start` - Start random matching
- `POST /match/cancel` - Cancel search
- `GET /match/status` - Get current match status
- `POST /match/save` - Save temporary chat

#### Chats
- `GET /chats` - Get user's chats
- `GET /chats/:chatId` - Get chat details
- `DELETE /chats/:chatId` - Delete saved chat
- `POST /chats/group-member-chat` - Start chat with group member

#### Groups
- `POST /groups` - Create group
- `GET /groups` - Get user's groups
- `GET /groups/:id` - Get group details
- `PUT /groups/:id` - Update group
- `DELETE /groups/:id` - Delete group
- `POST /groups/:id/members` - Add member
- `DELETE /groups/:id/members/:userId` - Remove member

#### Messages
- `GET /messages/:chatId` - Get messages for chat
- `POST /messages/:chatId` - Send message
- `PUT /messages/:id/read` - Mark message as read

#### Blocking
- `POST /block/:userId` - Block user
- `DELETE /block/:userId` - Unblock user
- `GET /block` - Get blocked users

#### Upload
- `POST /upload/image` - Upload image to Cloudinary

#### Admin
- `GET /admin/reports` - Get all reports
- `PUT /admin/reports/:id` - Update report status
- `POST /admin/ban/:userId` - Ban user
- `POST /admin/unban/:userId` - Unban user

### Socket.IO Events

#### Client → Server
- `message:send` - Send a message
- `message:read` - Mark message as read
- `typing:start` - Start typing
- `typing:stop` - Stop typing
- `group:join` - Join group room
- `group:leave` - Leave group room

#### Server → Client
- `match:found` - Match found notification
- `match:timeout` - Match search timeout
- `message:new` - New message received
- `message:read` - Message read receipt
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline
- `chat:deleted` - Chat was deleted







## Project Structure

```
ChatRoom/
├── backend/                 # Node.js backend server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── sockets/        # Socket.IO handlers
│   │   ├── jobs/           # Background jobs
│   │   ├── scripts/        # Utility scripts
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helper functions
│   ├── prisma/             # Prisma schema and migrations
│   └── logs/               # Application logs
│
└── mobile/                  # React Native mobile app
    ├── app/                # Expo Router pages
    │   ├── (auth)/         # Authentication screens
    │   ├── (tabs)/         # Main tab screens
    │   ├── chat/           # Chat screens
    │   ├── group/          # Group screens
    │   ├── matching/       # Matching screens
    │   └── settings/       # Settings screens
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── context/        # React Context providers
    │   ├── hooks/          # Custom React hooks
    │   ├── services/       # API and Socket services
    │   ├── theme/          # Theme configuration
    │   ├── types/          # TypeScript types
    │   └── utils/          # Helper functions
    └── assets/             # Images and static files
```


