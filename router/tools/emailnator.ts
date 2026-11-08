/*
  Emailnator (emailnator.com) - temp mail service.
  generate / bulk / inbox / message / delete / extend.
*/
const HOST = 'https://www.emailnator.com';

const API = {
  generate: `${HOST}/api/generate-email`,
  bulk: `${HOST}/api/generate-bulk-email`,
  inbox: `${HOST}/api/message-list`,
  extend: `${HOST}/api/extend-email`,
  message: `${HOST}/api/message`,
  deleteMessage: `${HOST}/api/delete-message`,
};

const EMAIL_TYPES: Record<string, number> = {
  domain: 1,
  plusGmail: 2,
  dotGmail: 3,
  googleMail: 8,
};

const TYPE_BY_ID: Record<number, string> = Object.fromEntries(
  Object.entries(EMAIL_TYPES).map(([name, id]) => [id, name])
);

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Origin: HOST,
  Referer: `${HOST}/`,
};

const BULK_CHUNK = 500;
const MESSAGE_LIMIT = 10;

function withTimeout(ms = 30_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText}${json ? `: ${JSON.stringify(json).slice(0, 200)}` : `: ${text.slice(0, 200)}`}`);
    (err as any).status = res.status;
    (err as any).body = json ?? text;
    throw err;
  }
  if (json === null) throw new Error(`Respons bukan JSON: ${text.slice(0, 200)}`);
  return json;
}

function resolveIds(input: any): number[] {
  if (input === undefined || input === null) return Object.values(EMAIL_TYPES);
  if (typeof input === 'number') return [input];
  if (typeof input === 'string') {
    const id = EMAIL_TYPES[input] ?? Number(input);
    return Number.isFinite(id) ? [id] : Object.values(EMAIL_TYPES);
  }
  if (Array.isArray(input)) {
    const ids: number[] = [];
    for (const item of input) {
      const id = EMAIL_TYPES[String(item)] ?? Number(item);
      if (Number.isFinite(id)) ids.push(id);
    }
    return ids.length ? ids : Object.values(EMAIL_TYPES);
  }
  return Object.values(EMAIL_TYPES);
}

function normalizeAddress(raw: any, fallbackIds: number[]) {
  if (!raw?.email) return null;
  const typeId = Number(raw.email_type_id ?? fallbackIds[0] ?? 0);
  return {
    email: String(raw.email).trim(),
    typeId: Number.isFinite(typeId) ? typeId : null,
    typeName: TYPE_BY_ID[typeId] ?? null,
  };
}

function normalizeMessage(raw: any) {
  return {
    id: raw?.id ?? raw?.message_id ?? null,
    from: raw?.from ?? raw?.sender ?? null,
    subject: raw?.subject ?? null,
    preview: raw?.preview ?? raw?.snippet ?? null,
    body: raw?.body ?? raw?.html ?? raw?.message ?? null,
    receivedAt: raw?.received_at ?? raw?.date ?? raw?.created_at ?? null,
  };
}

async function generateEmailRaw(ids: number[]) {
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(API.generate, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ ids }),
      signal,
    });
    const json = await parseJsonSafe(res);
    if (json.status !== 'success') throw new Error(json.message ?? json.error ?? 'generate-email gagal');
    return normalizeAddress(json, ids);
  } finally {
    done();
  }
}

async function generateBulk(count: number, ids: number[]) {
  const total = Math.max(1, Math.min(500, Math.floor(Number(count) || 10)));
  const seen = new Map<string, any>();
  const errors: string[] = [];
  let attempts = 0;

  while (seen.size < total && attempts < 5) {
    attempts += 1;
    const batch = Math.min(total - seen.size, BULK_CHUNK);
    const { signal, done } = withTimeout(60_000);
    try {
      const res = await fetch(API.bulk, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ ids, count: batch }),
        signal,
      });
      const json = await parseJsonSafe(res);
      if (json.status !== 'success') {
        errors.push(json.message ?? json.error ?? 'generate-bulk gagal');
      } else {
        for (const item of json.results ?? []) {
          const address = normalizeAddress(item, ids);
          if (address && !seen.has(address.email)) seen.set(address.email, address);
        }
      }
    } catch (error: any) {
      errors.push(error.message);
    } finally {
      done();
    }
  }

  const addresses = [...seen.values()];
  return {
    requested: total,
    received: addresses.length,
    complete: addresses.length >= total,
    attempts,
    errors,
    addresses,
  };
}

async function getInboxRaw(email: string, limit = 20) {
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(API.inbox, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ email, limit }),
      signal,
    });
    const json = await parseJsonSafe(res);
    if (json.status !== 'success') throw new Error(json.message ?? json.error ?? 'message-list gagal');
    const messages = (json.messages ?? []).map(normalizeMessage);
    return {
      email,
      messages,
      count: Number(json.message_count ?? messages.length) || 0,
      limit: Number(json.message_limit ?? MESSAGE_LIMIT) || MESSAGE_LIMIT,
    };
  } finally {
    done();
  }
}

async function getMessageRaw(messageId: string) {
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(`${API.message}/${encodeURIComponent(messageId)}`, {
      headers: DEFAULT_HEADERS,
      signal,
    });
    const json = await parseJsonSafe(res);
    if (json.status !== 'success') throw new Error(json.message ?? json.error ?? 'message gagal');
    return normalizeMessage(json.message ?? json);
  } finally {
    done();
  }
}

async function deleteMessageRaw(messageId: string) {
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(`${API.deleteMessage}/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
      headers: DEFAULT_HEADERS,
      signal,
    });
    const json = await parseJsonSafe(res);
    return { ok: json.status === 'success', message: json.message ?? null };
  } finally {
    done();
  }
}

async function extendEmailRaw(email: string) {
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(API.extend, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ email }),
      signal,
    });
    const json = await parseJsonSafe(res);
    return { ok: json.status === 'success', email, message: json.message ?? null };
  } finally {
    done();
  }
}

const qOrBody = (req: any, key: string) => req.query[key] ?? req.body?.[key];

const mkDesc = (
  endpoint: string,
  name: string,
  description: string,
  params: any[],
  run: ({ req }: { req: any }) => Promise<any>
) => ({
  metode: 'GET',
  endpoint,
  name,
  category: 'tools',
  description,
  tags: ['Tools', 'Temp Mail', 'Emailnator'],
  example: params.map((p) => `${p.name}=${p.required ? '' : 'opsional'}`).join('&'),
  params,
  run: async ({ req }: any) => {
    try {
      return { status: true, data: await run({ req }), timestamp: new Date().toISOString() };
    } catch (error: any) {
      return { status: false, error: error.message || 'Internal Server Error', code: 500 };
    }
  },
});

export default [
  mkDesc('/api/tools/emailnator/generate', 'Emailnator Generate', 'Buat alamat email temporer (domain, plusGmail, dotGmail, googleMail).', [
    { name: 'ids', required: false, description: 'Jenis email: domain | plusGmail | dotGmail | googleMail' },
  ], async ({ req }: any) => {
    const idsInput = qOrBody(req, 'ids');
    const ids = resolveIds(idsInput === undefined ? undefined : String(idsInput).split(','));
    const result = await generateEmailRaw(ids);
    if (!result) return { status: false, error: 'Gagal generate email', code: 500 };
    return result;
  }),
  mkDesc('/api/tools/emailnator/bulk', 'Emailnator Bulk', 'Generate banyak email sekaligus (max 500, unik & terfilter).', [
    { name: 'count', required: false, description: 'Jumlah email (default 10, max 500)' },
    { name: 'ids', required: false, description: 'Jenis email' },
  ], async ({ req }: any) => {
    const count = Number(qOrBody(req, 'count') || 10);
    const idsInput = qOrBody(req, 'ids');
    const ids = resolveIds(idsInput === undefined ? undefined : String(idsInput).split(','));
    return await generateBulk(count, ids);
  }),
  mkDesc('/api/tools/emailnator/inbox', 'Emailnator Inbox', 'Cek kotak masuk email temporer (10 pesan terakhir).', [
    { name: 'email', required: true, description: 'Alamat email temporer' },
    { name: 'limit', required: false, description: 'Maks pesan (default 20)' },
  ], async ({ req }: any) => {
    const email = String(qOrBody(req, 'email') ?? '').trim();
    if (!email) return { status: false, error: 'Parameter wajib: email', code: 400 };
    const limit = Number(qOrBody(req, 'limit') || 20);
    return await getInboxRaw(email, limit);
  }),
  mkDesc('/api/tools/emailnator/message', 'Emailnator Message', 'Ambil isi pesan lengkap berdasarkan message id.', [
    { name: 'id', required: true, description: 'Message id dari inbox' },
  ], async ({ req }: any) => {
    const id = String(qOrBody(req, 'id') ?? '').trim();
    if (!id) return { status: false, error: 'Parameter wajib: id', code: 400 };
    return await getMessageRaw(id);
  }),
  mkDesc('/api/tools/emailnator/delete', 'Emailnator Delete', 'Hapus pesan temporer berdasarkan message id.', [
    { name: 'id', required: true, description: 'Message id dari inbox' },
  ], async ({ req }: any) => {
    const id = String(qOrBody(req, 'id') ?? '').trim();
    if (!id) return { status: false, error: 'Parameter wajib: id', code: 400 };
    return await deleteMessageRaw(id);
  }),
  mkDesc('/api/tools/emailnator/extend', 'Emailnator Extend', 'Perpanjang masa aktif email temporer.', [
    { name: 'email', required: true, description: 'Alamat email temporer' },
  ], async ({ req }: any) => {
    const email = String(qOrBody(req, 'email') ?? '').trim();
    if (!email) return { status: false, error: 'Parameter wajib: email', code: 400 };
    return await extendEmailRaw(email);
  }),
];
