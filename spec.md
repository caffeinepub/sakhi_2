# Sakhi — Phase 4: Contact Sharing + Responsive Redesign

## Current State
- Full-stack safety app with User, Police, and Admin dashboards
- User dashboard: SOS button, incident reporting, safe zones, FIR management, AI chatbot, notifications
- Profile stores emergency contacts (name + phone)
- App is locked to mobile-only layout via `mobile-container` (max-width 430px)
- No contact sharing on SOS trigger
- Backend has no changes needed; all existing APIs are sufficient

## Requested Changes (Diff)

### Add
- **Contact sharing on SOS**: After SOS is successfully created, detect saved emergency contacts from profile. For each contact, generate a pre-filled SMS link (`sms:[phone]?body=...`) with the user's name, GPS coordinates, and a Google Maps link. Show a modal/sheet listing all contacts with individual "Send SMS" buttons and a "Copy Message" option.
- **Desktop responsive layout**: On md+ screens, replace the bottom nav with a left sidebar. Remove the 430px cap. Use a two-column layout (sidebar + content) on desktop.

### Modify
- `UserDashboard.tsx`: Add contact sharing logic in `handleSOS`, add `EmergencyContactShareSheet` component inline, add responsive CSS classes throughout, convert bottom nav to a sidebar on desktop
- `index.css`: Update `.mobile-container` to be responsive — max-width on small screens, full-width with sidebar layout on large screens
- Profile tab: Add ability to add/edit emergency contacts (name + phone) using `useUpsertProfile`

### Remove
- Nothing removed; the 430px-only constraint is relaxed for desktop

## Implementation Plan
1. Update `mobile-container` in `index.css` to allow full-width on `lg:` screens
2. In `UserDashboard.tsx`:
   - Add responsive sidebar (hidden on mobile, visible on desktop `lg:`) that mirrors the bottom nav items
   - Change outer container to use `flex-row` on desktop with sidebar + main panel
   - After SOS success, if profile has contacts, open a share sheet modal listing contacts with SMS deep links
   - In profile tab, add form to add/edit emergency contacts (name + phone fields, save via `useUpsertProfile`)
3. Visual polish: upgrade card styles, add gradient accents, improve typography scale on desktop
