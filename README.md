 # 💸 FairShare – A Modern Expense Splitter Like Splitwise

FairShare is a full-stack web application built with **Next.js**, **Node.js**, **Express**, **MongoDB**, and **Socket.IO**. It enables users to **split expenses** with friends and groups, **track balances**, **chat in real time**, and **smartly settle dues**—all inspired by the functionality of [Splitwise](https://www.splitwise.com/).

---

## 🚀 Features

- 🔐 JWT Authentication
- 🧾 Group creation & friend management
- 💰 Real-time balance calculations
- 🧠 Smart group settlement logic
- 💬 Real-time chat using Socket.IO
- 📧 Email invitations and notifications
- ☁️ Cloudinary file uploads
- 🎨 TailwindCSS UI with Zustand global state management

---

## 🛠️ Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Frontend    | Next.js, TailwindCSS, Zustand       |
| Backend     | Node.js, Express.js, MongoDB, JWT   |
| Real-time   | Socket.IO                           |
| File Upload | Cloudinary                          |
| Email       | Nodemailer (SMTP via Gmail)         |

---

## 📁 Project Structure

/frontend → Next.js frontend
/server → Node.js + Express backend


---

## 📦 Setup Instructions

### 1. Clone the Repository

git clone https://github.com/Wali03/fairshare-app.git
cd fairshare-app

cd frontend
npm install

cd ../server
npm install

🔑 Environment Variables
Backend (/server/.env)
# JWT Secret Key used for signing and verifying JSON Web Tokens
JWT_SECRET=

# MongoDB connection string for connecting to the database
MONGODB_URL=

# Mail configuration (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_USER=
MAIL_PASS=

# Cloudinary (for file uploads)
FOLDER_NAME=
CLOUD_NAME=
API_KEY=
API_SECRET=

# Server config
PORT=4000
FRONTEND_URL=https://your-frontend-url.com


Frontend (/frontend/.env.local)
NEXT_PUBLIC_SOCKET_URL=https://your-render-app-name.onrender.com
NEXT_PUBLIC_API_URL=https://your-render-app-name.onrender.com/api/v1

🧪 Running Locally
Backend
cd server
npm run dev

Frontend
cd frontend
npm run dev
App will be available at http://localhost:3000


🧠 Core Functionalities
User Auth: Secure login & registration via JWT
Groups: Create, manage, and settle group expenses
Friends: Add friends and share expenses 1-on-1
Smart Split: Optimize group settlements to minimize transactions
Real-Time Chat: Chat within groups and with friend
Cloudinary Uploads: Profile images & attachments
Mail Sender: Send friend invites or notifications
🌐 Deployment (Recommended Setup)
Frontend: Vercel
Backend: Render
Database: MongoDB Atlas
Storage: Cloudinary
Mail: Gmail SMTP

👨‍💻 Author
Made with ❤️ by Syed Mohammad Wali
