# QuickOrder

A restaurant ordering and menu management application built with React, Vite, and Supabase.

## Tech Stack

- React
- Vite
- Supabase
- Tailwind CSS
- React Router
- Radix UI

## Features

- Customer-facing menu
- Menu categories
- Menu tags
- Add-on groups
- Shopping cart
- Pickup and delivery ordering
- WhatsApp ordering workflow
- Thank-you page
- Admin menu management
- Bulk menu import
- Data export
- Typography settings
- Supabase authentication

## Local Development

### Install dependencies

```bash
npm install
```

### Environment variables

The project uses a `.env.local` file in the project root.

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit `.env.local` to Git.

### Start development server

```bash
npm run dev
```

The application will normally be available at `http://localhost:5173/`.

### Production build

```bash
npm run build
```

## Project Structure

```text
src/
├── api/
├── components/
├── lib/
├── pages/
├── App.jsx
└── main.jsx
```

## Supabase

The application uses Supabase for:

- Authentication
- Categories
- Menu items
- Menu tags
- Add-on groups
- Store settings
- User profiles

## Deployment

Build the application with `npm run build`.

The resulting `dist/` folder can be deployed to a static hosting provider.
