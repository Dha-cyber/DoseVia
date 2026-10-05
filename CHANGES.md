# DoseVia - version 7 (Doctor: prescribe from Analysis + working Visualisations)

NEW: Analysis page -> "Add to patient's My Meds" button (appears after you analyse a combination). Adds the new drugs to that patient's My Meds page, notifies the patient, and logs it. Max 5 medicines per patient; if it would exceed 5 you can "Replace their current list with this combination".
NEW: Patient data now syncs across browser tabs (doctor adds a drug -> patient's My Meds updates live).
FIXED: Visualisations (drug-level curves, body map, dosing clock) no longer depend on the Gemini API. They use offline reference data (src/lib/pkData.ts) for all 40 drugs, driven by the selected patient's My Meds and adjusted for their kidney/liver function.

# DoseVia - version 6 (Admin portal)

NEW: **Admin** role (sign in with the "Admin" tab; see ADMIN_AND_DOCTOR_LOGINS.md). Pages:

- Dashboard - doctors / patients / pending counts, "needs your action" queue with one-click Forward, appointments by status, doctor workload, recent activity.
- Appointments - the request queue: New requests / With doctor / Confirmed / All, with search.
- Doctors - the doctor database: ADD a doctor (creates their login) or REMOVE one (login + chats deleted, open appointments return to the queue).
- Patients - registered patients, remove an account.
- Notifications - new requests, doctor accept/decline, cancellations.
- Activity Log - who did what (filter by role).

NEW appointment flow (like a real clinic):

1. Patient books (picks a doctor, date, slot) -> status "Awaiting admin", admin is notified.
2. Admin forwards it to the specific doctor (patient's choice or a different one, optional note) -> doctor gets a notification.
3. Doctor ACCEPTS (or declines) -> patient and admin are notified. Decline sends it back to the admin to reassign.
4. Doctor marks it completed. Admin can also reject a request with a reason.

NEW: Doctor and Admin self-registration on the sign-in screen (Doctor / Admin tab -> "New? Register"). A registered doctor is added to the doctor directory automatically and patients can book them straight away.
NEW: Doctor "Notifications" page + sidebar badge. Doctors only see requests the admin forwarded to them.
NEW: Patient "Visits" page shows live updates from the clinic.
CHANGED: Doctor list is now a database managed by the admin (stored in the browser's localStorage like the rest of the app). Admin never sees private doctor-patient chats.

Note: appointments booked in v5 that were still "requested" now appear in the admin queue.

## Earlier: version 5

NEW: 20 clinic doctors, each with their own login (see DOCTOR_LOGINS.md)

- Seeded automatically on first load. Doctors sign in with their email + password. Doctor self-registration is closed.

NEW: Patient "Doctors" tab - directory of all 20 doctors (speciality, qualification, experience, hospital, languages, fee, rating)
with search, speciality filter and "what do you need help with?" problem chips (e.g. Diabetes -> Endocrinologist).

CHANGED: Chat - patient first chooses a doctor by problem/speciality; messages go ONLY to that doctor.
Each doctor sees only their own patients' threads (enforced in AppContext, not only in the UI). Patients can keep several chats.

CHANGED: Appointments - patient picks speciality + doctor, then date/slot. Slots are per doctor.
Each doctor sees and manages only visits booked with them.

Data note: chats/appointments from v4 have no doctor attached and are no longer shown.

## Earlier: version 4

NEW: Doctor <-> Patient chat

- Patient: "Chat" tab. Doctor: "Messages" page (patient list, unread badges, search, quick replies).
- Sent / seen ticks, day separators, unread counters in the sidebar and on the dashboard.
- Updates live across open tabs of the same browser.

NEW: Appointment booking

- Patient: "Visits" tab - pick date, 30-min slot, in-person or video, and reason. Request goes to the doctor.
- Slots already taken or in the past are disabled (no double booking). Patient can cancel.
- Doctor: "Appointments" page - Requests / Upcoming / History, confirm or decline with an optional note,
  mark completed, jump to chat. Pending count shows on the sidebar and dashboard.
- Every action is written to the activity log.

Also: removing a patient now deletes their chats and appointments too.
Fixed: sidebar highlight pill drifting out of line on lower menu items.
New page-opening illustrations for Messages/Chat and Appointments/Visits.

Run: npm install && npm run dev
