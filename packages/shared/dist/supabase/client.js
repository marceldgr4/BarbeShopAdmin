"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseAdmin = getSupabaseAdmin;
exports.getSupabaseForUser = getSupabaseForUser;
const supabase_js_1 = require("@supabase/supabase-js");
let _client = null;
/**
 * Returns a Supabase client using the SERVICE ROLE key.
 * This bypasses RLS — only use server-side, never expose to clients.
 */
function getSupabaseAdmin() {
    if (_client)
        return _client;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }
    _client = (0, supabase_js_1.createClient)(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    return _client;
}
/**
 * Creates a Supabase client authenticated as a specific user (via their JWT).
 * This respects RLS policies.
 */
function getSupabaseForUser(userJwt) {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    return (0, supabase_js_1.createClient)(url, anonKey, {
        global: {
            headers: { Authorization: `Bearer ${userJwt}` },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
//# sourceMappingURL=client.js.map