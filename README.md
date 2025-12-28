# EduStealth - Stealthy Chat Application

**EduStealth** is a sophisticated full-stack MERN application designed to masquerade as a legitimate educational content platform ("EduStealth"). While it functions as a Learning Management System (LMS) for browsing courses and assignments, its true purpose is to provide a hidden, encrypted, and panic-proof real-time chat interface.

> **Privacy Focused**: The chat interface is completely invisible until a specific "stealth trigger" is activated.

## 🌟 Key Features

### 🛡️ Stealth & Privacy
- **Covert Interface**: The default view is a fully functional educational dashboard with Courses, Assignments, and Profile pages.
- **Stealth Trigger**: The chat UI is only revealed when the user types a specific keyword (default: **"stealth"**) into the main search bar.
- **Panic Mode**: Quickly press **`Escape` twice (Double-Tap)** to immediately close the chat and redirect to the safe "Courses" page.
- **Decoy Mode**: Users flagged as "Decoy" will see a harmless "Notes App" instead of the main application, adding another layer of deniability.

### 💬 Secure Messaging
- **Real-Time Chat**: Instant messaging powered by **Socket.IO**.
- **End-to-End Encryption**: Messages are encrypted client-side using **AES** before transmission and storage.
- **Self-Destruct**: Messages can be set to auto-delete after being read, based on connection settings.
- **Typing Indicators**: Live status showing when other users are typing.
- **Read Receipts**: Know when your messages have been seen.
- **Media Support**: Send images securely (Cloudinary integration).

### 📚 Educational Dashboard (Cover Story)
- **Course Listing**: Browse and view details of fake/real courses.
- **Assignment Tracker**: Track pending and completed assignments.
- **Profile Management**: Manage user details (Student persona).

## 🛠️ Tech Stack

### Frontend
- **React** (Vite) - Fast, modern UI library.
- **Tailwind CSS** - Utility-first styling for a premium, responsive design.
- **Framer Motion** - Smooth animations for UI transitions.
- **Socket.IO Client** - Real-time bidirectional communication.
- **Zustand** - Lightweight state management.
- **React Router** - Single-page application routing.
- **Icons**: Lucide React & Heroicons.

### Backend
- **Node.js & Express** - Scalable server-side runtime.
- **MongoDB & Mongoose** - Flexible, document-based database.
- **Socket.IO** - Real-time event server.
- **JWT (JSON Web Tokens)** - Secure stateless authentication.
- **AES-JS** - Encryption utilities.

## 📂 Project Structure

```
chat application/
├── backend/                # Server-side logic
│   ├── controllers/        # Request handlers (Auth, Chat, Connection)
│   ├── db/                 # Database connection logic
│   ├── models/             # Mongoose schemas (User, Message)
│   ├── routes/             # API route definitions
│   └── server.js           # Entry point
│
├── frontend/               # Client-side application
│   ├── src/
│   │   ├── components/     # Reusable UI components (Chat, Auth)
│   │   ├── pages/          # Full page views (Home, Profile, Courses)
│   │   └── App.jsx         # Main component & Routing logic
│   └── vite.config.js      # Vite configuration
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local service or Atlas cluster)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone <repository_url>
    cd "chat application"
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd ../frontend
    npm install
    ```

### Environment Configuration

Create `.env` files in both `backend` and `frontend` directories.

**Backend (`backend/.env`):**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/edustealth
JWT_SECRET=your_super_secure_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name  # Optional
CLOUDINARY_API_KEY=your_key            # Optional
CLOUDINARY_API_SECRET=your_secret      # Optional
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000
```

### Running the App

1.  **Start the Backend Server**
    ```bash
    # In /backend directory
    npm run dev
    ```
    *Server will start on `http://localhost:5000`*

2.  **Start the Frontend Client**
    ```bash
    # In /frontend directory
    npm run dev
    ```
    *Client will start on `http://localhost:5173`*

3.  **Access the Application**
    Open your browser and navigate to `http://localhost:5173`.

## 🕵️ How to Use Stealth Mode

1.  **Login/Register**: Create an account or log in.
2.  **Search Trigger**: On the home page, click the search bar.
3.  **Activate**: Type **`stealth`** and wait a moment. A chat bubble icon will appear in the navigation bar.
4.  **Enter Chat**: Click the chat icon to open the secure messenger.
5.  **Panic**: If someone walks in, **Double-Tap ESC** to instantly close the chat and return to the course list.
