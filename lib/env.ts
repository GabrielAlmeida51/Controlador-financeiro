import Constants from 'expo-constants';

type AppExtra = {
	supabaseUrl?: string;
	supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra || Constants.manifest2?.extra || {}) as AppExtra;

export const ENV = {
	supabaseUrl: extra.supabaseUrl || '',
	supabaseAnonKey: extra.supabaseAnonKey || '',
};

export function assertEnv(): void {
	if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
		throw new Error('Supabase env not set. Define SUPABASE_URL and SUPABASE_ANON_KEY in app.json extra or EAS secrets.');
	}
}


