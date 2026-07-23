# 🏢 SpaceFinder (SFA) / PlaceFinder Pro

[![Expo](https://img.shields.io/badge/Expo-SDK_55-blue.svg?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB.svg?logo=react&logoColor=black)](https://reactnative.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

A premium, full-stack real estate marketplace platform featuring a **cross-platform mobile app** (iOS, Android, Web) and a **Next.js admin command center** backed by **Supabase PostgreSQL**.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Credentials Quick Reference](#-credentials-quick-reference)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [1. Clone & Install](#1-clone--install)
  - [2. PostgreSQL / Supabase Database Setup](#2-postgresql--supabase-database-setup)
  - [3. Environment Configuration](#3-environment-configuration)
  - [4. Running the Mobile App](#4-running-the-mobile-app)
  - [5. Running the Admin Dashboard](#5-running-the-admin-dashboard)
- [Admin Dashboard Access](#-admin-dashboard-access)
- [Database Schema & Migrations](#-database-schema--migrations)
- [Folder Structure](#-folder-structure)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Overview

SpaceFinder provides an end-to-end luxury property discovery and management experience. Property seekers can explore listings in masonry grids, communicate with property owners via real-time messaging, and save listings. Property owners and platform admins manage listings, platform analytics, broadcasts, user verification, and security through a centralized dashboard.

---

## ✨ Key Features

### 📱 Mobile Application (Expo & React Native)
* **Property Exploration**: High-performance FlashList masonry grids, search filters, and location tags.
* **Property Detail & Gallery**: Detailed view with luxury amenities, photo carousels, and contact triggers.
* **Real-Time Messaging**: Instant messaging between seekers and owners powered by Supabase WebSockets.
* **Role-Based Workflows**: Custom navigation and permissions for **Property Seekers**, **Owners**, and **Admins**.
* **Authentication**: Email/Password and Google OAuth sign-in integration.
* **State Management**: TanStack React Query for cached server state & Zustand for client UI state.

### 🛡️ Admin Dashboard (Next.js)
* **Real-time Analytics & Metrics**: Track overall platform revenue, active users, property listings, and engagement.
* **User Management**: Promotes/demotes user roles (Seeker, Owner, Admin) and manages account status.
* **Listing Moderation**: Review, approve, feature, or suspend property listings across the platform.
* **Broadcast Center**: Dispatch system updates and notifications to platform users.
* **Audit & Reports**: View security logs and system reports.

---

## 🔑 Credentials Quick Reference

> [!IMPORTANT]
> Keep these credentials safe. They provide administrative access to the platform and the PostgreSQL database:

| Resource | Parameter | Value |
| :--- | :--- | :--- |
| **Admin Dashboard** | Username | `adadebtz` |
| **Admin Dashboard** | Password | `Ae@198600` |
| **PostgreSQL Database** | Database Password | `AdadeBTz@gmail.com` |

---

## 🛠 Tech Stack

### Mobile App (`src/`)
* **Framework**: Expo (SDK 55), React Native 0.81, Expo Router (file-based navigation).
* **State Management**: TanStack React Query v5, Zustand v5.
* **UI & Styling**: Native CSS Variables, Lucide Icons, Reanimated 4, Bottom Sheet.

### Admin Dashboard (`admin-dashboard/`)
* **Framework**: Next.js 16 (App Router), React 19.
* **Styling & Components**: Tailwind CSS v4, Lucide React, Recharts.

### Backend Services
* **Database**: PostgreSQL with Row Level Security (RLS).
* **Authentication**: Supabase Auth (JWT & Role Guards).
* **Real-time & Storage**: Supabase Realtime Channels & Bucket Storage.

---

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed on your development machine:
* **Node.js**: v18.x or v20.x+ LTS
* **npm**: v9.x or later
* **Expo Go App**: (Optional) Download on iOS/Android for physical device testing

---

### 1. Clone & Install

```bash
# Clone the project repository
git clone https://github.com/Brainiac-72/PlaceFinderApp.git
cd prf

# Install root dependencies (Mobile App)
npm install

# Install Admin Dashboard dependencies
cd admin-dashboard
npm install
cd ..
```

---

### 2. PostgreSQL / Supabase Database Setup

1. Open your **Supabase Project Dashboard** or connect to your PostgreSQL instance.
2. **PostgreSQL Password**: `AdadeBTz@gmail.com`
3. Navigate to **SQL Editor** in Supabase and run the following migration scripts in order:
   - `supabase_schema.sql` (Creates core tables: profiles, properties, chats, messages, notifications, and RLS policies)
   - `supabase_analytics.sql` (RPC functions required by the Admin Dashboard)
   - `supabase_migration_roles.sql` (Role assignments & user management helpers)
   - `supabase_security_hardening.sql` (Applies strict security policies)

---

### 3. Environment Configuration

#### Mobile App (`.env` in project root)
```env
EXPO_PUBLIC_SUPABASE_URL=https://vppoewzzdhzqdemexmar.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_AUTH_WEB_CLIENT_ID=your_google_client_id
```

#### Admin Dashboard (`admin-dashboard/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://vppoewzzdhzqdemexmar.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

### 4. Running the Mobile App

Run any of the following commands from the root directory:

```bash
# Start Expo dev server
npm start

# Run on Web Browser
npm run web

# Run on Android Emulator
npm run android

# Run on iOS Simulator (macOS only)
npm run ios
```

---

### 5. Running the Admin Dashboard

Start the Next.js admin portal from the root directory:

```bash
npm run admin
```

*(Alternatively, `cd admin-dashboard && npm run dev`)*

The dashboard will be accessible at **`http://localhost:3000`** (or `http://localhost:3001` if port 3000 is in use).

---

## 🔐 Admin Dashboard Access

1. Open **`http://localhost:3000/login`** in your web browser.
2. Enter the admin credentials:
   - **Username**: `adadebtz`
   - **Password**: `Ae@198600`
3. Upon authentication, you will be redirected to the platform Analytics overview (`/analytics`).

---

## 📂 Folder Structure

```text
├── admin-dashboard/            # Next.js 16 Admin Command Center
│   ├── src/app/
│   │   ├── analytics/          # Real-time metrics & charts
│   │   ├── broadcast/          # Global announcement dispatcher
│   │   ├── listings/           # Property listings moderation
│   │   ├── login/              # Secured admin login
│   │   ├── reports/            # Platform audit logs & support
│   │   └── users/              # User role management & permissions
│   └── package.json
├── src/                        # Expo React Native Mobile Application
│   ├── app/                    # Expo Router file-based screens
│   │   ├── (auth)/             # Authentication flows
│   │   ├── (tabs)/             # Explore, Saved, Chat, Profile tabs
│   │   ├── chat/               # Real-time direct chat screens
│   │   └── property/           # Property details & creation screen
│   ├── components/             # Reusable visual components
│   ├── hooks/                  # Data fetching & state hooks
│   ├── services/               # Supabase API abstraction layer
│   ├── store/                  # Zustand global state stores
│   └── utils/                  # Formatters & helper utilities
├── supabase_schema.sql         # Base PostgreSQL database schema
├── supabase_analytics.sql      # PostgreSQL RPC functions for analytics
├── package.json
└── README.md
```

---

## ❓ Troubleshooting

<details>
<summary><b>Issue: Admin authentication fails with valid credentials</b></summary>
Ensure browser cookies are allowed. The admin authentication relies on an <code>admin_token</code> cookie set upon valid credentials submission.
</details>

<details>
<summary><b>Issue: Supabase network errors or blank screens in Mobile App</b></summary>
Verify that <code>EXPO_PUBLIC_SUPABASE_URL</code> and <code>EXPO_PUBLIC_SUPABASE_ANON_KEY</code> are correctly set in the root <code>.env</code> file.
</details>

---

## 📜 Documentation & Deep Dive

For advanced architectural details, database ERD representations, and technical design specs, see [DOCUMENTATION.md](file:///d:/Project_Works/prf/DOCUMENTATION.md).

Built with ❤️ for a professional real estate marketplace experience.
