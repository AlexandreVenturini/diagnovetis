import { createClient } from '@supabase/supabase-js'

const urlConfigurada = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chaveConfigurada = (import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as
  string | undefined
export const supabaseConfigurado = Boolean(urlConfigurada && chaveConfigurada)

const url = urlConfigurada || 'http://127.0.0.1:54321'
const key = chaveConfigurada || 'local-development-key'

export const supabase = createClient(url, key)
