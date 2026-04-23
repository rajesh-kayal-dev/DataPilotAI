# DataPilotAI

**AI-Powered Document Intelligence Platform**

DataPilotAI is a comprehensive solution for intelligent document processing, enabling users to upload, analyze, and extract insights from documents using advanced AI technologies including RAG (Retrieval-Augmented Generation) and multi-agent AI pipelines.

## Features

- **Document Chat**: Ask questions and get precise answers from your documents
- **Multi-Agent AI**: Run parallel AI agents across multiple documents
- **Semantic Search**: Find exact information across thousands of pages
- **Smart Outputs**: Get structured data in JSON, CSV, or Markdown formats
- **Google Authentication**: Secure login with Google OAuth
- **Workspace Management**: Organize documents into projects/workspaces

## Tech Stack

**Frontend:**
- React.js with TypeScript
- Vite for fast builds
- Tailwind CSS for styling
- React Router for navigation

**Backend:**
- Node.js with Express
- MongoDB for data storage
- Redis for caching
- JWT for authentication

**AI Services:**
- Custom RAG implementation
- Multi-agent orchestration
- Semantic search with vector embeddings

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/DataPilotAI.git
   cd DataPilotAI


2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file based on `.env.example`
   - Add your MongoDB connection string
   - Add your Google OAuth credentials
   - Set your JWT secret

4. Run the development server:
   ```bash
   npm run dev
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Backend
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
REDIS_URL=your_redis_connection_string

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Frontend
VITE_BACKEND_URL=http://localhost:5000
```

## Project Structure

```
DataPilotAI/
├── client/          # Frontend application
├── server/          # Backend application
├── .gitignore
├── package.json
└── README.md
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature-name`)
5. Open a Pull Request

## License

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


