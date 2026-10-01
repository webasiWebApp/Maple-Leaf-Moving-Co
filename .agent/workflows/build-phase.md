---
description: complete ONE phase from PROJECT_SPEC.md section 13.
---

# /build-phase <number>

Goal: complete ONE phase from PROJECT_SPEC.md section 13.

1. PLAN: Read the spec and the chosen phase. Write a short implementation plan listing
   files to create/change. Stop and wait for my approval of the plan.
2. BUILD: Implement only the tasks in that phase.
3. TEST: Run the relevant commands (npm run build, npm test, lint). Record the results.
4. SECURITY CHECK: Re-read spec section 9. List each requirement relevant to this phase
   and mark it PASS or FAIL with the file/line as evidence.
5. FIX LOOP: If any test or security check fails, fix it and repeat steps 3-4.
   Maximum 3 iterations. If it still fails, stop and report the blocker.
6. REPORT: Tick the completed checkboxes in PROJECT_SPEC.md section 13, summarise what
   changed, list anything I must do manually (keys, dashboard settings), then STOP.