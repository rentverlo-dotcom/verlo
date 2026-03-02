import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bmgrpcqrdvwculrisasi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZ3JwY3FyZHZ3Y3VscmlzYXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MjkyOTksImV4cCI6MjA4MjEwNTI5OX0.dVHmgzqoOFIEy1sGQgLDnGDiVxMykFfia9HY7b-XHdY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})