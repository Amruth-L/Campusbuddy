# Architecture

The mobile app schedules local notifications on the phone. In later phases, the Express API will persist users, schedules, daily sessions, reminders, and confirmation history in PostgreSQL through Prisma. This separation means routine reminders remain reliable when the backend is unavailable.

The app will only deep-link to an official Campus Life app when a permitted URL is explicitly configured in `EXPO_PUBLIC_CAMPUS_LIFE_APP_URL`; otherwise it will clearly instruct the student to open it manually.
