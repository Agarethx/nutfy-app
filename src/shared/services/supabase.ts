import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types'
import { supabaseStorage } from '@/shared/lib/storage'
import { env } from '@/shared/config/env'

export const supabase = createClient<Database>(
  env.supabase.url,
  env.supabase.anonKey,
  {
    auth: {
      storage: supabaseStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
)
