📋 Table of Contents
About The Project
Features
Tech Stack
Architecture
Getting Started
Installation
Usage
API Documentation
Contributing
License
Contact
🎯 About The Project
CivicVoice is a modern, mobile-first Progressive Web Application (PWA) designed to bridge the gap between citizens and local governments. It enables users to report civic issues, track their resolution status, and engage with their community through an intuitive and accessible platform.

🌟 Why CivicVoice?
🚀 Instant Reporting: Quick and easy issue reporting with photo uploads and location tracking
📱 Mobile-First: Optimized for mobile devices with PWA capabilities
🔄 Real-Time Updates: Live status updates and community engagement features
🎨 Modern UI/UX: Clean, accessible interface built with Tailwind CSS and shadcn/ui
🔒 Secure: Robust authentication and data protection with Supabase
✨ Features
🏗️ Core Functionality
Issue Reporting: Report civic issues with photos, location, and detailed descriptions
Category Management: Organize issues by type (Infrastructure, Environment, Safety, etc.)
Priority Levels: Set issue priority (Low, Medium, High)
Status Tracking: Track issues from submission to resolution
Community Engagement: Upvote issues and add comments
👤 User Experience
Authentication: Secure email/password authentication
User Profiles: Customizable user profiles with display names and avatars
Dashboard: Personal dashboard to track submitted issues and activity
Filters & Search: Advanced filtering by status, category, and priority
Notifications: Real-time updates on issue status changes
📱 Technical Features
Progressive Web App: Installable on mobile devices
Responsive Design: Works seamlessly across all device sizes
Offline Capabilities: Basic functionality available offline
Real-time Updates: Live data synchronization with Supabase
Image Upload: Photo capture and upload for issue documentation
🛠️ Tech Stack
Frontend
Framework: React 18.3.1 with TypeScript
Build Tool: Vite with SWC
Styling: Tailwind CSS 3.4.17
UI Components: shadcn/ui (Radix UI primitives)
Forms: React Hook Form + Zod validation
State Management: TanStack React Query
Icons: Lucide React
Backend
Runtime: Node.js 18.x
Framework: Express.js 4.x
Language: TypeScript
Authentication: JWT + bcrypt
Validation: express-validator
Security: Helmet, CORS, Rate limiting
Database & Services
Database: Supabase (PostgreSQL)
Authentication: Supabase Auth
File Storage: Supabase Storage
Real-time: Supabase Realtime subscriptions
Email: SMTP integration (configurable)
DevOps & Tools
Package Manager: npm
Code Quality: ESLint + TypeScript
Development: Hot Module Replacement
Environment: dotenv for configuration
🏗️ Architecture
Key Components
Frontend: React SPA with TypeScript and modern tooling
Backend: RESTful API with Express.js and comprehensive middleware
Database: Supabase for data storage, authentication, and real-time features
Integration: Dual-mode operation (Backend API + Direct Supabase fallback)
🚀 Getting Started
Prerequisites
Ensure you have the following installed:

Node.js 18.x or higher
npm 9.x or higher
Git for version control
Environment Setup
You'll need to set up environment variables for both frontend and backend:

Supabase Account: Create a free account at supabase.com
Project Setup: Create a new Supabase project
API Keys: Get your project URL and API keys from the Supabase dashboard
💾 Installation
1. Clone the Repository
2. Backend Setup
Create .env file in the backend directory:

3. Frontend Setup
Create .env file in the frontend directory:

4. Database Setup
Run the SQL migrations in your Supabase project:

Create storage bucket for issue images:

🎮 Usage
Start Development Servers
Backend Server
Server will start on http://localhost:5000

Frontend Server
Application will be available at http://localhost:8080

Building for Production
Backend
Frontend
📚 API Documentation
Authentication Endpoints
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	User login
POST	/api/auth/refresh	Refresh JWT token
POST	/api/auth/logout	User logout
GET	/api/auth/me	Get current user
Issues Endpoints
Method	Endpoint	Description
GET	/api/issues	Get all issues (with filters)
GET	/api/issues/:id	Get specific issue
POST	/api/issues	Create new issue
PUT	/api/issues/:id	Update issue
DELETE	/api/issues/:id	Delete issue
POST	/api/issues/:id/upvote	Toggle upvote
POST	/api/issues/:id/comments	Add comment
Users Endpoints
Method	Endpoint	Description
GET	/api/users/profile	Get user profile
PUT	/api/users/profile	Update profile
GET	/api/users/issues	Get user's issues
GET	/api/users/upvoted	Get upvoted issues
GET	/api/users/stats	Get user statistics
Example API Calls
Create Issue
Get Issues with Filters
🤝 Contributing
We welcome contributions to CivicVoice! Here's how you can help:

Development Process
Fork the Repository

Create Feature Branch

Make Changes

Follow the existing code style
Add tests for new features
Update documentation as needed
Commit Changes

Push to Branch

Open Pull Request

Code Style Guidelines
TypeScript: Use strict type checking
React: Functional components with hooks
CSS: Tailwind CSS classes, avoid custom CSS
Commits: Use conventional commit messages
Testing
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

📞 Contact
Project Maintainer: Your Name

Email: your.email@example.com
LinkedIn: Your LinkedIn
Twitter: @yourusername
Project Links:

Repository: https://github.com/yourusername/civicvoice
Issues: https://github.com/yourusername/civicvoice/issues
Discussions: https://github.com/yourusername/civicvoice/discussions
🙏 Acknowledgments
Supabase Team for the excellent Backend-as-a-Service platform
Vercel Team for React and the amazing developer experience
Tailwind CSS Team for the utility-first CSS framework
shadcn for the beautiful UI component library
Open Source Community for the amazing tools and libraries
<div align="center">
Built with ❤️ for better civic engagement
