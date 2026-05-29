# Frontend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create `.env.local` file:
```bash
cp .env.example .env.local
```

Update with your values:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

### 3. Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Backend CORS Setup

The backend has been updated to support CORS for frontend communication.

### Important: Update Backend Dependencies

Run this command in the backend directory:
```bash
cd backend
go mod tidy
go mod download
```

This will download the newly added `github.com/gin-contrib/cors` package.

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── api/                 # API client functions
│   │   ├── auth.ts         # Authentication API
│   │   ├── sync.ts         # Sync operations
│   │   └── transactions.ts # Transaction API
│   ├── components/          # Reusable components
│   │   ├── ErrorBoundary.tsx
│   │   ├── Header.tsx
│   │   ├── SyncButton.tsx
│   │   ├── TransactionList.tsx
│   │   └── TransactionRow.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useSync.ts
│   │   └── useTransactions.ts
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   └── Login.tsx
│   ├── types/              # TypeScript types
│   │   └── transaction.ts
│   ├── utils/              # Utility functions
│   │   └── formatting.ts
│   ├── App.tsx             # Root app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── index.html              # HTML entry point
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # Tailwind config
└── postcss.config.js       # PostCSS config
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Build | Vite 5.0 | Fast dev server & bundling |
| Runtime | React 18 | UI library |
| Language | TypeScript | Type safety |
| Routing | React Router 6 | Client-side navigation |
| Data | TanStack Query | Server state management |
| Styling | Tailwind CSS | Utility-first CSS |
| Icons | Lucide React | Icon library |

## Key Features Implemented

✅ OAuth2 Google Login
✅ Gmail transaction sync
✅ Real-time transaction display
✅ Transaction statistics
✅ Responsive design
✅ Error handling & boundaries
✅ Loading states
✅ Auto-refresh data
✅ Mobile-friendly UI

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| GET | `/auth/google/login` | Initiate Google OAuth |
| GET | `/auth/google/callback` | OAuth callback handler |
| GET | `/transactions` | Fetch all transactions |
| POST | `/sync/gmail` | Sync Gmail transactions |

## Component Hierarchy

```
App
├── Router
│   ├── Login (unauthenticated users)
│   │   └── Google OAuth button
│   └── Dashboard (authenticated users)
│       ├── Header
│       │   └── Logout button
│       ├── Stats Cards (4 columns)
│       │   ├── Total Debited
│       │   ├── Total Credited
│       │   ├── Net Amount
│       │   └── Transaction Count
│       ├── Sync Section
│       │   └── SyncButton
│       │       └── Status messages
│       └── TransactionList
│           └── TransactionRow (repeating)
```

## State Management

- **Authentication**: `useAuth` hook + localStorage
- **Transactions**: TanStack Query (caching + auto-refetch)
- **Sync Status**: Component state + mutation handling

## Error Handling

1. **API Errors**: Caught and displayed in component UI
2. **Component Errors**: Caught by ErrorBoundary
3. **Network Errors**: Auto-retry via React Query
4. **Auth Errors**: Redirect to login page

## Performance Optimizations

- React Query caching (1-minute stale time)
- Auto-refetch every 60 seconds
- Code splitting via Vite
- Lazy component loading ready
- Optimistic UI updates

## Browser Support

- Chrome/Edge 91+
- Firefox 90+
- Safari 14+
- Mobile browsers

## Troubleshooting

### CORS Errors
- Ensure backend is running on port 8080
- Check backend CORS config in main.go
- Run `go mod tidy` to get CORS dependency

### OAuth Not Working
- Verify Google Client ID in `.env.local`
- Check backend OAuth configuration
- Ensure redirect URL matches Google Console settings

### Transactions Not Loading
- Check network tab for API errors
- Verify backend is running
- Check browser console for errors

### Build Errors
- Delete `node_modules` and `dist`
- Run `npm install` again
- Check Node.js version (16+)

## Development Tips

- Use browser React DevTools for debugging
- Check Network tab for API calls
- Use browser console for errors
- Vite HMR works automatically
- TanStack Query DevTools available via URL param

## Next Steps

1. Run `npm install` to install dependencies
2. Update `.env.local` with Google OAuth credentials
3. Run backend with CORS enabled (`go mod tidy` first)
4. Start frontend: `npm run dev`
5. Navigate to `http://localhost:3000`
6. Click "Sign in with Google" to authenticate
