# CivicVoice Backend API

Backend API for the CivicVoice civic issue reporting platform.

## Features

- **Authentication**: User registration, login, JWT token management
- **Issues Management**: CRUD operations for civic issues
- **User Profiles**: User profile management and statistics
- **Upvoting System**: Users can upvote/downvote issues
- **File Upload**: Support for issue images
- **Real-time Integration**: Supabase integration for real-time updates

## Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** - Web framework
- **Supabase** - Backend-as-a-Service (Database, Auth, Storage)
- **JWT** - Authentication tokens
- **Express Validator** - Input validation
- **Multer** - File uploads
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - Request logging
- **Rate Limiting** - API protection

## Project Structure

```
src/
├── controllers/     # Request handlers
├── middleware/      # Custom middleware (auth, validation)
├── routes/         # API route definitions
├── services/       # External service integrations
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── index.ts        # Main application entry point
```

## Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@civicvoice.app
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. Build the project:
```bash
npm run build
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Issues
- `GET /api/issues` - Get all issues (with filtering)
- `GET /api/issues/:id` - Get single issue
- `POST /api/issues` - Create new issue (authenticated)
- `PUT /api/issues/:id` - Update issue (owner only)
- `DELETE /api/issues/:id` - Delete issue (owner only)
- `POST /api/issues/:id/upvote` - Toggle upvote (authenticated)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/issues` - Get user's issues
- `GET /api/users/upvoted` - Get user's upvoted issues
- `GET /api/users/stats` - Get user statistics

### Health Check
- `GET /health` - API health status

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human readable error message",
  "details": [] // Optional validation details
}
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Request validation with express-validator
- **JWT Authentication**: Secure token-based auth
- **Environment Variables**: Secure configuration management

## Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profile information
- `civic_issues` - Issue reports
- `issue_comments` - Comments on issues
- `issue_upvotes` - User votes on issues

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include input validation
4. Write clear API documentation
5. Test all endpoints before submitting

## License

MIT License
