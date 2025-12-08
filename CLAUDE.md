# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iPaduPay is a Node.js/TypeScript backend API for managing group payments and expense splitting. It uses Express.js, PostgreSQL (Prisma), and Firebase Cloud Messaging for push notifications.

## Development Commands

### Setup
```bash
npm install
```

### Environment Configuration
Create a `.env` file with:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/ipadupay?schema=public"
API_SERVER_PORT=8081
JWT_SECRET=your_secret_key
DOCKER_ENV=true  # Optional: for Docker deployment
```

### Development
```bash
npm run dev        # Run with nodemon (auto-reload)
npm run watch      # TypeScript watch mode
```

### Build & Production
```bash
npm run build      # Compile TypeScript to dist/
npm start          # Run compiled app from dist/
```

### Docker Deployment
```bash
docker-compose up  # Run API + MongoDB
```

## Architecture

### Core Models & Relationships

Defined in `prisma/schema.prisma`.

1. **User**
   - Stores user credentials and FCM tokens

2. **Group**
   - Represents payment groups

3. **GroupMember**
   - Tracks individual user amounts and payment status in groups
   - Many-to-Many relation with explicit fields `amount` and `payStatus`

4. **Friend**
   - Manages friendship relationships

### Request Flow

```
Client Request
  → Express Middleware (CORS, JSON parsing)
  → Route Handler (/api/users, /api/friends, /api/group)
  → Controller Function
  → Model/Database Operations
  → Response (JSON with success/data/message format)
```

### Authentication
- JWT-based auth middleware exists in `src/middleware/auth.ts` but is currently **not actively used** in routes
- Auth header format: `Authorization: Bearer <token>`
- Token includes `userID` and `userName` payload

### Firebase Integration
- Configured in `src/config/firebase.ts`
- Service account credentials stored in `src/config/firebase/payoffbar-firebase-adminsdk-p5hxp-fcd8e8ca1d.json`
- Used for push notifications:
  - Payment reminders (`notifyUnpaidMembers`)
  - Payment status updates (`notifyUpdatePaymentStatus`)

### Database Connection
- PostgreSQL (Prisma) configuration in `prisma/schema.prisma`
- Auto-detects Docker environment via `DOCKER_ENV` variable
- Docker: `postgresql://postgres:password@postgres:5432/ipadupay`
- Local: `postgresql://postgres:password@localhost:5432/ipadupay`

## API Endpoints

### Users (`/api/users`)
- `POST /register` - Create new user
- `POST /login` - Login and update FCM token

### Friends (`/api/friends`)
- `POST /addFriend` - Add friend (auto-accepted)
- `POST /getFriendshipList` - Get user's friend list

### Groups (`/api/group`)
- `POST /create` - Create payment group with members
- `POST /edit` - Edit group name/members/amounts
- `GET /getUserGroup/:userID` - Get all groups for user
- `GET /getGroupDetail/:groupID` - Get group details with members
- `DELETE /deleteGroup/:groupID` - Delete group and all members
- `GET /notifyUnpaidMembers/:groupID` - Send FCM notifications to unpaid members
- `GET /notifyUpdatePaymentStatus/:groupID/:userID/:status` - Update payment status and notify user

## Key Implementation Details

### Group Member Management
When editing groups (`editGroup` controller):
1. Compare existing vs new member lists
2. Delete removed members
3. Add new members (with `payStatus: false`)
4. Update amounts/status for existing members
5. Return all current members with user names

### Friend System
- Bidirectional relationship stored as single record
- `getFriendshipList` uses aggregation to handle both `userID` and `friendID` matches
- Currently auto-accepts all friend requests (no pending approval flow)

### Push Notifications
- Require `fcmToken` to be present in User document
- Only users with registered FCM tokens receive notifications
- Notification data includes `groupID` and `type` for client-side routing

## Important Notes

- TypeScript strict mode enabled
- All API responses follow format: `{ success: boolean, data?: any, message?: string }`
- No input validation middleware currently implemented
- Error handling uses try-catch with 500 status codes
- Firebase service account JSON should be in `.gitignore`
- Port defaults to 8081 if `API_SERVER_PORT` not set
