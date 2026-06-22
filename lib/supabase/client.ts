import type { SupabaseClient } from '@supabase/supabase-js'

let _createBrowserClient: ((url: string, key: string) => unknown) | null = null

async function getModule() {
  if (!_createBrowserClient) {
    const mod = await import('@supabase/ssr')
    _createBrowserClient = mod.createBrowserClient
  }
  return _createBrowserClient!
}

export async function createClient(): Promise<SupabaseClient> {
  const fn = await getModule()
  return fn(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as SupabaseClient
}