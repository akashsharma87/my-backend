# Engineer.CV

A full-stack web application that connects engineers with employers through an intelligent resume management and browsing platform. Engineers can upload and manage their resumes, while employers can browse and discover qualified candidates.

## 🎯 Features

### For Engineers
- **Resume Upload & Management**: Upload resumes in multiple formats (PDF, DOCX, etc.)
- **Resume Parsing**: Automatic extraction of key information from resumes using OCR and document parsing
- **Profile Management**: Create and maintain a professional profile
- **Dashboard**: View and manage uploaded resumes
- **Authentication**: Secure login with email/password or OAuth (Google, GitHub)

### For Employers
- **Resume Browser**: Search and browse engineer resumes
- **Advanced Filtering**: Filter candidates by skills, experience, and qualifications
- **Resume Viewing**: Detailed view of candidate resumes
- **Dashboard**: Manage job postings and candidate interactions

### General Features
- **Responsive Design**: Mobile-friendly interface built with React and Tailwind CSS
- **Security**: Comprehensive security measures including rate limiting, input sanitization, and helmet protection
- **Performance**: Optimized caching, database indexing, and compression
- **Scalability**: Production-ready with clustering support and Docker deployment
- **Testing**: Unit, integration, and E2E tests with Vitest and Playwright

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **Node.js & Express** - Server framework
- **MongoDB & Mongoose** - Database
- **Passport.js** - Authentication (OAuth support)
- **JWT** - Token-based authentication
- **Multer** - File upload handling
- **Tesseract.js** - OCR for resume parsing
- **pdf-parse** - PDF document parsing
- **docx-parser** - DOCX document parsing

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PM2** - Process management
- **Nginx** - Reverse proxy
- **Redis** - Caching layer

### Testing & Quality
- **Vitest** - Unit and integration testing
- **Playwright** - E2E testing
- **ESLint** - Code linting
- **Testing Library** - React component testing

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Docker** (optional, for containerized deployment)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd engineer.cv-dev
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URL=mongodb://localhost:27017/engineer-cv

# Authentication
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OpenAI (Optional, for AI features)
OPENAI_API_KEY=your_openai_api_key

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### 4. Start Development Server
```bash
npm run dev
```

This runs both the frontend (Vite on port 5173) and backend (Express on port 3000) concurrently.

## 📦 Available Scripts

### Development
- `npm run dev` - Start both client and server in development mode
- `npm run client` - Start Vite dev server only
- `npm run server` - Start Express server with nodemon

### Building
- `npm run build` - Build for production
- `npm run build:analyze` - Build and analyze bundle size
- `npm run build:performance` - Build with performance optimizations

### Testing
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Generate coverage report
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:e2e` - Run end-to-end tests with Playwright

### Linting & Quality
- `npm run lint` - Run ESLint
- `npm run audit:security` - Security audit
- `npm run test:performance` - Performance testing

### Deployment
- `npm run start` - Start production server
- `npm run start:production` - Start with production environment
- `npm run start:staging` - Start with staging environment
- `npm run deploy` - Deploy to production
- `npm run deploy:staging` - Deploy to staging

### Docker
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Start Docker containers
- `npm run docker:stop` - Stop Docker containers
- `npm run docker:logs` - View Docker logs

### Database & Maintenance
- `npm run optimize:db` - Create database indexes
- `npm run backup:db` - Backup MongoDB database
- `npm run backup:files` - Backup uploaded files
- `npm run maintenance:cleanup` - Clean up old logs and backups

## 📁 Project Structure

```
engineer.cv-dev/
├── src/                    # Frontend React application
│   ├── components/         # Reusable React components
│   ├── pages/             # Page components
│   ├── context/           # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── App.tsx            # Main App component
├── server/                # Backend Express application
│   ├── routes/            # API routes
│   ├── models/            # Mongoose schemas
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   ├── config/            # Configuration files
│   ├── utils/             # Utility functions
│   └── __tests__/         # Server tests
├── e2e/                   # End-to-end tests
├── public/                # Static assets
├── uploads/               # User-uploaded files
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

## 🔐 Security Features

- **Helmet.js** - HTTP headers security
- **Rate Limiting** - Prevent brute force attacks
- **Input Sanitization** - MongoDB injection prevention
- **CORS** - Cross-origin resource sharing control
- **HPP** - HTTP Parameter Pollution protection
- **Password Hashing** - bcryptjs for secure password storage
- **JWT** - Secure token-based authentication
- **Session Management** - Secure session handling

## 🚢 Deployment

### Docker Deployment
```bash
npm run docker:build
npm run docker:run
```

### PM2 Deployment
```bash
npm run pm2:start
npm run pm2:logs
npm run pm2:restart
```

### Manual Deployment
```bash
npm run build
npm run start:production
```

## 📊 Monitoring & Health Checks

- `/api/health` - Health check endpoint
- `/api/metrics` - Performance metrics
- `/api/performance` - Detailed performance statistics
- `/api/status` - Server status

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For support, email support@engineer.cv or open an issue in the repository.

---

**Happy coding! 🎉**

