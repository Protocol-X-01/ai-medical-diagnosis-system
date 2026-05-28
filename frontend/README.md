# AI Medical Diagnosis System - Frontend

Next.js 14 frontend application for the AI Medical Diagnosis System.

## Features

- **Landing Page**: Marketing page with features and benefits
- **Dashboard**: Overview of diagnoses, stats, and system status
- **Diagnosis Interface**: Patient intake and AI-powered diagnosis generation
- **Real-time Agent Processing**: Visual feedback of quorum agent analysis
- **Citation Browser**: View and verify medical literature sources
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **State Management**: Zustand
- **Data Fetching**: SWR
- **Authentication**: NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard
│   ├── diagnose/
│   │   └── page.tsx          # Diagnosis interface
│   ├── api/
│   │   └── diagnose/
│   │       └── route.ts      # Diagnosis API endpoint
│   └── layout.tsx            # Root layout
├── components/               # Reusable components
├── lib/
│   └── utils.ts             # Utility functions
├── public/                  # Static assets
└── styles/                  # Global styles
```

## Environment Variables

Create a `.env.local` file:

```env
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_API_GATEWAY_URL=https://api.example.com

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Feature Flags
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

```bash
# Or use Vercel CLI
vercel --prod
```

### Docker

```bash
# Build image
docker build -t ai-medical-diagnosis-frontend .

# Run container
docker run -p 3000:3000 ai-medical-diagnosis-frontend
```

## API Integration

The frontend connects to AWS backend services:

- **API Gateway**: REST API for diagnosis requests
- **WebSocket**: Real-time agent updates
- **S3**: Medical document storage
- **Cognito**: User authentication

## Development

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate coverage
npm run test:coverage
```

## Performance

- **Lighthouse Score**: 95+
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Bundle Size**: <200KB (gzipped)

## Security

- HTTPS enforced
- CSP headers configured
- XSS protection enabled
- CSRF tokens implemented
- Rate limiting on API routes

## License

Proprietary - All rights reserved
