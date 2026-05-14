# Maxwell daily briefing — Make.com scenario setup

Maxwell is McWilliams Media's morning briefing agent. He posts a daily summary
to **#ops-daily** in Slack at **7:00 AM Central**, every day.

This document walks through the Make.com scenario that triggers him.

## Prerequisites

Before setting up Make.com, confirm these are in place:

- [ ] **The Maxwell endpoint is live on Replit** — `POST /api/agents/maxwell/briefing`
      is deployed and reachable.
- [ ] **`MAXWELL_API_KEY` is set in Replit Secrets.** Generate a random string
      (e.g. `openssl rand -hex 32` or any UUID) and add it under the exact key
      `MAXWELL_API_KEY`. Copy the value somewhere safe — you'll paste it into
      Make.com in Step 3 below.
- [ ] **`SLACK_BOT_TOKEN` is set in Replit Secrets**, the Slack app is installed
      in the McWilliams Media workspace, and the bot has been invited to
      `#ops-daily` (`/invite @Maxwell` in that channel).
- [ ] **The endpoint smoke-test passes.** From a Replit shell:
      ```bash
      export REPLIT_APP_URL=https://<your-repl-url>
      pnpm --filter @workspace/scripts run test:maxwell-endpoint
      ```
      Expected: `✓ Endpoint live, returned success: true …`. If this fails, do
      not move on — see [Troubleshooting](#troubleshooting).

## Scenario setup

### 1. Create the scenario

1. Log in to [Make.com](https://www.make.com/).
2. Click **Create a new scenario**.
3. Click the **+** in the center of the canvas — you'll add modules here.

### 2. Add the Schedule trigger

1. Search for **Schedule** and pick the built-in **Schedule** module.
2. Choose **Every Day**.
3. Set the time to **7:00 AM**.
4. **Time zone**: select **America/Chicago**. This handles CST/CDT
   automatically — Maxwell stays on Central regardless of DST.
5. Click **OK** to save.

### 3. Add the HTTP module

1. Click the **+** next to the Schedule trigger.
2. Search **HTTP** and pick **HTTP → Make a request**.
3. Configure:
   - **URL**: `https://<your-replit-app-url>/api/agents/maxwell/briefing`
     (copy the exact base URL from the Replit "Webview" panel — do not
     include a trailing slash)
   - **Method**: `POST`
   - **Headers**: click "Add Item" and add:
     - Name: `x-api-key`
     - Value: paste the `MAXWELL_API_KEY` value from Replit Secrets
   - **Body type**: leave as **Raw** with empty body (the endpoint takes no
     payload — the API key in the header is the only input).
   - **Parse response**: turn **on** (lets Make.com surface the JSON response
     in the run log, useful for verification).
4. Click **OK** to save.

### 4. Manual test before activating

Make.com lets you test-run the scenario without scheduling.

1. Click **Run once** at the bottom-left of the canvas.
2. The Schedule trigger will fire immediately, and the HTTP module will call
   Maxwell.
3. Click the HTTP module's run-log bubble to inspect:
   - Status should be `200`.
   - Response body should contain `"success": true`, a `briefing` string, and
     a `postedAt` timestamp.
4. Check `#ops-daily` in Slack — Maxwell's briefing should be posted there.

If anything is wrong, jump to [Troubleshooting](#troubleshooting). Do not
activate the scenario until the manual test posts successfully.

### 5. Activate the scenario

1. Top-right of the canvas, flip the **OFF → ON** toggle.
2. Make.com will now fire the Schedule trigger every day at 7:00 AM Central.

## Verifying the daily run

Tomorrow morning around 7:05 AM, check:

- **Slack `#ops-daily`** — Maxwell's briefing message should be there.
- **Make.com → History** — the scenario should show a successful run at 07:00
  Central. Click into it to see the request, the response, and any errors.

## Troubleshooting

### `✗ Endpoint returned 401 Unauthorized` from the smoke test

`x-api-key` header isn't matching `MAXWELL_API_KEY` in Replit Secrets.

- Check the Secrets panel: the key name must be exactly `MAXWELL_API_KEY`
  (case-sensitive, no whitespace).
- Re-copy the value — pasted secrets sometimes pick up trailing whitespace.
- After updating Secrets, Replit needs the API server to pick up the new value.
  Restart the API server workflow.

### `✗ Endpoint returned 500 — "Slack not configured"`

The endpoint computed Maxwell's briefing but couldn't post to Slack. Causes:

- `SLACK_BOT_TOKEN` isn't in Replit Secrets.
- The Slack bot was created but never installed in the workspace.
- The bot is installed but not invited to `#ops-daily`. Run `/invite @Maxwell`
  in that channel.

### The endpoint returns 200 but Maxwell's briefing shows all zeros

The PostgreSQL database is empty (no clients / leads / tasks yet) or the
queries are mis-targeted.

- Run `pnpm --filter @workspace/scripts run import:clients -- --apply` first
  if you haven't populated the clients table.
- Cross-check by running `pnpm --filter @workspace/scripts run test:maxwell` —
  it queries the same data without posting to Slack.

### Make.com fires the schedule but the HTTP module errors with a network failure

- Your Repl might be sleeping. Replit free tier puts repls to sleep after
  inactivity. Either wake it up manually before 7 AM, or move to a paid plan
  with "Always On".
- Verify the URL exactly — `https://<id>.replit.app/api/agents/maxwell/briefing`.
  No trailing slash; case-sensitive path.

### The scenario doesn't fire at 7:00 AM Central

- Confirm the timezone on the Schedule trigger is **America/Chicago**, not UTC
  or the Make.com server's default.
- Make.com's free tier has a minimum-5-minute scheduling resolution; daily 7am
  is well within that.
- Check the scenario's status toggle — make sure it's **ON**, not OFF.

## Related files

- Endpoint handler: `artifacts/api-server/src/routes/agents/maxwell.ts`
- Slack package: `lib/integrations-slack/src/index.ts` + `maxwell.ts`
- Local Maxwell test: `scripts/src/test-maxwell.ts` (queries DB + logs briefing,
  no Slack post unless `SLACK_BOT_TOKEN` is set)
- Endpoint smoke-test: `scripts/src/test-maxwell-endpoint.ts` (hits the live
  endpoint with the API key)
