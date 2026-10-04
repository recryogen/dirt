import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const feedUrl = 'https://www.anekdot.ru/rss/export_j.xml';

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
}

function cleanXml(value: string): string {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (_, key: string) => {
      if (key[0] === '#') return String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10));
      return entities[key] ?? `&${key};`;
    })
    .trim();
}

function hash(value: string): number {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = request.headers.get('Authorization');
    if (!auth) return response({ error: 'Unauthorized' }, 401);
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const verifier = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userError } = await verifier.auth.getUser();
    if (userError || !userData.user) return response({ error: 'Unauthorized' }, 401);

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const admin = createClient(url, service);
    const cached = await admin.from('daily_jokes').select('text').eq('joke_date', today).maybeSingle();
    if (cached.data?.text) return response({ text: cached.data.text });

    const feed = await fetch(feedUrl, { headers: { 'User-Agent': 'StudyDirt/1.0 (+https://www.anekdot.ru/)' } });
    if (!feed.ok) throw new Error(`RSS ${feed.status}`);
    const xml = await feed.text();
    const jokes = [...xml.matchAll(/<item[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<\/item>/gi)]
      .map((match) => cleanXml(match[1])).filter((text) => text.length > 10);
    if (jokes.length === 0) throw new Error('RSS is empty');
    const text = jokes[hash(today) % jokes.length];
    await admin.from('daily_jokes').upsert({ joke_date: today, text, source_url: 'https://www.anekdot.ru/' });
    return response({ text });
  } catch (error) {
    console.error(error);
    return response({ error: 'Joke is unavailable' }, 503);
  }
});
