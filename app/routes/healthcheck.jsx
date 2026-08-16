import { json } from "@remix-run/node";

export const loader = () =>
  json({ ok: true, revision: process.env.VERCEL_GIT_COMMIT_SHA || "unknown" });
