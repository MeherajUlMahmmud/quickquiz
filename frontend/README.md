# QuickQuiz Frontend

A React + TypeScript + Vite frontend for the QuickQuiz exam taking system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

```bash
npm run build
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling (CSS-first approach)
- **shadcn/ui** - Component library
- **React Router** - Routing
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## Features

- User authentication (login/register)
- Quiz creation and management
- AI-powered question generation
- Multiple question types (MCQ, Descriptive, Fill-in-blank, True/False)
- Exam taking interface with auto-save
- Results display with AI feedback
- Responsive design with Tailwind CSS v4
- Modern UI with shadcn/ui components

## Component Structure

- `src/components/ui/` - shadcn/ui components
- `src/components/` - Custom components
- `src/pages/` - Page components
- `src/services/` - API services
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions
