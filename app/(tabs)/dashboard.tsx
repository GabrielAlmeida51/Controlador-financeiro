import { SafeChart } from '@/components/SafeChart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

type Tx = {
	id: string;
	type: 'income' | 'expense';
	amount: number;
	category_id: string | null;
	category_name?: string | null;
	created_at: string;
};

export default function DashboardScreen() {
	const [loading, setLoading] = useState(true);
	const [tx, setTx] = useState<Tx[]>([]);

	const loadData = useCallback(async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('transactions')
			.select('id,type,amount,category_id,created_at,categories(name)')
			.order('created_at', { ascending: false })
			.limit(200);
		
		if (error) {
			console.warn(error.message);
			setLoading(false);
			return;
		}
		
		const mapped: Tx[] = (data || []).map((row: any) => ({
			id: row.id,
			type: row.type,
			amount: Number(row.amount || 0),
			category_id: row.category_id,
			category_name: row.categories?.name ?? null,
			created_at: row.created_at,
		}));
		
		setTx(mapped);
		setLoading(false);
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	useEffect(() => {
		const channel = supabase
			.channel('dashboard-transactions')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
				loadData();
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [loadData]);

	const balance = useMemo(() => {
		return tx.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
	}, [tx]);

	const groupedByMonth = useMemo(() => {
		const map: Record<string, { income: number; expense: number }> = {};
		
		tx.forEach((t) => {
			const d = new Date(t.created_at);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
			if (!map[key]) map[key] = { income: 0, expense: 0 };
			map[key][t.type] += t.amount;
		});
		
		const keys = Object.keys(map).sort();
		return keys.map((k) => ({ month: k, income: map[k].income, expense: map[k].expense }));
	}, [tx]);

	const highlights = useMemo(() => {
		const maxExpense = tx.filter((t) => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0];
		return {
			maiorDespesa: maxExpense ? { valor: maxExpense.amount, categoria: maxExpense.category_name } : null,
		};
	}, [tx]);

	const totalIncome = useMemo(() => {
		return tx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
	}, [tx]);

	const totalExpense = useMemo(() => {
		return tx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
	}, [tx]);

	return (
    <ThemedView style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
				<ThemedText type="title" style={styles.title}>💰 Resumo Financeiro</ThemedText>
				
				<View style={[styles.balanceCard, styles.shadow]}>
					<ThemedText style={styles.balanceLabel}>Saldo Atual</ThemedText>
					<ThemedText style={[styles.balanceValue, { color: balance >= 0 ? '#00D09C' : '#FF4757' }]}>
						R$ {balance.toFixed(2)}
					</ThemedText>
					<View style={styles.balanceDetails}>
						<View style={styles.balanceDetailItem}>
							<ThemedText style={styles.balanceDetailLabel}>Receitas</ThemedText>
							<ThemedText style={[styles.balanceDetailValue, { color: '#00D09C' }]}>
								R$ {totalIncome.toFixed(2)}
							</ThemedText>
						</View>
						<View style={styles.balanceDetailItem}>
							<ThemedText style={styles.balanceDetailLabel}>Despesas</ThemedText>
							<ThemedText style={[styles.balanceDetailValue, { color: '#FF4757' }]}>
								R$ {totalExpense.toFixed(2)}
							</ThemedText>
						</View>
					</View>
				</View>

				<View style={styles.cardsRow}>
					<View style={[styles.card, styles.shadow]}>
						<ThemedText style={styles.cardIcon}>📊</ThemedText>
						<ThemedText style={styles.cardLabel}>Total de Lançamentos</ThemedText>
						<ThemedText style={styles.cardValue}>{tx.length}</ThemedText>
					</View>
					<View style={[styles.card, styles.shadow]}>
						<ThemedText style={styles.cardIcon}>💸</ThemedText>
						<ThemedText style={styles.cardLabel}>Maior Despesa</ThemedText>
						<ThemedText style={styles.cardValue}>
							{highlights.maiorDespesa ? `R$ ${highlights.maiorDespesa.valor.toFixed(2)}` : '—'}
						</ThemedText>
						{highlights.maiorDespesa?.categoria && (
							<ThemedText style={styles.cardHint}>{highlights.maiorDespesa.categoria}</ThemedText>
						)}
					</View>
				</View>

				<View style={styles.chartSection}>
					<ThemedText type="subtitle" style={styles.chartTitle}>📈 Receitas vs Despesas (Mensal)</ThemedText>
					<View style={[styles.chartBox, styles.shadow]}>
						{loading ? (
							<ActivityIndicator size="large" color="#00D09C" />
						) : groupedByMonth.length === 0 ? (
							<View style={styles.emptyChart}>
								<ThemedText style={styles.emptyChartText}>Nenhum dado disponível</ThemedText>
								<ThemedText style={styles.emptyChartHint}>Adicione lançamentos para visualizar o gráfico</ThemedText>
							</View>
						) : (
							<SafeChart data={groupedByMonth} />
						)}
					</View>
				</View>
			</ScrollView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { 
		flex: 1, 
		backgroundColor: '#1A1A1A',
	},
	scrollContent: {
		padding: 16,
	},
	title: { 
		marginBottom: 20, 
		fontSize: 26,
		color: '#E5E5E5',
		fontWeight: 'bold',
	},
	
	// Balance Card
	balanceCard: {
		padding: 24,
		borderRadius: 20,
		marginBottom: 16,
		alignItems: 'center',
		backgroundColor: '#2D2D2D',
		borderWidth: 1,
		borderColor: 'rgba(0, 208, 156, 0.2)',
	},
	balanceLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#A0A0A0',
		marginBottom: 8,
		letterSpacing: 0.5,
	},
	balanceValue: {
		fontSize: 40,
		fontWeight: 'bold',
		marginBottom: 20,
		letterSpacing: 0.5,
	},
	balanceDetails: {
		flexDirection: 'row',
		gap: 32,
		width: '100%',
		justifyContent: 'center',
	},
	balanceDetailItem: {
		alignItems: 'center',
		gap: 6,
	},
	balanceDetailLabel: {
		fontSize: 12,
		color: '#A0A0A0',
		fontWeight: '500',
	},
	balanceDetailValue: {
		fontSize: 18,
		fontWeight: '700',
	},

	// Highlight Cards
	cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: { 
		flex: 1, 
		padding: 18, 
		borderRadius: 18, 
		backgroundColor: '#2D2D2D',
		alignItems: 'center',
		gap: 8,
		borderWidth: 1,
		borderColor: '#3D3D3D',
	},
	cardIcon: {
		fontSize: 32,
		marginBottom: 4,
	},
	cardLabel: {
		fontSize: 12,
		fontWeight: '600',
		color: '#A0A0A0',
		textAlign: 'center',
	},
	cardValue: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#E5E5E5',
	},
	cardHint: {
		fontSize: 11,
		color: '#00D09C',
		textAlign: 'center',
		fontWeight: '500',
	},

	// Chart Section
	chartSection: {
		marginBottom: 20,
	},
	chartTitle: {
		marginBottom: 12,
		fontSize: 16,
		color: '#E5E5E5',
		fontWeight: '600',
	},
  chartBox: { 
		flex: 1, 
		borderRadius: 18, 
		backgroundColor: '#2D2D2D', 
		alignItems: 'center', 
		justifyContent: 'center', 
		padding: 16,
		minHeight: 300,
		borderWidth: 1,
		borderColor: '#3D3D3D',
	},
	emptyChart: {
		alignItems: 'center',
		gap: 8,
		padding: 20,
	},
	emptyChartText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#E5E5E5',
	},
	emptyChartHint: {
		fontSize: 14,
		color: '#A0A0A0',
		textAlign: 'center',
	},

  shadow: { 
		shadowColor: '#00D09C', 
		shadowOpacity: 0.1, 
		shadowRadius: 16, 
		shadowOffset: { width: 0, height: 6 }, 
		elevation: 6 
	},
});


