# Rizal Through Play (RTP) - Instructor Monitoring Website

This is the instructor monitoring platform for **Rizal Through Play**, built with React, TypeScript, and Vite. The website allows instructors to track student progress in real-time using data synced from the Unity-based game.

## 🚀 Features

### 1. Instructor Authentication & Profile Management
- Secure Login & Signup for instructors.
- Password recovery and "Remember Me" functionality.
- Profile management (update Name, Username, Email, Password, and Profile Photo).
- Uses Firebase Authentication.

### 2. Monitoring Dashboard
Real-time tracking of student metrics synced from Unity, including:
- Student Name & Email
- Sex & Year Level
- Checkpoints Finished
- Time Played (Total Hours)
- Current Chapter & Last Completed Chapter
- Total Puzzles Solved

### 3. Theming & UI
- Multiple UI Themes: **Dark**, **Light**, **Midnight Purple**, and **Ocean Blue**.
- High-contrast text colors optimized for accessibility.

### 4. Communication & Feedback
- **Message of the Day**: Dashboard banner for instructor announcements.
- **Feedback System**: Instructors can submit ratings and text feedback to improve the system.
- **Instructional Media**: "How to Use" video demo of the dashboard.

---

## 🛠️ Technical Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Custom CSS with CSS Variables for theming
- **Backend / Database**: Firebase (Auth, Firestore, Storage)
- **Routing**: React Router DOM

---

## 💻 Running the Project Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### 1. Install Dependencies
Open a terminal in the project folder and run:
```bash
npm install
```

### 2. Setup Firebase
If you haven't already, configure your Firebase connection:
1. Go to your Firebase Console.
2. Enable **Authentication** (Email/Password).
3. Enable **Firestore Database** (Start in Test Mode).
4. Enable **Storage** (Start in Test Mode).
5. Ensure your API keys are correctly placed in `src/firebase.ts`.

### 3. Start the Development Server
```bash
npm run dev
```
The website will open locally (usually at `http://localhost:5173`).

### 4. Build for Production
To create a production-ready build:
```bash
npm run build
```
