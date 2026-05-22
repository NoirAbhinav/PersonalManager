# PersonalManager Frontend

A modern React + TypeScript frontend for the PersonalManager expense tracking application. Integrates with Gmail to automatically sync HDFC Bank transaction alerts.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching & caching
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Project Structure

```
frontend/
├── src/
│   ├── pages/          # Page components (Dashboard, Login)
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── api/            # API client functions
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component with routing
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── tailwind.config.js  # Tailwind configuration
```

## Features

- **OAuth2 Google Login** - Secure authentication via Google
- **Gmail Sync** - Automatically fetch and sync HDFC Bank transaction alerts
- **Transaction Dashboard** - View all transactions with stats
- **Real-time Updates** - Auto-refresh data every minute
- **Responsive Design** - Works on desktop and mobile
- **Error Handling** - Graceful error states and error boundary
- **Loading States** - Smooth loading indicators

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Backend server running on `http://localhost:8080`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your Google OAuth credentials:
```
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## API Integration

The frontend communicates with the backend via REST API:

- `GET /health` - Health check
- `GET /transactions` - Fetch all transactions
- `POST /sync/gmail` - Trigger Gmail sync
- `GET /auth/google/login` - Google OAuth login
- `GET /auth/google/callback` - OAuth callback

## Components

### Pages
- **Login** - OAuth login page
- **Dashboard** - Main dashboard with transactions and stats

### Components
- **Header** - Navigation header with logout
- **TransactionList** - List of transactions
- **TransactionRow** - Individual transaction row
- **SyncButton** - Gmail sync button
- **ErrorBoundary** - Error boundary wrapper

### Hooks
- `useTransactions()` - Fetch and cache transactions
- `useSync()` - Handle Gmail sync mutation
- `useAuth()` - Authentication state management

### API Modules
- `api/transactions.ts` - Transaction API calls
- `api/auth.ts` - Authentication functions
- `api/sync.ts` - Sync functions

## Styling

Uses **Tailwind CSS** for styling with custom components:
- `.btn-primary`, `.btn-secondary` - Button variants
- `.card` - Card component
- `.input`, `.label` - Form elements
- `.badge` - Badge component

## Data Flow

1. User logs in with Google OAuth
2. Backend authenticates and stores tokens
3. Frontend fetches transactions from backend
4. User clicks "Sync Gmail"
5. Backend fetches emails from Gmail, parses transactions
6. Frontend refreshes transactions list
7. Stats auto-calculate based on transactions

## Error Handling

- API errors are caught and displayed in UI
- Error boundary catches component errors
- Failed syncs show error message
- Network errors are retried automatically (via React Query)

## Future Enhancements

- [ ] Pagination for transactions
- [ ] Transaction filtering/search
- [ ] Date range selection
- [ ] Export transactions (CSV/PDF)
- [ ] Multiple bank support
- [ ] Budget tracking
- [ ] Analytics dashboard
- [ ] Dark mode support

## Environment Variables

```
VITE_API_BASE_URL       - Backend API URL (default: http://localhost:8080)
VITE_GOOGLE_CLIENT_ID   - Google OAuth client ID
```

## Browser Support

- Chrome/Edge 91+
- Firefox 90+
- Safari 14+

## Performance

- React Query caching (1 minute stale time)
- Auto-refetch every 60 seconds
- Optimistic UI updates
- Code splitting via Vite

## Security

- Secure OAuth authentication
- HTTPS recommended for production
- CORS configured for backend
- XSS protection via React escaping
- CSRF tokens (backend-managed)
