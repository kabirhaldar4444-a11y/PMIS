# PMIS Exam Portal — Full Replication Implementation Plan

> **For Antigravity agents or developers:** This document is a complete, zero-ambiguity blueprint. Follow every section in order. Do not skip sections. The project produces a production-ready, multi-role exam portal with glassmorphism UI, Supabase backend, and mandatory legal gates.

---

## 1. Project Overview

| Attribute | Value |
|---|---|
| Project Name | PMIS Exam Portal |
| Type | Multi-role online examination system |
| Frontend | React 19 + Vite + TailwindCSS v3 |
| Backend | Supabase (PostgreSQL + Storage + GoTrue Auth) |
| Deployment | Vercel |
| Design Style | Glassmorphism, animated blobs, premium SaaS |
| Fonts | Inter (body) + Outfit (headings) via Google Fonts |

### Roles

| Role | Email | Capabilities |
|---|---|---|
| `candidate` | Any assigned email | Take exams, complete profile, view results |
| `admin` | Any admin email | Manage candidates, create exams, upload questions |
| `super_admin` | Hardcoded `admin@pmi.com` | All admin + manage other admins |
| Master Admin | Hardcoded `info@pmi.com` | Treated as admin in `AuthContext`, auto-created |

---

## 2. Tech Stack & Dependencies

### Scaffold + Install Commands

```bash
npm create vite@latest . -- --template react
npm install @supabase/supabase-js framer-motion lucide-react react-hot-toast react-router-dom xlsx dotenv
npm install -D tailwindcss@3 postcss autoprefixer @vitejs/plugin-react
npx tailwindcss init -p
```

### Complete `package.json`

```json
{
  "name": "pmis",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.103.0",
    "dotenv": "^17.4.1",
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.8.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hot-toast": "^2.6.0",
    "react-router-dom": "^7.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@vitejs/plugin-react": "^6.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.0",
    "vite": "^8.0.0"
  }
}
```

---

## 3. Full File Structure

```
project-root/
├── .env                                ← Supabase credentials (NEVER commit)
├── .env.example                        ← Template for .env
├── .gitignore                          ← Include .env, node_modules, dist
├── index.html                          ← App entry, sets <title>
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json                         ← SPA rewrites for Vercel
├── PMIS_MASTER_SQL.sql                 ← Full DB bootstrap (paste into Supabase)
└── src/
    ├── main.jsx                        ← React root, mounts providers
    ├── App.jsx                         ← BrowserRouter + all Routes
    ├── index.css                       ← Global CSS, full design system
    ├── utils/
    │   ├── supabase.js                 ← Supabase client singleton
    │   └── indiaLocationData.js        ← { "State": ["City1","City2"...] }
    ├── context/
    │   ├── AuthContext.jsx             ← user, profile, login, logout
    │   └── AlertProvider.jsx           ← showAlert(), confirm() globally
    ├── components/
    │   ├── auth/
    │   │   └── ProtectedRoute.jsx      ← Role guard + completion guard
    │   ├── common/
    │   │   ├── Header.jsx              ← Shared admin nav bar
    │   │   └── PMISLogo.jsx            ← Animated SVG brand logo
    │   ├── layout/
    │   │   └── DashboardLayout.jsx     ← Header + footer wrapper
    │   ├── DisclaimerOverlay.jsx       ← Gate 1 & 2 disclaimer modal
    │   └── SignatureCanvas.jsx         ← HTML5 canvas signature pad
    └── pages/
        ├── Login.jsx                   ← Unified login (all roles)
        ├── candidate/
        │   ├── CompleteProfile.jsx     ← Registration form (Gate 2 host)
        │   ├── CandidateDashboard.jsx  ← My Exams dashboard (Gate 1 host)
        │   └── ExamPortal.jsx          ← Full exam engine (Gate 3 host)
        ├── admin/
        │   ├── AdminDashboard.jsx      ← Tab-based admin hub
        │   ├── Users.jsx               ← Candidate + admin management
        │   ├── ManageQuestions.jsx     ← Exam CRUD + Excel bulk import
        │   └── UserSubmissions.jsx     ← View & release exam results
        └── superadmin/
            └── SuperAdminDashboard.jsx ← Super admin management
```

---

## 4. Configuration Files

### `vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
```

### `tailwind.config.js`

```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { 500: '#3b82f6', 600: '#2563eb' },
        secondary: { 500: '#8b5cf6', 600: '#7c3aed' },
        accent:    { 500: '#a855f7' }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter:  ['Inter',  'sans-serif'],
      },
      animation: {
        'blob':     'blob 7s infinite',
        'fade-in':  'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.9)' }
        },
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
```

### `postcss.config.js`

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

### `.env`

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### `.env.example`

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### `vercel.json`

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

### `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PMIS Exam Portal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## 5. Design System — `src/index.css` (Complete)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary-color: #3b82f6;
  --secondary-color: #8b5cf6;
  --accent-color: #ec4899;
  --bg-gradient: radial-gradient(circle at top left, #f8fafc, #eff6ff, #f1f5f9);
  --glass-bg: rgba(255, 255, 255, 0.7);
  --card-bg: #ffffff;
  --glass-border: rgba(255, 255, 255, 0.5);
  --text-primary: #0f172a;
  --text-secondary: #475569;
}

@layer base {
  body {
    @apply font-inter text-slate-900 min-h-screen antialiased selection:bg-primary-500/30 overflow-x-hidden;
    background: var(--bg-gradient);
    background-attachment: fixed;
  }
  h1, h2, h3, h4, h5, h6 { @apply font-outfit; }
}

@layer components {
  /* Main glassmorphism card */
  .glass-card-saas {
    @apply backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  }
  .glass-card-saas:hover {
    @apply -translate-y-1;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  }

  /* Lighter glass surface */
  .glass-panel {
    @apply backdrop-blur-xl rounded-2xl shadow-lg transition-all duration-300;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
  }

  /* Sticky floating nav */
  .glass-navbar {
    @apply backdrop-blur-2xl sticky top-0 z-50 transition-all duration-300;
    background: rgba(255, 255, 255, 0.7);
    border-bottom: 1px solid var(--glass-border);
  }

  /* Primary gradient button */
  .btn-premium {
    @apply rounded-2xl px-8 py-4 font-bold text-white shadow-xl transition-all duration-300
           flex items-center justify-center gap-2 relative overflow-hidden active:scale-95;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  }
  .btn-premium:hover {
    @apply shadow-[0_10px_30px_rgba(59,130,246,0.3)] brightness-110;
  }

  /* Input field */
  .input-premium {
    @apply rounded-xl px-6 py-4 bg-white/40 border border-slate-200/50 backdrop-blur-sm
           transition-all duration-300 focus:bg-white focus:border-primary-500
           focus:ring-4 focus:ring-primary-500/10 outline-none
           placeholder:text-slate-400 placeholder:font-medium;
  }

  /* Animated decorative background blob */
  .blob {
    @apply absolute blur-[100px] opacity-40 pointer-events-none -z-10 rounded-full;
    animation: blob-float 20s infinite alternate ease-in-out;
  }
}

@keyframes blob-float {
  0%   { transform: translate(0, 0) scale(1) rotate(0deg); }
  33%  { transform: translate(100px, -50px) scale(1.1) rotate(120deg); }
  66%  { transform: translate(-50px, 100px) scale(0.9) rotate(240deg); }
  100% { transform: translate(0, 0) scale(1) rotate(360deg); }
}

.shadow-bloom { box-shadow: 0 0 40px rgba(59, 130, 246, 0.15); }
.page-transition { @apply transition-all duration-700 ease-out; }
```

---

## 6. Database Schema

> **Run `PMIS_MASTER_SQL.sql` (in project root) in your Supabase SQL Editor.** It is fully idempotent — safe to run on empty or existing databases.

### Table: `profiles`

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID        REFERENCES auth.users NOT NULL PRIMARY KEY,
  email               TEXT,
  full_name           TEXT,
  phone               TEXT        UNIQUE,
  address             TEXT,
  state               TEXT,
  city                TEXT,
  role                TEXT        CHECK (role IN ('super_admin', 'admin', 'candidate')),
  profile_completed   BOOLEAN     DEFAULT FALSE,
  disclaimer_accepted BOOLEAN     DEFAULT FALSE,
  allotted_exam_ids   UUID[]      DEFAULT '{}',
  is_exam_locked      BOOLEAN     DEFAULT FALSE,
  can_register        BOOLEAN     DEFAULT TRUE,
  profile_photo_url   TEXT,
  live_photo_url      TEXT,
  aadhaar_front_url   TEXT,
  aadhaar_back_url    TEXT,
  signature_url       TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `exams`

```sql
CREATE TABLE IF NOT EXISTS public.exams (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  duration    INTEGER     NOT NULL,  -- in minutes
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `questions`

```sql
CREATE TABLE IF NOT EXISTS public.questions (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id        UUID        REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text  TEXT        NOT NULL,
  options        JSONB       NOT NULL,   -- ["A text", "B text", "C text", "D text"]
  correct_option INTEGER     NOT NULL,   -- 0-indexed (0=A, 1=B, 2=C, 3=D)
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `submissions`

```sql
CREATE TABLE IF NOT EXISTS public.submissions (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        REFERENCES auth.users(id) NOT NULL,
  exam_id              UUID        REFERENCES public.exams(id) NOT NULL,
  score                INTEGER     NOT NULL,
  total_questions      INTEGER     NOT NULL,
  answers              JSONB       NOT NULL,   -- { "0": 2, "1": 0, ... }
  is_released          BOOLEAN     DEFAULT FALSE,
  admin_score_override INTEGER,
  submitted_at         TIMESTAMPTZ,            -- set by frontend, not DB default
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage Buckets

| Bucket | Public | Used For |
|---|---|---|
| `aadhaar_cards` | YES | Photo, Aadhaar front/back, digital signature |
| `candidate_documents` | YES | Live webcam capture |

### RPC Function

```sql
-- Called via: supabase.rpc('create_candidate', { p_email, p_password, p_full_name, p_exam_id })
CREATE OR REPLACE FUNCTION public.create_candidate(
  p_email TEXT, p_password TEXT, p_full_name TEXT, p_exam_id UUID DEFAULT NULL
) RETURNS UUID AS $$ ... $$ LANGUAGE plpgsql SECURITY DEFINER;
-- See PMIS_MASTER_SQL.sql for full body
```

### RLS Policies Summary

| Table | Policy |
|---|---|
| `profiles` | SELECT: all authenticated; UPDATE: self only + admin override |
| `exams` | SELECT: everyone; ALL: admin/super_admin only |
| `questions` | SELECT: everyone; ALL: admin/super_admin only |
| `submissions` | INSERT: own user_id only; SELECT: own rows only; ALL: admin |

---

## 7. `src/utils/supabase.js`

```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

---

## 8. `src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { AlertProvider } from './context/AlertProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AlertProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AlertProvider>
  </React.StrictMode>
);
```

**Provider nesting order (outer → inner):** `AlertProvider` → `AuthProvider` — AlertProvider must be outermost so AuthContext can call `showAlert`.

---

## 9. `src/App.jsx` — All Routes

```jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import CompleteProfile from './pages/candidate/CompleteProfile';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import ExamPortal from './pages/candidate/ExamPortal';
import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

function App() {
  const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!isConfigured) return <ConfigurationError />;  // show .env warning screen

  return (
    <Router>
      <div className="font-inter selection:bg-primary-500/30 relative">
        {/* Global animated background blobs */}
        <div className="blob w-80 h-80 bg-primary-500 top-[10%] -left-20 opacity-20" />
        <div className="blob w-[500px] h-[500px] bg-secondary-500 bottom-[10%] -right-40 opacity-20" />

        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute roleRequired="candidate">
              <CandidateDashboard />
            </ProtectedRoute>
          } />

          <Route path="/complete-profile" element={
            <ProtectedRoute roleRequired="candidate" allowIncomplete={true}>
              <CompleteProfile />
            </ProtectedRoute>
          } />

          <Route path="/exam/:id" element={
            <ProtectedRoute roleRequired="candidate">
              <ExamPortal />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute roleRequired="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/super-admin" element={
            <ProtectedRoute roleRequired="super_admin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
```

---

## 10. `src/context/AuthContext.jsx` — Logic

```
1. useEffect → supabase.auth.getSession() → setUser + fetchProfile
2. onAuthStateChange → keep user in sync
3. fetchProfile(uid, email):
   a. If email === 'info@pmi.com' → hardcoded admin profile (Master Admin)
   b. Else → SELECT from profiles WHERE id = uid
   c. If no profile found → signOut, set null
4. login(email, pw) → supabase.auth.signInWithPassword
5. logout()         → supabase.auth.signOut
6. Exports via context: { user, profile, loading, login, logout }
```

**Key rule:** AuthContext does NOT re-fetch profile on profile DB changes. A `window.location.reload()` is required after any profile mutations to re-sync.

---

## 11. `src/context/AlertProvider.jsx` — API

```js
// Usage anywhere inside the app:
const { showAlert, confirm } = useAlert();

// Toast notification (auto-dismisses after 4s)
showAlert('Success!', 'success');  // types: success | error | warning | info

// Confirm dialog with backdrop
confirm({
  title: 'Delete Exam?',
  message: 'This cannot be undone.',
  confirmText: 'Delete',
  type: 'danger',  // 'danger' = red button | 'info' = blue button
  onConfirm: () => { /* do the action */ }
});
```

**Visual:** Fixed top-right toast stack with colored left border, icon, and X close. Confirm dialog is centered with backdrop-blur overlay. z-index: 9999 (toasts), 10000 (confirm).

---

## 12. `src/components/auth/ProtectedRoute.jsx` — Complete Logic

```
Props: { children, roleRequired, allowIncomplete = false }

1. No user        → <Navigate to="/login" />
2. User but no profile yet → Show animated "Securing Connection" loading screen
3. Role mismatch:
   - super_admin → /super-admin
   - admin       → /admin
   - else        → /
4. Candidate with profile_completed=false on normal route → /complete-profile
5. Candidate with profile_completed=true on allowIncomplete route → /
6. All checks pass → render children
```

---

## 13. `src/components/DisclaimerOverlay.jsx` — GATE 1 & GATE 2

Mount at top of JSX in BOTH `CandidateDashboard` and `CompleteProfile`:
```jsx
<DisclaimerOverlay user={user} profile={profile} />
```

### Visibility Decision Logic

```js
// Checks sessionStorage first (fast)
const isSessionAccepted = sessionStorage.getItem(`disclaimer_accepted_${user?.id}`);

// Hides itself when BOTH DB fields true OR already accepted this session
if (
  (profile.disclaimer_accepted === true && profile.profile_completed === true)
  || isSessionAccepted
) return null;

// Otherwise renders full-screen blocking overlay
```

### On Accept

```js
1. supabase.from('profiles').update({ disclaimer_accepted: true }).eq('id', user.id)
2. sessionStorage.setItem(`disclaimer_accepted_${user.id}`, 'true')
3. setTimeout(() => window.location.reload(), 800)
```

### Disclaimer Content (paste verbatim)

```
1. Service Delivery / Platform
• One attempt allowed for Pre-Board and Final exams
• Soft copy certificate issued within 15 days after final exam
• No physical certificate (only digital)

Pre-Exam Reward System:
• 80%+ score = eligible for rewards
• 5+ gift options (₹50K–₹1L range)
• Delivery in 45–60 days
• Tracking shared via email
• OTP required for delivery
• Company may use student photos for promotion

2. Privacy Policy
• Data used for enrollment, payments, exams, communication, and improvement
• Data is NOT sold or shared commercially
• Stored securely with encryption and limited access
• Payment data handled securely
• Cookies used for login and analytics
• Data retained only as needed
• Users can access, correct, or delete their data
• Policy updates may occur anytime

3. Terms & Conditions
• One attempt allowed for exams
• Certificate issued after final exam
• Refund rules apply (see below)
• Reward system based on performance (80%+)

4. Refund Policy
• No refund after exam attempt or content access
• Refund allowed only within 24 hours of payment
• 90% refund (10% deduction mandatory)
• Processing time: 5–7 working days (+7 days bank time)
• Request must include name, email, course, receipt, and reason
• No 100% refund under any condition
```

### UI Structure

```
┌─────────────────────────────────────────────────────────┐
│ HEADER: ShieldCheck icon + "Privacy & Disclaimer"        │
├─────────────────────────────────────────────────────────┤
│ SCROLLABLE BODY: Legal text in slate-50 rounded box      │
├─────────────────────────────────────────────────────────┤
│ FOOTER:                                                  │
│   [✓] Checkbox "I agree and continue to the platform"    │
│   [Continue to Platform] button (disabled until checked) │
└─────────────────────────────────────────────────────────┘
```

- Fixed `inset-0`, `z-[2000]`, `backdrop-blur-xl`
- Animated with `framer-motion` `scale(0.9→1) opacity(0→1)`
- Modal max-width: `max-w-2xl`, `max-h-[90vh] overflow-hidden`

---

## 14. `src/components/SignatureCanvas.jsx`

- HTML5 `<canvas>` element
- Mouse events: `mousedown`, `mousemove`, `mouseup`
- Touch events: `touchstart`, `touchmove`, `touchend`
- Draws lines as user drags
- "Confirm Signature" button → `canvas.toBlob(callback, 'image/png')` → calls `onCapture(blob)`
- "Clear" button → `ctx.clearRect(0,0,w,h)`

---

## 15. `src/pages/Login.jsx` — Complete Flow

```
UI: Centered glass card on gradient background
    PMISLogo at top
    Email field (type="email")
    Password field (type="password")
    "Enter Portal" gradient button

Flow:
1. handleLogin(e):
   a. login(email, password) from AuthContext
   b. Fetch profile: SELECT role, profile_completed FROM profiles WHERE id = user.id
   c. showAlert('Verification successful. Welcome back!', 'success')
   d. setTimeout 800ms then navigate:
      - role === 'admin'       → /admin
      - role === 'super_admin' → /super-admin
      - candidate + completed  → /
      - candidate + incomplete → /complete-profile
```

---

## 16. `src/pages/candidate/CompleteProfile.jsx` — GATE 2 HOST

### Sub-components (defined in same file)

**`SearchableDropdown`**
- Custom dropdown with live text search filter
- Props: `{ value, onChange, options, placeholder, disabled }`
- Closes on outside click via `useRef` + `mousedown` listener

**`CameraModal`**
- Uses `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })`
- Streams video to `<video>` element (mirrored with `scale-x-[-1]`)
- Capture: `ctx.drawImage(videoRef.current, 0, 0, 400, 400)` → `canvas.toBlob`
- Returns a `File` object named `live_capture_<timestamp>.png`
- Stops all tracks on modal close

### Form Fields

| Field | Type | Validation |
|---|---|---|
| Live Photo | WebRTC Camera | Mandatory |
| Full Name | text input | Required |
| Phone | tel input (+91 prefix display) | `/^[6-9]\d{9}$/` |
| State | SearchableDropdown | Required |
| City | SearchableDropdown (depends on state) | Required |
| Aadhaar Front | file input (image/*) | Required |
| Aadhaar Back | file input (image/*) | Required |
| Digital Signature | SignatureCanvas | Required |

### Submit Logic

```js
1. Validate phone regex
2. Validate all 4 files present
3. Promise.all upload 4 files to 'aadhaar_cards' bucket:
   - photo      → {userId}/photo_{timestamp}.png
   - aadhaar_front → {userId}/aadhaar_front_{timestamp}.jpg
   - aadhaar_back  → {userId}/aadhaar_back_{timestamp}.jpg
   - signature  → {userId}/signature_{timestamp}.png
4. profiles.update({
     full_name, phone, address (built string),
     profile_photo_url, aadhaar_front_url, aadhaar_back_url,
     signature_url, profile_completed: true
   })
5. showAlert('Registration completed!', 'success')
6. setTimeout(() => window.location.href = '/', 1500)
```

---

## 17. `src/pages/candidate/CandidateDashboard.jsx` — GATE 1 HOST

### Real-time Subscriptions

```js
// Profile updates (e.g. admin allots a new exam)
supabase.channel(`profile_sync_${user.id}`)
  .on('postgres_changes', { event: 'UPDATE', table: 'profiles', filter: `id=eq.${user.id}` }, fetchDashboardData)
  .subscribe()

// Result release
supabase.channel(`submission_sync_${user.id}`)
  .on('postgres_changes', { event: '*', table: 'submissions', filter: `user_id=eq.${user.id}` }, fetchDashboardData)
  .subscribe()
```

### Allotted Exams Filter

```js
const allottedExams = exams.filter(exam => {
  const ids = profile?.allotted_exam_ids || [];
  return ids.includes(exam.id)
    && !submissions.find(s => s.exam_id === exam.id)  // not yet submitted
    && exam.title.toLowerCase().includes(searchTerm);
});
```

### UI Layout

```
Fixed floating pill navbar (PMISLogo | My Exams | Profile | Logout)
DisclaimerOverlay (Gate 1)
Main content (pt-32 to clear fixed nav):
  ├── "My Assessments" heading + search input
  ├── Allotted Exams grid (2-col) — each card has "Begin Assessment →" button
  └── Assessment History table (submitted exams)
```

---

## 18. `src/pages/candidate/ExamPortal.jsx` — GATE 3 HOST

### State Variables

```js
const [exam, setExam] = useState(null);
const [questions, setQuestions] = useState([]);
const [currentIdx, setCurrentIdx] = useState(0);
const [answers, setAnswers] = useState({});           // { questionIndex: optionIndex }
const [timeLeft, setTimeLeft] = useState(null);        // seconds
const [hasAcceptedDeclaration, setHasAcceptedDeclaration] = useState(false);
const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);
const [submitting, setSubmitting] = useState(false);

// Refs for use in setInterval (avoids closure stale state)
const answersRef = useRef({});
const indexRef = useRef(0);
const timeRef = useRef(null);
```

### Init Flow

```js
useEffect → initExam():
  1. Fetch exam + questions from Supabase
  2. Check localStorage for 'exam_sync_<examId>'
     - If found: restore answers, index, timeLeft
     - If not: set timeLeft = exam.duration * 60
```

### 1-Second Interval (Core Timer + Persistence)

```js
setInterval(() => {
  if (timeLeft > 0 && !submitting && hasAcceptedDeclaration) {
    setTimeLeft(prev => prev - 1);
    localStorage.setItem(`exam_sync_${examId}`, JSON.stringify({
      answers: answersRef.current,
      index: indexRef.current,
      timeLeft: timeRef.current
    }));
  }
  if (timeLeft === 0 && hasAcceptedDeclaration) handleAutoSubmit();
}, 1000);
```

### Gate 3 — Declaration Screen (Early Return)

```jsx
if (!hasAcceptedDeclaration) {
  return (
    // Full-page declaration with:
    // - Gradient header: ShieldCheck + exam title + "Examination Declaration"
    // - 4 summary cards: Questions (40) | Marks (200/5ea) | Duration (120 Mins) | Negative (None)
    // - Declaration text box: Zero Tolerance Policy, Integrity Policy, Behavioral Integrity
    // - Checkbox: "I have read and agree to follow all instructions & rules."
    // - "Start Examination →" button (only appears AFTER checkbox checked via AnimatePresence)
    //   onClick={() => setHasAcceptedDeclaration(true)}
  );
}
```

### Submit Flow

```js
processSubmit():
  1. setSubmitting(true)
  2. Calculate score: questions.forEach → if answers[idx] === q.correct_option, score++
  3. supabase.from('submissions').insert({
       user_id, exam_id, score, total_questions,
       answers: answersRef.current,
       is_released: false,
       submitted_at: new Date().toISOString()
     })
  4. localStorage.removeItem(`exam_sync_${examId}`)
  5. navigate('/')
```

### Timer UI

- Displays `MM:SS` format
- Below 300 seconds (5 mins): `text-red-500 animate-pulse`
- Clock icon also turns red

### Question Map Drawer

- Right-side slide-in drawer (`x: 100% → 0`)
- 5-column grid of question number buttons
- Color coding: current (blue), answered (blue tint), unanswered (grey)
- Shows answered/unanswered count at bottom

---

## 19. `src/pages/admin/AdminDashboard.jsx`

Internal tab navigation system:

```
Tabs: Overview | Manage Exams | Manage Users | Submissions

Overview tab:
  3 stat cards: Total Candidates | Total Exams | Total Admins
  (fetched via count queries with { count: 'exact', head: true })

Other tabs render:
  <ManageQuestions />
  <Users />
  <UserSubmissions />
```

The admin dashboard manages its own header inline (not `DashboardLayout`). Has a pill-style tab switcher at the top.

---

## 20. `src/pages/admin/ManageQuestions.jsx` — Two Views

### View 1: Exam List

```
Create Exam form:
  - Exam title (text input)
  - Duration in minutes (number input)
  - "Create Exam +" button → supabase.from('exams').insert({title, duration})

Exam grid (3-col):
  - Each card shows title + duration badge
  - "Manage Questions" button → switches to View 2
  - "Delete" button (with confirm dialog, cascades to questions)
```

### View 2: Question Manager (for selected exam)

Layout: 12-column grid
- **Left (5 cols):** Add Single Question form
  - Textarea for question text
  - 4 option inputs (A, B, C, D)
  - "Correct Option" select
  - "Explanation" textarea (optional)
  - "Add Question +" button
- **Right (7 cols):** Existing questions list with delete button (hover-reveal)

**Excel Import (drag-and-drop + file input):**

```
Supported column headers (case-insensitive, any of these):
  Question: "question" | "question text" | "Question"
  Option A: "opt1" | "option a" | "option 1" | "optiona" | "Option A"
  Option B: "opt2" | "option b" | "option 2" | "optionb" | "Option B"
  Option C: "opt3" | "option c" | "option 3" | "optionc" | "Option C"
  Option D: "opt4" | "option d" | "option 4" | "optiond" | "Option D"
  Answer:   "correct_option" | "answer" | "correct option" | "correct answer"
  Optional: "description" | "explanation" | "desc"

Answer value can be:
  - 0/1/2/3 (0-indexed)
  - A/B/C/D (letter)
  - Exact option text match

Preview modal shows valid/invalid rows before save.
Shuffle Questions option: randomizes question order
Shuffle Options option: randomizes options, recalculates correct_option index
Only valid rows are saved.
```

---

## 21. `src/pages/admin/Users.jsx`

### Tabs

- **Candidates tab:** All profiles with role='candidate'
- **Admin Roles tab:** Visible only to Super Admin (email === 'admin@pmi.com')

### Create User Modal

```js
supabase.rpc('create_candidate', {
  p_email:    newUser.email,
  p_password: newUser.password,
  p_full_name: newUser.fullName,
  p_exam_id:  newUser.allottedExamId || null
})
// If creating admin, additionally:
supabase.from('profiles').update({ role: 'admin' }).eq('id', newUserId)
```

Modal includes: Email, Full Name, Password (with generator + show/hide toggle), optional initial exam assignment dropdown.

### Edit Candidate Modal

Full-screen overlay with:
- Email (disabled, read-only)
- Full Name (editable)
- New Password (optional, generator included)
- Exam allotment multi-toggle (checkboxes per exam)
- Submission overrides: per submission `is_released` toggle + `admin_score_override` ± buttons

### Delete User

```js
supabase.from('profiles').delete().eq('id', userToDelete.id)
// Note: auth.users row deletion requires Supabase service role — not done from frontend
// Frontend only deletes the profile row; the auth.users row stays but becomes orphaned
```

### View Candidate Drawer

Right-side slide-in drawer showing:
- Profile photo, name, email, phone, state/city, address
- Aadhaar front + back image thumbnails (click to enlarge)
- Signature image
- Exam assignments list

---

## 22. `src/pages/admin/UserSubmissions.jsx`

```
Fetches: supabase.from('submissions').select('*, profiles(full_name, email), exams(title)')

Displays table:
  Candidate Name | Exam | Score | Total | Status | Release Toggle | Date

Release toggle:
  supabase.from('submissions').update({ is_released: true }).eq('id', sub.id)

Admin score override:
  supabase.from('submissions').update({ admin_score_override: value }).eq('id', sub.id)
```

---

## 23. `src/pages/superadmin/SuperAdminDashboard.jsx`

```
Fetches all profiles with role = 'admin'
Shows admin list with email, name
Allows promoting/demoting role
Only accessible via /super-admin route
```

---

## 24. Three Mandatory Gates — Master Reference

| Property | Gate 1 | Gate 2 | Gate 3 |
|---|---|---|---|
| **Page** | CandidateDashboard | CompleteProfile | ExamPortal |
| **Component** | DisclaimerOverlay | DisclaimerOverlay | Inline JSX early-return |
| **When shown** | Every login until fully onboarded | Every visit to /complete-profile until accepted | Every exam start |
| **Content** | Full legal disclaimer | Full legal disclaimer | Exam conduct & rules |
| **DB write** | `disclaimer_accepted = true` | Same | None |
| **Session write** | sessionStorage key | Same | None |
| **Dismiss method** | Checkbox + button | Checkbox + button | Checkbox + button |
| **Effect on dismiss** | `window.location.reload()` | `window.location.reload()` | `setHasAcceptedDeclaration(true)` |
| **Timer gated** | N/A | N/A | YES — timer doesn't start |

---

## 25. `src/utils/indiaLocationData.js`

Create this file as a named export:

```js
export const indianStatesAndCities = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", ...],
  "Arunachal Pradesh": ["Itanagar", "Tawang", ...],
  // ... all 28 states + 8 UTs
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Noida", ...],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", ...],
};
```

Used in: `CompleteProfile.jsx` → `SearchableDropdown` for State + City fields.

---

## 26. `src/components/common/PMISLogo.jsx`

Custom SVG logo component with:
- Animated "P", "M", "I", "S" letters
- Variant props: `variant="login"` (large), `variant="navbar"` (small)
- The "M" is styled as an hourglass shape
- The "I" has notched corners
- Optional 30-second entrance animation that locks to static position
- Export: `export default PMISLogo`

---

## 27. Deployment Steps

### 1. Prepare for Vercel

```bash
# .gitignore must include:
.env
node_modules/
dist/
```

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-org/your-repo.git
git push -u origin main
```

### 3. Configure Vercel

- Connect GitHub repo in Vercel dashboard
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Add environment variables: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`

### 4. Post-Deploy SQL (run in Supabase SQL Editor)

```sql
-- Promote Master Admin
UPDATE public.profiles 
SET role = 'admin', profile_completed = true, full_name = 'Master Admin'
WHERE email = 'info@pmi.com';

-- Promote Super Admin
UPDATE public.profiles 
SET role = 'admin', profile_completed = true, full_name = 'Super Admin'
WHERE email = 'admin@pmi.com';

-- Fix any broken identities (safe to run always)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), id,
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
  'email', id::text, NOW(), created_at, updated_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities);
```

---

## 28. Ordered Build Sequence (30 Steps)

```
 1. Scaffold Vite + React: npm create vite@latest . -- --template react
 2. Install dependencies (see Section 2)
 3. Create tailwind.config.js, postcss.config.js, vite.config.js
 4. Create .env + .env.example + .gitignore + vercel.json + index.html
 5. Run PMIS_MASTER_SQL.sql in Supabase SQL Editor
 6. Create Supabase storage buckets: aadhaar_cards + candidate_documents (public)
 7. Write src/index.css (full design system)
 8. Write src/utils/supabase.js
 9. Write src/utils/indiaLocationData.js
10. Write src/context/AlertProvider.jsx
11. Write src/context/AuthContext.jsx
12. Write src/components/auth/ProtectedRoute.jsx
13. Write src/components/common/PMISLogo.jsx
14. Write src/components/common/Header.jsx
15. Write src/components/layout/DashboardLayout.jsx
16. Write src/components/SignatureCanvas.jsx
17. Write src/components/DisclaimerOverlay.jsx  ← CRITICAL: must match Gate logic exactly
18. Write src/main.jsx
19. Write src/App.jsx
20. Write src/pages/Login.jsx
21. Write src/pages/candidate/CompleteProfile.jsx  ← GATE 2
22. Write src/pages/candidate/CandidateDashboard.jsx  ← GATE 1
23. Write src/pages/candidate/ExamPortal.jsx  ← GATE 3
24. Write src/pages/admin/AdminDashboard.jsx
25. Write src/pages/admin/ManageQuestions.jsx
26. Write src/pages/admin/Users.jsx
27. Write src/pages/admin/UserSubmissions.jsx
28. Write src/pages/superadmin/SuperAdminDashboard.jsx
29. npm run dev — verify all routes, gates, and flows work
30. Deploy to Vercel + run post-deploy SQL
```

---

## 29. Critical Pitfalls & Notes

### ⚠️ CRITICAL — Auth Identity

When creating users programmatically, ALWAYS insert into `auth.identities`:
```sql
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, ...)
VALUES (gen_random_uuid(), <userId>,
  format('{"sub":"%s","email":"%s"}', <userId>, <email>)::jsonb,
  'email', <userId>::text, NOW(), NOW(), NOW());
```
Without this, `supabase.auth.signInWithPassword` returns "Invalid login credentials" even with the correct password.

### ⚠️ CRITICAL — UUID Array Column

`allotted_exam_ids` must be type `UUID[]`. Always validate before updating:
```js
if (!Array.isArray(sanitizedFields.allotted_exam_ids)) {
  sanitizedFields.allotted_exam_ids = [];
}
```
Never send `[null]` — it will break array operations in Postgres.

### ⚠️ CRITICAL — Profile Reload After Disclaimer

AuthContext does not re-fetch profile on DB changes. After `disclaimer_accepted` or `profile_completed` is updated, **always call `window.location.reload()`** to force AuthContext to re-read the new profile from Supabase.

### ℹ️ Super Admin Detection

The `role` column is NOT used to detect super admin in the UI. Instead, `Users.jsx` checks:
```js
const isSuperAdmin = profile?.email === 'admin@pmi.com';
```
The `role` field for this user is still `'admin'`.

### ℹ️ Timer Refs Pattern

The exam timer uses refs alongside state to avoid stale closure issues in `setInterval`:
```js
const answersRef = useRef({});
useEffect(() => { answersRef.current = answers; }, [answers]);
// Uses answersRef.current inside the interval, not answers directly
```

### ℹ️ `submitted_at` Is Frontend-Set

The `submissions` table has no default for `submitted_at`. It is always set explicitly:
```js
submitted_at: new Date().toISOString()
```

### ℹ️ localStorage Key Format

Exam progress persistence key: `exam_sync_<examId>`
Stores: `{ answers: {}, index: 0, timeLeft: 3600 }`
Cleared on submit: `localStorage.removeItem('exam_sync_<examId>')`

### ℹ️ sessionStorage Key Format

Disclaimer acceptance key: `disclaimer_accepted_<userId>`
Value: `'true'` (string)

---

## 30. Environment Architecture Summary

```
Browser (React SPA)
    │
    ├── Supabase JS Client (anon key)
    │       ├── supabase.auth.*              ← Authentication
    │       ├── supabase.from('profiles')    ← Public schema tables
    │       ├── supabase.from('exams')
    │       ├── supabase.from('questions')
    │       ├── supabase.from('submissions')
    │       ├── supabase.storage.from(...)   ← File storage
    │       ├── supabase.rpc('create_candidate') ← Server-side function
    │       └── supabase.channel(...)        ← Real-time subscriptions
    │
    └── Vercel CDN (static hosting + SPA rewrites)
```

---

*Generated: 2026-04-15 | PMIS Exam Portal v1.0 | For internal use and replication only*
