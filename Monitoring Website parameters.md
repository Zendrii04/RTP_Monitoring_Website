# Project Specification: Rizal Through Play (Monitoring Website)

This document details the features and requirements for the **Rizal Through Play** instructor monitoring platform. The website allows instructors to track student progress in real-time via data synced from a Unity-based game.

---

## 1. Technical Architecture & Integration
- **Backend Service:** Firebase (Authentication, Firestore, and Storage).
- **Unity Integration:** Metrics must automatically sync from the Unity game engine to Firebase. The website displays this data in real-time.
- **Environment:** Optimized for `antigravity-awesome-skills` syntax and deployment.

---

## 2. Instructor Authentication & Profile
All authentication and profile features are exclusively for **Instructor** users.

### Login & Signup
- **Branding:** Display the "wyg" logo and the project title "Rizal Through Play."
- **Login Interface:** - Email and Password fields.
    - Functional "Remember Me" checkbox.
    - "Forgot Password" redirection.
- **Signup Requirements:**
    - Fields: Name, Email, Contact Number, Birth Date.
    - Password Rules: Min. 8 characters, 1 uppercase, 1 lowercase, 1 special character.

### Instructor Mini-Panel (Profile Management)
- **Profile Overview:** Displays the current instructor's username and email.
- **Settings:** Ability to change username, email, password, and profile photo.
- **Session Control:** Secure Sign Out functionality.

---

## 3. Monitoring Dashboard
The dashboard displays a table/list of students with the following data points synced from Firebase:

| Field | Description |
| :--- | :--- |
| **Student Name** | Full name of the student |
| **Email** | Student's registered email |
| **Sex** | Gender identity |
| **Year Level** | Current academic year |
| **Checkpoints** | Number of checkpoints finished |
| **Time Played** | Total hours spent in-game |
| **Current Chapter** | The chapter the student is currently in |
| **Last Chapter** | The most recently completed chapter |
| **Puzzles** | Total number of puzzles solved |

---

## 4. Communication & Feedback
- **Message of the Day:** A "Short Message" section on the dashboard for instructor announcements/greetings.
- **Instructor Feedback System:** - **Rating:** A simple numerical or star-based scale.
    - **Comment:** A simple textbox for system improvement suggestions.
- **Instructional Media:** A "How to Use" section featuring a video demo of the website and dashboard.