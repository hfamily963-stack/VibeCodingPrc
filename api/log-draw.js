const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SCHEMA = process.env.SUPABASE_SCHEMA || "public";

function normalizeSupabaseTable(table) {
  if (typeof table !== "string") {
    return "lotto_draw_logs";
  }

  const trimmed = table.trim();
  if (!trimmed) {
    return "lotto_draw_logs";
  }

  const parts = trimmed.split(".");
  return parts[parts.length - 1] || "lotto_draw_logs";
}

const SUPABASE_TABLE = normalizeSupabaseTable(process.env.SUPABASE_TABLE || "lotto_draw_logs");

function isApiSupabaseUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  return value.includes("api.supabase.com");
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  const remoteAddress = req.socket && req.socket.remoteAddress;
  if (typeof remoteAddress === "string" && remoteAddress.trim()) {
    return remoteAddress.trim();
  }

  return "unknown";
}

function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (error) {
      return Promise.reject(new Error("Invalid JSON body"));
    }
  }

  if (Buffer.isBuffer(req.body)) {
    try {
      return Promise.resolve(JSON.parse(req.body.toString("utf8")));
    } catch (error) {
      return Promise.reject(new Error("Invalid JSON body"));
    }
  }

  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });

    req.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function normalizeTicket(ticket) {
  if (!Array.isArray(ticket)) {
    return null;
  }

  const numbers = ticket.map((value) => Number(value));

  if (
    numbers.length !== 6 ||
    numbers.some((number) => !Number.isInteger(number) || number < 1 || number > 45)
  ) {
    return null;
  }

  const uniqueNumbers = [...new Set(numbers)];
  if (uniqueNumbers.length !== 6) {
    return null;
  }

  return uniqueNumbers.sort((left, right) => left - right);
}

function sanitizeTickets(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    return null;
  }

  const tickets = value.map(normalizeTicket);
  if (tickets.some((ticket) => ticket === null)) {
    return null;
  }

  return tickets;
}

async function insertDrawLog(payload) {
  const response = await fetch(`${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${SUPABASE_TABLE}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Accept-Profile": SUPABASE_SCHEMA,
      "Content-Profile": SUPABASE_SCHEMA,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`Supabase insert failed: ${response.status} ${text}`);
    error.status = response.status;
    error.details = text;
    throw error;
  }
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      message: "POST lotto tickets to store draw logs.",
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return sendJson(res, 500, {
      error: "Supabase environment variables are not configured.",
    });
  }

  if (isApiSupabaseUrl(SUPABASE_URL)) {
    return sendJson(res, 500, {
      error: "SUPABASE_URL must be your Supabase Project URL, not api.supabase.com.",
    });
  }

  try {
    const body = await readBody(req);
    const tickets = sanitizeTickets(body.tickets);

    if (!tickets) {
      return sendJson(res, 400, {
        error: "tickets must be a non-empty array of 6-number arrays.",
      });
    }

    const record = {
      ip_address: getClientIp(req),
      ticket_count: tickets.length,
      tickets,
    };

    await insertDrawLog(record);

    return sendJson(res, 200, {
      ok: true,
      ticket_count: tickets.length,
    });
  } catch (error) {
    console.error("Failed to log lotto draw", error);
    return sendJson(res, 502, {
      error: "Failed to save draw log.",
      detail: error && error.message ? error.message : "Unknown error",
      status: error && typeof error.status === "number" ? error.status : undefined,
    });
  }
};

module.exports.config = {
  runtime: "nodejs20.x",
};