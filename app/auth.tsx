import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function AuthScreen() {
	const { signIn, signUp, user } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSignUp, setIsSignUp] = useState(false);
	const [loading, setLoading] = useState(false);

  async function onSubmit() {
		if (!email.trim() || !password.trim()) {
			return Alert.alert('Erro', 'Preencha todos os campos.');
		}

		if (password.length < 6) {
			return Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
		}

		setLoading(true);
		const action = isSignUp ? signUp : signIn;
		const { error } = await action({ email, password });
		setLoading(false);
		
		if (error) {
			return Alert.alert('Erro', error);
		}
		
    router.replace('/dashboard');
	}

	React.useEffect(() => {
		if (user) {
			router.replace('/dashboard');
		}
	}, [user]);

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
			<Stack.Screen options={{ title: isSignUp ? 'Criar conta' : 'Entrar', headerShown: false }} />
			<ThemedView style={styles.container}>
				<ScrollView 
					showsVerticalScrollIndicator={false} 
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.header}>
						<ThemedText type="title" style={styles.title}>💰 Financias</ThemedText>
						<ThemedText style={styles.subtitle}>
							{isSignUp ? 'Crie sua conta para começar' : 'Entre para gerenciar suas finanças'}
						</ThemedText>
					</View>

					<View style={[styles.card, styles.shadow]}>
						<TextInput
							placeholder="E-mail"
							keyboardType="email-address"
							autoCapitalize="none"
							style={styles.input}
							value={email}
							onChangeText={setEmail}
							placeholderTextColor="#6B6B6B"
							editable={!loading}
						/>
						<TextInput
							placeholder="Senha (mínimo 6 caracteres)"
							secureTextEntry
							style={styles.input}
							value={password}
							onChangeText={setPassword}
							placeholderTextColor="#6B6B6B"
							editable={!loading}
							onSubmitEditing={onSubmit}
							returnKeyType="done"
						/>
						<TouchableOpacity 
							onPress={onSubmit} 
							disabled={loading} 
							style={[styles.button, styles.shadow, loading && styles.buttonDisabled]}
						>
							<ThemedText type="defaultSemiBold" style={styles.buttonText}>
								{loading ? '⏳ Aguarde...' : isSignUp ? '✓ Cadastrar' : '→ Entrar'}
							</ThemedText>
						</TouchableOpacity>
						<TouchableOpacity 
							onPress={() => setIsSignUp(!isSignUp)} 
							style={styles.linkRow}
							disabled={loading}
						>
							<ThemedText style={styles.linkText}>
								{isSignUp ? 'Já possui conta?' : 'Novo por aqui?'}
							</ThemedText>
							<ThemedText type="link" style={styles.linkHighlight}>
								{' '}{isSignUp ? 'Entrar' : 'Criar conta'}
							</ThemedText>
						</TouchableOpacity>
					</View>
					
					<Link href="/dashboard" asChild>
						<TouchableOpacity style={styles.skip}>
							<ThemedText type="link" style={styles.skipText}>Pular e explorar →</ThemedText>
						</TouchableOpacity>
					</Link>
				</ScrollView>
			</ThemedView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
  container: { 
		flex: 1, 
		backgroundColor: '#1A1A1A',
	},
	scrollContent: {
		flexGrow: 1,
		alignItems: 'center', 
		justifyContent: 'center', 
		padding: 24,
		minHeight: '100%',
	},
	header: {
		alignItems: 'center',
		marginBottom: 48,
		gap: 12,
	},
  title: { 
		fontSize: 36,
		fontWeight: 'bold',
		color: '#E5E5E5',
		letterSpacing: 0.5,
	},
	subtitle: {
		fontSize: 16,
		color: '#A0A0A0',
		textAlign: 'center',
		lineHeight: 24,
	},
  card: { 
		width: '100%', 
		maxWidth: 420, 
		gap: 20, 
		padding: 28, 
		borderRadius: 24, 
		backgroundColor: '#2D2D2D',
		borderWidth: 1,
		borderColor: 'rgba(0, 208, 156, 0.1)',
	},
  input: { 
		paddingHorizontal: 18, 
		paddingVertical: 16, 
		borderRadius: 16, 
		borderWidth: 1.5, 
		borderColor: '#3D3D3D', 
		backgroundColor: '#1A1A1A',
		fontSize: 16,
		color: '#E5E5E5',
		fontWeight: '500',
	},
  button: { 
		marginTop: 12, 
		paddingVertical: 18, 
		borderRadius: 16, 
		alignItems: 'center', 
		backgroundColor: '#00D09C',
	},
	buttonDisabled: {
		opacity: 0.5,
		backgroundColor: '#00A67E',
	},
  buttonText: { 
		color: '#1A1A1A', 
		fontWeight: '700',
		fontSize: 17,
		letterSpacing: 0.3,
	},
  linkRow: { 
		flexDirection: 'row', 
		justifyContent: 'center', 
		marginTop: 16,
		alignItems: 'center',
	},
	linkText: {
		fontSize: 14,
		color: '#A0A0A0',
	},
	linkHighlight: {
		fontSize: 14,
		fontWeight: '700',
		color: '#00D09C',
	},
  skip: { 
		marginTop: 32, 
		padding: 12,
	},
	skipText: {
		fontSize: 14,
		color: '#00D09C',
		fontWeight: '600',
	},
  shadow: { 
		shadowColor: '#00D09C', 
		shadowOpacity: 0.15, 
		shadowRadius: 20, 
		shadowOffset: { width: 0, height: 8 }, 
		elevation: 8,
	},
});


