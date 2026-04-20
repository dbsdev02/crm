# CRM Backend - Node.js + Express + MySQL

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create MySQL database:
   ```bash
   mysql -u root -p < migrations/schema.sql
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your MySQL credentials and JWT secret
   ```

4. Create uploads directory:
   ```bash
   mkdir uploads
   ```

5. Start server:
   ```bash
   npm run dev    # Development with auto-reload
   npm start      # Production
   ```

## Default Credentials
| Role   | Email            | Password (change after first login) |
|--------|------------------|-------------------------------------|
| Admin  | admin@crm.com    | password (bcrypt hash in seed)      |
| Staff  | staff@crm.com    | password                            |
| Client | client@crm.com   | password                            |

> **Note:** The seed passwords use the bcrypt hash of "password". Update them after first login.

## API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register user (admin only)
- `GET /api/auth/me` — Current user profile
- `GET /api/auth/users` — List all users (admin)
- `PUT /api/auth/users/:id` — Update user (admin)
- `PUT /api/auth/users/:id/permissions` — Update permissions (admin)

### Leads
- `GET /api/leads` — List leads
- `POST /api/leads` — Create lead
- `PUT /api/leads/:id` — Update lead
- `PUT /api/leads/:id/stage` — Change stage (comment required)
- `GET /api/leads/:id/history` — Stage change history
- `DELETE /api/leads/:id` — Delete lead

### Tasks
- `GET /api/tasks` — List tasks
- `POST /api/tasks` — Create task
- `PUT /api/tasks/:id` — Update task
- `PUT /api/tasks/:id/complete` — Complete task (auto credits)
- `DELETE /api/tasks/:id` — Delete task

### Projects
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Project details + members + tasks + assets
- `PUT /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project

### Meetings
- `GET /api/meetings` — List meetings
- `POST /api/meetings` — Create meeting
- `DELETE /api/meetings/:id` — Delete meeting

### Announcements
- `GET /api/announcements` — Active announcements
- `POST /api/announcements` — Create (admin)
- `DELETE /api/announcements/:id` — Deactivate (admin)

### Credits
- `GET /api/credits/leaderboard` — Staff leaderboard
- `GET /api/credits/my` — My credits + history
- `POST /api/credits/redeem` — Request redemption
- `PUT /api/credits/redeem/:id` — Approve/reject (admin)

### Notifications
- `GET /api/notifications` — My notifications
- `GET /api/notifications/unread-count` — Unread count
- `PUT /api/notifications/:id/read` — Mark read
- `PUT /api/notifications/read-all` — Mark all read

### Social Media
- `GET /api/social-media/project/:id` — Posts by project
- `POST /api/social-media` — Create post
- `PUT /api/social-media/:id` — Update post
- `DELETE /api/social-media/:id` — Delete post

### SEO
- `GET /api/seo/project/:id` — SEO plans by project
- `POST /api/seo` — Create plan
- `PUT /api/seo/:id` — Update plan
- `DELETE /api/seo/:id` — Delete plan

### Assets
- `GET /api/assets/project/:id` — Project assets
- `POST /api/assets/upload/:projectId` — Upload file (multipart)
- `DELETE /api/assets/:id` — Delete asset
