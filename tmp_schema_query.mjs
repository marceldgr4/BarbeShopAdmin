// Schema extractor using @supabase/supabase-js + fetch for raw SQL via REST
// Run with: node schema_extract.mjs

const SUPABASE_URL = 'https://vxcaadneaegpuqhtgkhz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4Y2FhZG5lYWVncHVxaHRna2h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUyMDUyNiwiZXhwIjoyMDc5MDk2NTI2fQ.gj3NeZN1elUK2Kez5vQez0lAPwVfuxSlGF8nqR6Ieno';

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function runSQL(sql) {
  // Use the PostgREST RPC route – requires a wrapper function.
  // Instead we hit the Supabase Realtime REST endpoint that allows raw SQL via the DB REST proxy.
  // We query each public table individually for schema info.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: sql }),
  });
  return res.json();
}

// Alternative: use the Supabase management API for schema
// This approach hits each known table and uses PostgREST's ?select= to introspect
// But we already have the list of tables from screenshots.

// Tables observed in Table Editor:
const knownTables = [
  'admin_users', 'appointments', 'barber_ratings', 'barbers',
  'barrer_specialites', 'branch_hours', 'branches', 'favorite_barbers',
  'profiles', 'promotions', 'reviews', 'roles',
  'service_categories', 'services', 'users', 'appointment_statuses'
];

async function describeTable(table) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?limit=0`,
    { method: 'GET', headers: { ...headers, 'Prefer': 'count=exact' } }
  );
  const contentRange = res.headers.get('content-range');
  const contentType = res.headers.get('content-type');
  let data = null;
  let schema = null;
  try {
    data = await res.json();
    // If table exists but empty, data could be []
    // If error, data will have code/message
  } catch(e) {}
  return { table, status: res.status, contentRange, data };
}

// Primary approach: use the OpenAPI spec that PostgREST exposes
async function getOpenAPISpec() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers });
  return res.json();
}

console.log('Fetching OpenAPI spec...');
const spec = await getOpenAPISpec();

if (spec?.definitions) {
  console.log('\n========== TABLES & COLUMNS (from OpenAPI) ==========\n');
  for (const [name, def] of Object.entries(spec.definitions)) {
    if (!def.properties) continue;
    console.log(`\n--- TABLE: ${name} ---`);
    console.log('Required:', def.required || []);
    for (const [col, colDef] of Object.entries(def.properties)) {
      console.log(`  ${col}: ${colDef.type || colDef.$ref || '?'} | format: ${colDef.format || '-'} | desc: ${colDef.description || '-'}`);
    }
  }
} else {
  console.log('OpenAPI spec:', JSON.stringify(spec, null, 2).substring(0, 2000));
}
