// Powers the "Copy prompt" button on /payments/webhooks.
// Mintlify injects every .js file in the content directory into each page,
// so this uses event delegation and binds only once.
(function () {
  if (window.__wcpCopyPromptBound) return;
  window.__wcpCopyPromptBound = true;

  var PROMPT = [
    "Implement a WalletConnect Pay webhook handler in this codebase, using the",
    "project's existing language and web framework.",
    "",
    "Requirements:",
    "",
    "1. Add a POST route for webhook deliveries (use /webhooks/walletconnect-pay",
    "   unless this project has its own convention). The handler must read the RAW",
    "   request body bytes before any JSON body-parsing middleware touches it.",
    "",
    "2. Verify the signature of every delivery before doing anything else:",
    "   - Read headers: webhook-id, webhook-timestamp, webhook-signature.",
    "   - The signing secret comes from the environment variable WCP_WEBHOOK_SECRET",
    "     and looks like \"whsec_<base64>\". Base64-decode the part after \"whsec_\" to",
    "     get the HMAC key bytes. Do NOT use the secret string directly as the key.",
    "   - Compute HMAC-SHA256 over the UTF-8 bytes of:",
    "     \"<webhook-id>.<webhook-timestamp>.<raw body>\"",
    "     and base64-encode the digest.",
    "   - webhook-signature contains space-separated entries of the form",
    "     \"v1,<base64 digest>\" (there can be several during secret rotation).",
    "     Verification succeeds if ANY v1 entry equals the expected digest, using a",
    "     constant-time comparison.",
    "   - Reject the delivery if |now - webhook-timestamp| > 5 minutes",
    "     (webhook-timestamp is unix seconds).",
    "   - On any verification failure, respond 400 and do not process the payload.",
    "",
    "3. On success, durably persist or enqueue the parsed event, then respond 200.",
    "   Do not run business logic before responding. A crash between acknowledging",
    "   and persisting loses the event with no retry, so persist first.",
    "",
    "4. Process events idempotently and in order:",
    "   - Deduplicate on the top-level \"id\" field (format \"evt_...\").",
    "   - Drop stale events: track the highest data.payment_state_version seen per",
    "     data.payment_id and ignore events with a version <= that. The first event",
    "     of a payment carries version 0, so represent \"no version seen yet\" as an",
    "     absence (missing row or NULL), never as an initial counter of 0.",
    "",
    "5. Parse the payload tolerantly: ignore unknown fields, never fail on new",
    "   fields. Event types are payment.created, payment.processing,",
    "   payment.succeeded, payment.failed, payment.expired, payment.cancelled,",
    "   payment.settled.",
    "",
    "6. Use only the standard library for the crypto. Do not add a dependency.",
    "",
    "Verify the implementation against this test vector (skip the timestamp",
    "tolerance check for the vector only, since the timestamp is in the past):",
    "   - secret:         whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw",
    "   - webhook-id:        msg_p5jXN8AQM9LWM0D4loKWxJek",
    "   - webhook-timestamp: 1614265330",
    "   - raw body (exact bytes, including the space):",
    "     {\"test\": 2432232314}",
    "   - expected webhook-signature entry:",
    "     v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=",
    "",
    "Write unit tests covering: the vector above verifies successfully; a wrong",
    "signature is rejected; an altered body is rejected; a webhook-signature header",
    "with multiple entries where only the second matches is accepted; a timestamp",
    "outside the 5-minute tolerance is rejected.",
  ].join("\n");

  function setLabel(btn, text, revertMs) {
    var original = btn.getAttribute("data-original-label") || btn.textContent;
    btn.setAttribute("data-original-label", original);
    btn.textContent = text;
    setTimeout(function () {
      btn.textContent = original;
    }, revertMs);
  }

  function copyFallback(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "absolute";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  document.addEventListener("click", function (event) {
    var btn = event.target && event.target.closest("[data-wcp-copy-prompt]");
    if (!btn) return;
    event.preventDefault();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(PROMPT).then(
        function () {
          setLabel(btn, "Copied!", 2000);
        },
        function () {
          setLabel(btn, copyFallback(PROMPT) ? "Copied!" : "Copy failed", 2000);
        }
      );
    } else {
      setLabel(btn, copyFallback(PROMPT) ? "Copied!" : "Copy failed", 2000);
    }
  });
})();
