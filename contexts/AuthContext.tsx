import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthContextValue = {
	user: User | null;
	session: Session | null;
	signIn: (params: { email: string; password: string }) => Promise<{ error?: string }>;
	signUp: (params: { email: string; password: string }) => Promise<{ error?: string }>;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		let mounted = true;
		
		supabase.auth.getSession().then(({ data }) => {
			if (!mounted) return;
			setSession(data.session);
			setUser(data.session?.user ?? null);
		});
		
		const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
			setSession(newSession);
			setUser(newSession?.user ?? null);
		});
		
		return () => {
			mounted = false;
			subscription.subscription.unsubscribe();
		};
	}, []);

	const value = useMemo<AuthContextValue>(() => ({
		user,
		session,
		signIn: async ({ email, password }) => {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			return { error: error?.message };
		},
		signUp: async ({ email, password }) => {
			const { error } = await supabase.auth.signUp({ email, password });
			return { error: error?.message };
		},
		signOut: async () => {
			await supabase.auth.signOut();
		},
	}), [user, session]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}


