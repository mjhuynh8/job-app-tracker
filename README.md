# Job App Tracker

A React web application created to track all your job applications in one convenient location.

## Deployment notes (Netlify + MongoDB)
- Set these environment variables in Netlify:
  - VITE_CLERK_PUBLISHABLE_KEY=pk_...
  - CLERK_SECRET_KEY=sk_...    <-- required for serverless auth
  - MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/jobtracker?retryWrites=true&w=majority
  - MONGODB_DB_NAME=jobtracker
- Ensure your MongoDB user has readWrite on the MONGODB_DB_NAME database.

### About the "local" database and oplog.rs
- In MongoDB Atlas, the "local" database and its collection "oplog.rs" are part of the replica set internals.
- It can have millions of documents and is expected.
- Do not delete "local" or "oplog.rs"; it is not created by this app.

## Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v20 LTS recommended to match Dockerfile)
- npm (usually comes with Node.js)
- Git

### Forking & Cloning

To set up the project in your own personal repository:

1. Click the **Fork** button in the top-right corner of the repository page.
2. Clone your forked repository to your local machine:

```bash
git clone https://github.com/<your-username>/job-app-tracker.git
cd job-app-tracker
```

### Installation

Install the dependencies:

```bash
npm install
```

> **Note:** If you encounter peer dependency errors, try running `npm install --legacy-peer-deps`.

> **Note:** If you encounter dependency errors or version conflicts after forking/cloning, try a clean install:
> ```bash
> rm -rf node_modules package-lock.json
> npm install
> ```
> (On Windows PowerShell: `Remove-Item -Recurse -Force node_modules; Remove-Item package-lock.json`)

### Configuration (Environment Variables)

The project relies on Clerk for authentication and MongoDB for data (if server mode is on). Even in "local storage" mode, the app initializes Clerk hooks.

1. Create a file named `.env` in the root directory.
2. Add the following variables:

```env
# Required for the frontend to load
VITE_CLERK_PUBLISHABLE_KEY=pk_test_... 

# Required only if you want to use the backend (Netlify Functions)
CLERK_SECRET_KEY=sk_test_...
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=jobtracker
```

- **Clerk Keys:** Sign up at [Clerk.com](https://clerk.com), create an application, and copy keys from "API Keys".
- **MongoDB URI:** Sign up for [MongoDB Atlas](https://www.mongodb.com/atlas), create a cluster, and get the connection string.

### Choose Your Mode: Local vs. Server

This project uses a feature flag called `USE_SERVER` hardcoded in `jobStore.tsx`, `job-dashboard.tsx`, and `job-form.tsx`.

**Option A: Local Storage Mode (Easiest)**
- Runs using browser's LocalStorage. No database connection required.
- Ensure `USE_SERVER` is set to `false` in the files listed above.

**Option B: Full Stack Mode**
- Saves data to MongoDB.
- Set `USE_SERVER = true` in the files listed above.
- Ensure `.env` has `MONGODB_URI`.
- Run using Netlify CLI to emulate serverless functions:
  ```bash
  npm install -g netlify-cli
  netlify dev
  ```

### Development

Start the development server (Standard/Local Mode):

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Troubleshooting Common Errors

- **"Clerk: Missing Publishable Key"**: You didn't create the `.env` file or the key is incorrect.
- **"upstream dependency conflict"**: Run `npm install --legacy-peer-deps`.
- **"500 Internal Server Error" on save**: You are in `USE_SERVER = true` mode but haven't set up MongoDB or aren't running the backend functions properly. Switch `USE_SERVER` to `false`.
- **Typescript Errors**: If `npm run dev` fails, try fixing the specific type mismatch.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

Access the app at https://sunny-griffin-4dacbb.netlify.app/

## New

Job detail editing page: /job-view/:id for viewing and resubmitting changes.
