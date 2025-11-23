# Job App Tracker

A React web application created to track all your job applications in one convenient location.

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

Access the app at https://sunny-griffin-4dacbb.netlify.app/

## New

Job detail editing page: /job-view/:id for viewing and resubmitting changes.

## Server Mode (Netlify Functions)

This deploy uses Netlify serverless functions (jobs-create, jobs-update, jobs-delete, jobs-list) with Clerk auth.

Environment flag:
- VITE_USE_SERVER=true (default) => uses Netlify functions
- Set VITE_USE_SERVER=false to revert to localStorage-only development

LocalStorage code paths remain guarded (easily re-enabled later).

Ensure Netlify env vars:
- MONGODB_URI
- MONGODB_DB_NAME (optional, defaults to jobtracker)
- CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY

After setting variables:
```bash
npm run build
netlify deploy
```
