import { createClient } from '@supabase/supabase-js'

const configuredUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const configuredKey = import.meta.env.VITE_SUPABASE_KEY as string | undefined
export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey)

// Mantém a interface disponível no desenvolvimento local mesmo quando o
// arquivo .env ainda não foi configurado. As telas que usam dados locais
// continuam funcionando; operações remotas exigem as credenciais reais.
const url = configuredUrl || 'http://127.0.0.1:54321'
const key = configuredKey || 'local-development-key'

export const supabase = createClient(url, key)
