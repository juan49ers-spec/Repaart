# Project Context: Synthetic Sagan

**Description:**
Synthetic Sagan is a financial management and operational dashboard for franchise businesses (likely delivery or logistics). It provides real-time financial tracking, audit logging, and operational tools for franchise managers and central administration.

**Technology Stack:**

- **Frontend:** React 19, TypeScript (Strict Mode), Vite.
- **Styling:** Tailwind CSS (v4), PostCSS.
- **State Management:** Zustand (Global UI Store), React Query (Server State), React Context (Auth/Theme).
- **Backend/Data:** Firebase (Firestore, Auth), Supabase (mentioned in user prompt, potentially future or hybrid).
- **Validation:** Zod.
- **Visualization:** Recharts.

**Architecture Map:**

- **`src/features/`**: Contains the core business logic and domain-specific views.
  - `FranchiseDashboard.tsx`: **Container** (Logic, Hooks, Data).
  - `FranchiseDashboardView.tsx`: **Presenter** (Pure UI, Stateless).
- **`src/ui/`**: A consolidated UI Kit for "Dumb" or presentational components. Atomic design inspired.
  - `primitives/`: **NEW** Atomic components (`Card`, `Badge`, `StatValue`, `SectionHeader`).
  - `overlays/`: Tooltips, Modals.
  - `inputs/`: Form elements.
  - `feedback/`: Loaders, Alerts.
- **`src/lib/`**: Shared utilities and helper functions (finance logic, formatting).
- **`src/store/`**: Global state definitions (Zustand).

**Current State (Jan 2026):**

- **Status:** Active Refactoring.
- **Completed Phases:**
  - ✅ **Phase 0: Deep Audit** (Health check and roadmap).
  - ✅ **Phase 1: Cleanup** (Deleted `src/legacy`, merged `src/components` into `src/ui`).
  - ✅ **Phase 2: Type Hardening** (Dead code removal, `MonthlyData` standardization).
  - ✅ **Phase 3: Modularization** (Container/Presenter separation for `FranchiseDashboard`).
  - ✅ **Phase 4: Atomic Design** (Implemented Primitives and refactored Widgets).

**Suggested Next Steps:**

- 🧪 **Testing:** Implement Unit Tests for `useFranchiseFinance`.

**Key Conventions:**

- **Strict TypeScript:** No `any`. Define interfaces for all props and data.
- **Component Colocation:** Related sub-components stay close to their dashboard if not shared.
- **Absolute Imports:** Prefer strictly defined paths or relative imports where clear.
- **Prohibited Dead Code:** If a component is replaced, the old one is DELETED, not commented out.
