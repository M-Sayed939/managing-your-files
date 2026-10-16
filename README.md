#  Managing Your Files - Advanced File Management System

A comprehensive, secure, and fully-featured full-stack file management platform. This system provides a seamless experience for users to securely upload, preview, and manage their files, alongside a powerful Admin Control Panel for complete system oversight and analytics. 

Built with clean architecture principles, ensuring high performance, scalability, and maintainability.

---

##  Features

### Security & Authentication
- **JWT-Based Authentication:** Secure registration, login, and strictly protected API routes.
- **OTP Email Verification:** Email confirmation required before account activation (powered by Nodemailer).
- **Role-Based Access Control (RBAC):** Distinct permissions and UI rendering for `ADMIN` and `USER` roles.

###  File Operations (Core & Advanced)
- **Drag & Drop Upload:** Smooth upload experience with real-time percentage progress bars.
- **Smart Preview & Metadata:** Text extraction and instant preview for specific file types (.txt, .csv, .json).
- **Trash Bin (Soft Delete):** Safely move files to a recycle bin before permanent (hard) deletion.
- **Server-Side Processing:** Efficient pagination, dynamic type filtering, sorting (asc/desc), and real-time search queries.

###  Admin Control Panel
- **System Analytics:** Visual dashboards (Recharts) showing total files, storage usage, and file type distributions.
- **User Management:** Search users, promote/demote roles (`USER` ↔ `ADMIN`), and track active files per user via Prisma relational counting.
- **System-Wide Deletion:** Admins can delete users and permanently wipe their associated files in cascading operations.

###  UI/UX Excellence
- **Dark/Light Mode:** System-aware and manual theme toggling across all pages.
- **Fluid Animations:** Staggered list reveals, spring-animated modals, and smooth page transitions using `framer-motion`.
- **Modern Styling:** Responsive, clean, and accessible interface powered by Tailwind CSS v4.

---

##  Tech Stack

### Frontend (Client)
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State & Data Fetching:** TanStack React Query v5, Axios
- **UI Components & Icons:** Lucide React, Recharts, Framer Motion, react-dropzone, react-hot-toast

### Backend (Server)
- **Environment:** Node.js, Express.js
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL
- **File Handling:** Multer
- **Security:** JSON Web Tokens (JWT), bcryptjs
- **Mailing:** Nodemailer

---

##  Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running

### 1. Clone the repository
```bash
git clone https://github.com/M-Sayed939/managing-your-files.git
cd managing-your-files
```

### 2. Backend Setup (`/server`)
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=8080
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/files_db?schema=public"
JWT_SECRET="your_super_secret_jwt_key"
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"
```
Run database migrations and start the server:
```bash
npx prisma migrate dev --name init
npm run dev
```
*The server will start on `http://localhost:8080`*

### 3. Frontend Setup (`/client`)
Open a new terminal window:
```bash
cd client
npm install
```
Create a `.env.local` file in the `client` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```
Start the development server:
```bash
npm run dev
```
*The application will start on `http://localhost:3000`*

---

##  Architecture & Code Quality
- **Global Error Handling:** Centralized error catching on the backend.
- **Middleware Protection:** Custom `authenticate` and `requireAdmin` middlewares.
- **Component Segregation:** Reusable UI components (Theme Providers, Query Providers, Layouts).
- **Responsive Design:** Mobile-first approach ensuring perfect rendering on all devices.

---

##  Author

**Mohamed Sayed Fahim**
- GitHub: [@fimoo_z](https://github.com/M-Sayed939)

---
*Built as a technical showcase for advanced full-stack development.*
