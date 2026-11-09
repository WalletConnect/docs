'use client';

import { type ReactNode, useState } from 'react';

// The prompt copied by the "Copy prompt" button on /payments/webhooks. Formerly public/copy-agent-prompt.js,
// which Mintlify injected into every page; as a component it is minified and loaded on that page only.
const WEBHOOK_PROMPT =
  'Implement a WalletConnect Pay webhook handler in this codebase, using the\nproject\'s existing language and web framework.\n\nRequirements:\n\n1. Add a POST route for webhook deliveries (use /webhooks/walletconnect-pay\n   unless this project has its own convention). The handler must read the RAW\n   request body bytes before any JSON body-parsing middleware touches it.\n\n2. Verify the signature of every delivery before doing anything else:\n   - Read headers: webhook-id, webhook-timestamp, webhook-signature.\n   - The signing secret comes from the environment variable WCP_WEBHOOK_SECRET\n     and looks like "whsec_<base64>". Base64-decode the part after "whsec_" to\n     get the HMAC key bytes. Do NOT use the secret string directly as the key.\n   - Compute HMAC-SHA256 over the UTF-8 bytes of:\n     "<webhook-id>.<webhook-timestamp>.<raw body>"\n     and base64-encode the digest.\n   - webhook-signature contains space-separated entries of the form\n     "v1,<base64 digest>" (there can be several during secret rotation).\n     Verification succeeds if ANY v1 entry equals the expected digest, using a\n     constant-time comparison.\n   - Reject the delivery if |now - webhook-timestamp| > 5 minutes\n     (webhook-timestamp is unix seconds).\n   - On any verification failure, respond 400 and do not process the payload.\n\n3. On success, durably persist or enqueue the parsed event, then respond 200.\n   Do not run business logic before responding. A crash between acknowledging\n   and persisting loses the event with no retry, so persist first.\n\n4. Process events idempotently and in order:\n   - Deduplicate on the top-level "id" field (format "evt_...").\n   - Drop stale events: track the highest data.payment_state_version seen per\n     data.payment_id and ignore events with a version <= that. The first event\n     of a payment carries version 0, so represent "no version seen yet" as an\n     absence (missing row or NULL), never as an initial counter of 0.\n\n5. Parse the payload tolerantly: ignore unknown fields, never fail on new\n   fields. Event types are payment.created, payment.processing,\n   payment.succeeded, payment.failed, payment.expired, payment.cancelled,\n   payment.settled.\n\n6. Use only the standard library for the crypto. Do not add a dependency.\n\nVerify the implementation against this test vector (skip the timestamp\ntolerance check for the vector only, since the timestamp is in the past):\n   - secret:         whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw\n   - webhook-id:        msg_p5jXN8AQM9LWM0D4loKWxJek\n   - webhook-timestamp: 1614265330\n   - raw body (exact bytes, including the space):\n     {"test": 2432232314}\n   - expected webhook-signature entry:\n     v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=\n\nWrite unit tests covering: the vector above verifies successfully; a wrong\nsignature is rejected; an altered body is rejected; a webhook-signature header\nwith multiple entries where only the second matches is accepted; a timestamp\noutside the 5-minute tolerance is rejected.';

const prompts = { webhook: WEBHOOK_PROMPT };

/** execCommand fallback for browsers without the async Clipboard API (or when it is refused, e.g. over http) */
function copyFallback(text: string) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'absolute';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

export function CopyPromptButton({ prompt, children }: { prompt: keyof typeof prompts; children: ReactNode }) {
  const [status, setStatus] = useState<string | null>(null);

  async function copy() {
    const text = prompts[prompt];
    let ok: boolean;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = copyFallback(text);
    }
    setStatus(ok ? 'Copied!' : 'Copy failed');
    setTimeout(() => setStatus(null), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="not-prose cursor-pointer rounded-lg bg-fd-primary px-5 py-2 font-semibold text-white"
    >
      {status ?? children}
    </button>
  );
}
