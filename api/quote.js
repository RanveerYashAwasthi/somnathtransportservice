const EMAIL_ENDPOINT = "https://api.resend.com/emails";

const FIELD_LIMITS = {
  name: 120,
  company: 160,
  pickupLocation: 160,
  dropLocation: 160,
  cargoType: 180,
  serviceType: 120,
  phone: 40,
  email: 180,
  message: 2000
};

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalize = (value, maxLength) =>
  String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => /^[0-9+()\-.\s]{10,25}$/.test(value);

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
};

const parseBody = (req) => {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
};

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "POST, OPTIONS");
    res.end();
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { ok: false, message: "Method not allowed." });
    return;
  }

  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const requestOrigin = req.headers.origin;

  if (allowedOrigin && requestOrigin && requestOrigin !== allowedOrigin) {
    json(res, 403, { ok: false, message: "Origin not allowed." });
    return;
  }

  const body = parseBody(req);
  const honeypot = normalize(body.companyWebsite, 200);
  const startedAt = Number(body.startedAt);
  const elapsed = Number.isFinite(startedAt) ? Date.now() - startedAt : Number.NaN;

  if (honeypot) {
    json(res, 200, { ok: true, message: "Thanks. Your request has been received." });
    return;
  }

  if (!Number.isFinite(elapsed) || elapsed < 1500) {
    json(res, 400, { ok: false, message: "Please wait a moment and try again." });
    return;
  }

  const sanitized = {
    name: normalize(body.name, FIELD_LIMITS.name),
    company: normalize(body.company, FIELD_LIMITS.company),
    pickupLocation: normalize(body.pickupLocation, FIELD_LIMITS.pickupLocation),
    dropLocation: normalize(body.dropLocation, FIELD_LIMITS.dropLocation),
    cargoType: normalize(body.cargoType, FIELD_LIMITS.cargoType),
    serviceType: normalize(body.serviceType || "Not specified", FIELD_LIMITS.serviceType),
    phone: normalize(body.phone, FIELD_LIMITS.phone),
    email: normalize(body.email, FIELD_LIMITS.email),
    message: normalize(body.message || "No additional details provided.", FIELD_LIMITS.message)
  };

  const requiredFields = [
    "name",
    "company",
    "pickupLocation",
    "dropLocation",
    "cargoType",
    "phone",
    "email"
  ];

  const missingField = requiredFields.find((field) => !sanitized[field]);

  if (missingField) {
    json(res, 400, { ok: false, message: "Please complete all required fields." });
    return;
  }

  if (!isValidEmail(sanitized.email)) {
    json(res, 400, { ok: false, message: "Enter a valid email address." });
    return;
  }

  if (!isValidPhone(sanitized.phone)) {
    json(res, 400, { ok: false, message: "Enter a valid phone number." });
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const quoteEmailTo = process.env.QUOTE_EMAIL_TO;
  const quoteEmailFrom = process.env.QUOTE_EMAIL_FROM;

  if (!resendApiKey || !quoteEmailTo || !quoteEmailFrom) {
    json(res, 500, {
      ok: false,
      message: "Email delivery is not configured yet. Please call (614) 549-9407."
    });
    return;
  }

  const safe = Object.fromEntries(
    Object.entries(sanitized).map(([key, value]) => [key, escapeHtml(value)])
  );

  const subject = `New freight quote request | ${sanitized.company} | ${sanitized.pickupLocation} to ${sanitized.dropLocation}`;
  const text = [
    "New quote request from Somnath Transport Service website",
    "",
    `Name: ${sanitized.name}`,
    `Company: ${sanitized.company}`,
    `Pickup: ${sanitized.pickupLocation}`,
    `Drop: ${sanitized.dropLocation}`,
    `Cargo type: ${sanitized.cargoType}`,
    `Service type: ${sanitized.serviceType}`,
    `Phone: ${sanitized.phone}`,
    `Email: ${sanitized.email}`,
    `Additional details: ${sanitized.message}`
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f7f2ea;padding:32px;color:#1d2430;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid rgba(10,35,66,0.12);border-radius:18px;overflow:hidden;">
        <div style="background:#0A2342;padding:24px 28px;color:#ffffff;">
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#f7c58c;">Somnath Transport Service</p>
          <h1 style="margin:0;font-size:28px;line-height:1.1;">New freight quote request</h1>
        </div>
        <div style="padding:24px 28px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);font-weight:700;color:#0A2342;width:180px;">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);">${safe.name}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);font-weight:700;color:#0A2342;">Company</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);">${safe.company}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);font-weight:700;color:#0A2342;">Pickup</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);">${safe.pickupLocation}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);font-weight:700;color:#0A2342;">Drop</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);">${safe.dropLocation}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);font-weight:700;color:#0A2342;">Cargo type</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);">${safe.cargoType}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);font-weight:700;color:#0A2342;">Service type</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);">${safe.serviceType}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);font-weight:700;color:#0A2342;">Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);">${safe.phone}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);font-weight:700;color:#0A2342;">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(10,35,66,0.08);">${safe.email}</td>
            </tr>
          </table>
          <div style="margin-top:20px;padding:18px;border-radius:14px;background:#f7f2ea;">
            <p style="margin:0 0 8px;font-weight:700;color:#0A2342;">Additional details</p>
            <p style="margin:0;white-space:pre-wrap;">${safe.message}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const resendResponse = await fetch(EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: quoteEmailFrom,
        to: [quoteEmailTo],
        reply_to: sanitized.email,
        subject,
        text,
        html
      })
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend email error:", resendError);
      json(res, 502, {
        ok: false,
        message: "We could not send your request right now. Please call (614) 549-9407."
      });
      return;
    }

    json(res, 200, {
      ok: true,
      message: "Thanks. Your quote request has been sent. Dispatch will follow up shortly."
    });
  } catch (error) {
    console.error("Quote request failed:", error);
    json(res, 502, {
      ok: false,
      message: "We could not send your request right now. Please call (614) 549-9407."
    });
  }
};