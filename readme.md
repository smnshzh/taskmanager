# Task Manager

A modern web-based Task Management and Team Collaboration platform built with Next.js, TypeScript, Prisma, and PostgreSQL.

## 🚀 Overview

Task Manager is designed to help teams and organizations manage tasks, track progress, improve collaboration, and streamline workflows through a centralized platform.

The application provides role-based access control, task assignment, reporting capabilities, and team management features to support operational efficiency and transparency.

## ✨ Features

- User authentication and authorization
- Role-based access control
- Task creation and assignment
- Task status tracking
- Team and department management
- Dashboard and reporting
- Excel-based bulk data import
- Responsive user interface
- Cloud deployment support

## 🛠 Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS

### Backend
- Next.js API Routes
- Prisma ORM

### Database
- PostgreSQL

### Deployment
- Next.js standalone server managed by PM2
- Caddy reverse proxy
- PostgreSQL migrations managed by Prisma Migrate

## 💻 Repository

https://github.com/smnshzh/taskmanager

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/smnshzh/taskmanager.git
cd taskmanager
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/taskmanager"
SESSION_SECRET="replace-with-a-random-secret"
APP_BASE_URL="http://localhost:8502"
APP_TIMEZONE="Asia/Tehran"
PORT="8502"
```

### Run database migrations

```bash
npx prisma migrate deploy
```

or during development:

```bash
npx prisma migrate dev
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Start development server

```bash
npm run dev
```

Application will be available at:

```text
http://localhost:8502
```

## 🗄 Database

Prisma ORM is used for database management.

Useful commands:

```bash
npx prisma studio
npx prisma generate
npx prisma migrate dev
```

Do not use `prisma db push` for production. Existing installations are
baselined and production changes must use:

```bash
npm run db:migrate:deploy
```

## Production

The supported deployment flow is:

```bash
scripts/deploy.sh
```

It installs locked dependencies, runs lint, typecheck and tests, generates the
Prisma client, builds the standalone server, deploys migrations, reloads PM2,
and verifies `/api/health`. PM2 configuration lives in
`ecosystem.config.cjs`; the production port is `8502`.

## 📊 Use Cases

- Team Task Management
- Project Tracking
- Operations Coordination
- Department Workflow Management
- Performance Monitoring
- Internal Collaboration

## 🔒 Security

- Authentication and authorization
- Role-based permissions
- Protected API routes
- Secure database access

## 📝 Future Improvements

- Email notifications
- Mobile application
- Advanced analytics
- Workflow automation
- Calendar integration
- Real-time updates

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License



---

Developed by smnshzh
