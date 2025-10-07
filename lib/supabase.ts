import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { ENV, assertEnv } from './env';

assertEnv();

export const supabase = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
	auth: {
		storage: AsyncStorage as any,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});


