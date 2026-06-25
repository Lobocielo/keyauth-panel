# LicensePanel

Self-hosted license and key management system, inspired by KeyAuth.

## Features

- **License Key Generation** - Generate subscription and lifetime keys
- **User Management** - Register, login, ban/unban users
- **HWID Locking** - Hardware ID binding for security
- **Public API** - External apps can validate users and keys
- **Dashboard** - Real-time stats and management
- **JWT Authentication** - Secure session management

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/keyauth-panel.git
cd keyauth-panel

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your JWT_SECRET

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default login:** `admin` / `admin` (change immediately!)

## API for External Apps

### Initialize Session (Login)

```bash
POST /api/validate
Content-Type: application/json

{
  "type": "login",
  "name": "YourAppName",
  "ownerid": 1,
  "secret": "your-app-secret",
  "sessionid": "",
  "username": "user1",
  "password": "pass123",
  "hwid": "optional-hwid"
}
```

### Register User

```bash
POST /api/validate
Content-Type: application/json

{
  "type": "register",
  "name": "YourAppName",
  "ownerid": 1,
  "secret": "your-app-secret",
  "sessionid": "",
  "username": "newuser",
  "password": "pass123"
}
```

### Validate License Key

```bash
POST /api/validate/license
Content-Type: application/json

{
  "key": "XXXXX-XXXXX-XXXXX-XXXXX",
  "hwid": "optional-hwid"
}
```

## Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables:
   - `JWT_SECRET` = a strong random string
   - `DATABASE_URL` = your Turso database URL (for production)
4. Deploy!

For production with Turso:
```bash
npm install @libsql/client
# Set DATABASE_URL=libsql://your-db.turso.io
# Set DATABASE_AUTH_TOKEN=your-token
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Admin authentication
│   │   ├── keys/          # Key management
│   │   ├── users/         # User management
│   │   ├── stats/         # Dashboard stats
│   │   └── validate/      # Public API for external apps
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Login page
│   └── register/          # Register page
├── lib/
│   ├── auth.ts            # JWT & token utilities
│   ├── db.ts              # Database connection
│   └── utils.ts           # Helper functions
└── middleware.ts           # Auth middleware
```

## License

MIT
