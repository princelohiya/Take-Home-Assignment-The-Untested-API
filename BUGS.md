# Bug Report - The Untested API

### 1. Pagination Offset Logic

- **Expected Behavior:** `GET /tasks?page=1&limit=5` should return the first 5 tasks (indices 0-4).
- **Actual Behavior:** It returns tasks starting from index 5 (skipping the first page) because the offset was calculated as `page * limit`.
- **Discovery:** Found via `taskService.test.js` when checking if Page 1 contained the first seeded task.
- **Fix:** Change calculation to `(page - 1) * limit`.

### 2. Task Completion Priority Reset

- **Expected Behavior:** Completing a task should only change the `status` and `completedAt` fields.
- **Actual Behavior:** The `priority` is hardcoded to reset to `medium` regardless of its original value.
- **Discovery:** Found via Integration test `PATCH /tasks/:id/complete`.
- **Fix:** Remove the hardcoded `priority: 'medium'` from the `completeTask` function in `taskService.js`.
