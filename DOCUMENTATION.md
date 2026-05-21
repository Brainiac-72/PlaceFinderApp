# 🚀 SpaceFinder Architecture & Documentation

SpaceFinder is a premium, high-performance real estate marketplace built with a modern mobile-first stack. This document provides a technical deep-dive into the project's architecture, data models, and development workflows.

---

## 🛠 Tech Stack

### Frontend (Mobile & Web)
- **Framework**: [Expo](https://expo.dev/) (React Native) with SDK 55.
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing).
- **State Management**: 
  - **Server State**: [TanStack Query (React Query)](https://tanstack.com/query/latest) for efficient data fetching and caching.
  - **Client State**: [Zustand](https://github.com/pmndrs/zustand) for lightweight, predictable global state.
- **Styling**: Native CSS variables with a custom theme system in `global.css`.
- **UI Components**: Lucide Icons, Bottom Sheet, FlashList (for high-performance lists), and Reanimated 4 for premium animations.

### Backend-as-a-Service (BaaS)
- **Provider**: [Supabase](https://supabase.com/)
- **Database**: PostgreSQL with Row Level Security (RLS).
- **Authentication**: Supabase Auth (GoTrue).
- **Real-time**: Supabase Realtime for instant messaging.
- **Storage**: Supabase Storage for property images.

---

## 📂 Project Structure

```text
├── assets/             # Static assets (images, fonts, branding)
├── src/
│   ├── app/            # Expo Router entry points (Screens & Layouts)
│   │   ├── (auth)/     # Authentication flows (Login, Register)
│   │   ├── (tabs)/     # Main application tabs (Explore, Saved, Messages, Profile)
│   │   ├── chat/       # Real-time messaging screens
│   │   ├── property/   # Detailed property view & listing creation
│   │   └── _layout.tsx # Root layout with providers
│   ├── components/     # Reusable UI components (Cards, Inputs, Buttons)
│   ├── constants/      # App-wide constants (Colors, Typography, Config)
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Supabase API abstraction layer
│   ├── store/          # Zustand store definitions
│   └── utils/          # Helper functions and formatting
├── supabase_schema.sql # Master SQL file for database migrations
└── app.json            # Expo configuration
```

---

## 💾 Database Schema (PostgreSQL)

The application logic is heavily driven by the PostgreSQL schema and Row Level Security policies defined in `supabase_schema.sql`.

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | Extended user data linked to `auth.users`. Includes roles (`owner`, `seeker`, `admin`). |
| `properties` | Listing data including price, location, features, and owner reference. |
| `chats` | Messaging sessions between a `seeker` and a `owner` regarding a specific property. |
| `messages` | Individual messages within a chat, supporting text and property attachments. |
| `notifications` | System and user-triggered notifications (e.g., new message, property updates). |

### Security (RLS)
The project implements strict **Row Level Security**:
- **Public access**: Only for viewing properties and public profiles.
- **Owner access**: Can manage (CRUD) their own property listings.
- **User access**: Can only view/send messages in chats they are part of.

---

## 📡 Backend Services (`src/services`)

We use a service-oriented architecture to wrap Supabase calls. This keeps the UI components clean and makes the data layer easy to test or replace.

- **`propertyService.ts`**: Handles complex queries like searching, filtering, and listing properties.
- **`chatService.ts`**: Manages real-time message subscriptions and sending/receiving messages.
- **`notificationService.ts`**: Handles the fetching and marking of user notifications as read.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (Latest LTS)
- Expo Go app on your mobile device
- A Supabase project

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Initialization
Copy the contents of `supabase_schema.sql` and run it in the **Supabase SQL Editor** to set up the tables, triggers, and RLS policies.

### 4. Installation
```bash
npm install
npx expo start
```

---

## 💎 Design System

The app follows a "Premium Modern" aesthetic:
- **Typography**: Uses `Spline Sans` for UI and `Playfair Display` for elegant headings.
- **Animations**: Subtle haptic feedback and smooth transitions using `react-native-reanimated`.
- **Glassmorphism**: Integrated via `expo-blur` and `expo-glass-effect` for a high-end feel.

---

## 🛠 Development Workflow

1. **Schema Changes**: Update `supabase_schema.sql` and apply to Supabase.
2. **Logic**: Add/Update logic in `src/services/`.
3. **UI**: Create/Modify components in `src/components/`.
4. **Routes**: Define new screens in `src/app/`.

---

*Documentation generated for SpaceFinder Platform.*
