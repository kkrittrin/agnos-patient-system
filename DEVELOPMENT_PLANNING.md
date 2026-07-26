# Development Planning Documentation

## 1. Project Structure

```
agnos-patient-system/
├── server.js                  # Custom Node server: wires Next.js + Socket.IO together
├── pages/
│   ├── _app.js                 # Loads global styles for every page
│   ├── index.js                 # Route "/" — Patient Form page (thin wrapper)
│   └── staff.js                  # Route "/staff" — Staff View page (thin wrapper)
├── components/
│   ├── PatientForm.jsx         # All patient-side form logic & steps
│   ├── FormField.jsx           # Renders one input (text/select/date/textarea/tel/email)
│   ├── StaffDashboard.jsx      # All staff-side dashboard logic (grid, filters, search)
│   ├── PatientCard.jsx         # One "monitor tile" for a single patient
│   └── StatusPulse.jsx         # The pulsing status-dot indicator
├── lib/
│   ├── formSchema.js           # Single source of truth: field list + validation rules
│   ├── patientSession.js       # Gets/creates a persistent patient id in localStorage
│   ├── useSocket.js            # Shared Socket.IO client connection (React hook)
│   └── time.js                 # "x seconds ago" formatting helper
├── styles/globals.css          # Tailwind layers + fonts + focus/reduced-motion rules
├── tailwind.config.js          # Design tokens (color palette, fonts, animation)
└── README.md
```

**Why this split:** pages stay tiny (just `<Head>` + one component) so all
real logic lives in testable, reusable components. `formSchema.js` is
imported by both `PatientForm` and (indirectly, via the data it renders)
`StaffDashboard`/`PatientCard`, so field labels/order can never drift
between the two views — add a field once, both sides pick it up.

## 2. Design

**Direction:** the patient-facing form needed to feel calm and reassuring
(someone may be filling this out while unwell or anxious), while the staff
dashboard needed to feel like a monitoring console — dense, scannable,
comfortable to glance at from across a desk.

- **Patient Form** — light, warm paper background (`#FBF9F6`), a deep
  teal ink for text, a single clay/terracotta accent for the primary action.
  Split into 3 short steps (Identity → Contact → Additional) with a
  progress bar, instead of one long scrolling form, specifically to reduce
  how overwhelming it feels on a phone screen.
- **Staff View** — near-black slate background so it reads as a dashboard,
  not a form. Each patient is a card ("monitor tile") in a responsive grid:
  1 column on mobile, 2 on tablet, 3 on wide desktop screens
  (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`).
- **Signature element** — a small pulsing dot next to each patient's status,
  echoing a heart-rate monitor without being literal about it. Solid for
  "submitted", dimmed for "inactive", animated ping for "filling in" — so a
  staff member scanning the whole screen can tell who needs attention at a
  glance, without reading text.
- **Type** — Fraunces (serif, display) for headings gives it a human,
  slightly clinical-but-warm feel; Inter for body/data because it's highly
  legible at small sizes in dense grids; IBM Plex Mono for patient
  reference IDs so they're visually distinct from names.
- **Responsiveness approach:** built mobile-first. Patient form is a single
  column at every width (no benefit to multi-column on a form people fill
  on their phone while checking in). Staff dashboard reflows its grid
  column count by breakpoint, and cards truncate long values rather than
  overflowing.
- **Accessibility floor:** visible focus rings (`:focus-visible`), reduced
  motion respected via `prefers-reduced-motion`, sufficient contrast on
  both light (patient) and dark (staff) themes.

## 3. Component Architecture

| Component        | Purpose                                                                 |
|-------------------|--------------------------------------------------------------------------|
| `PatientForm`     | Owns form state (`data`, `errors`, current step), debounces field changes before emitting them over the socket, validates a step before advancing, and validates everything on submit. Shows a confirmation screen after submit. |
| `FormField`       | Purely presentational — given a field definition + value + error, renders the right input type and its error message. No knowledge of sockets or steps. |
| `StaffDashboard`  | Joins the `staff` socket room, keeps a `{ [patientId]: record }` map in state, and derives the filtered/sorted list and status counts. Owns search + filter UI state. |
| `PatientCard`     | Presentational — renders one patient's current data, name, status pulse, and "last active" timestamp. Re-renders every few seconds so the relative timestamp stays fresh. |
| `StatusPulse`     | Presentational — maps a status string to a color/label/animation. |

State flows one direction in each: `PatientForm`/`StaffDashboard` are the
only components that talk to the socket; everything under them is a plain
props-in, UI-out component.

## 4. Real-Time Synchronization Flow

1. **Patient loads `/`.** `PatientForm` reads (or creates) a persistent
   `patientId` from `localStorage` and emits `patient:join`. The server
   creates an in-memory record for that id if one doesn't already exist,
   and immediately broadcasts it to the `staff` room (so a currently-open
   staff dashboard shows the new patient right away, even with 0 fields
   filled in).
2. **Patient types.** Every `onChange` updates local React state
   immediately (so the input feels instant), and queues the changed field
   in a `pendingRef`. A **350ms debounce** batches rapid keystrokes into a
   single `patient:update` socket emit, rather than one emit per
   keystroke.
3. **Server receives `patient:update`.** It merges the new fields into that
   patient's record, marks `status: "filling"`, updates `lastActive`, and
   broadcasts the full record to everyone in the `staff` room via
   `io.to("staff").emit("patient:update", record)`.
4. **Staff dashboard receives the broadcast.** `StaffDashboard` merges the
   updated record into its local map by id — React re-renders only the one
   `PatientCard` whose data changed.
5. **Inactivity detection.** After each update, the server schedules a
   check ~12 seconds later: if no further update arrived in that window
   (and the patient hasn't submitted), the record flips to
   `status: "inactive"` and staff are notified. Any new update flips it
   back to `"filling"` automatically. The same grace-period check runs on
   socket disconnect, so a brief network blip or tab switch doesn't
   instantly mark someone inactive.
6. **Patient submits.** `patient:submit` sets `status: "submitted"` and
   `submittedAt`, broadcast the same way. This is a terminal state — the
   inactivity timer skips records that are already submitted.

All of this is one-way in terms of authority (only the patient's own
browser ever writes that patient's data) but broadcasts fan out to every
connected staff client simultaneously, which is what gives the "real-time"
behavior the brief asks for.
