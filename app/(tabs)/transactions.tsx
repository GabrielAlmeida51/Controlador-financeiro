import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type Row = {
	id: string;
	type: 'income' | 'expense';
	amount: number;
	description: string | null;
	created_at: string;
	category_name?: string | null;
};

type Category = { id: string; name: string };

export default function TransactionsScreen() {
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [data, setData] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryId, setCategoryId] = useState<string | null>(null);
	const [categoryName, setCategoryName] = useState<string>('Todas');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		let q = supabase
			.from('transactions')
			.select('id,type,amount,description,created_at,categories(name)')
			.order('created_at', { ascending: false })
			.limit(200);

		if (type !== 'all') q = q.eq('type', type);
		if (categoryId) q = q.eq('category_id', categoryId);
		if (dateFrom) q = q.gte('created_at', new Date(`${dateFrom}T00:00:00Z`).toISOString());
		if (dateTo) q = q.lte('created_at', new Date(`${dateTo}T23:59:59Z`).toISOString());

		const { data, error } = await q;
		if (error) {
			console.warn(error.message);
			setLoading(false);
			return;
		}
		
		const rows: Row[] = (data || []).map((r: any) => ({
			id: r.id,
			type: r.type,
			amount: Number(r.amount || 0),
			description: r.description ?? null,
			created_at: r.created_at,
			category_name: r.categories?.name ?? null,
		}));
		
		setData(rows);
		setLoading(false);
	}, [type, categoryId, dateFrom, dateTo]);

	useEffect(() => {
		(async () => {
			const { data } = await supabase.from('categories').select('id,name').order('name');
			setCategories((data || []) as Category[]);
		})();
	}, []);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load])
	);

	useEffect(() => {
		const channel = supabase
			.channel('transactions-list')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
				load();
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [load]);

	function selectCategory(cat: Category) {
		setCategoryId(cat.id);
		setCategoryName(cat.name);
		setShowCategoryModal(false);
	}

	function clearCategoryFilter() {
		setCategoryId(null);
		setCategoryName('Todas');
		setShowCategoryModal(false);
	}

  const totalIncome = useMemo(() => data.filter(d => d.type === 'income').reduce((a, b) => a + b.amount, 0), [data]);
  const totalExpense = useMemo(() => data.filter(d => d.type === 'expense').reduce((a, b) => a + b.amount, 0), [data]);

	return (
		<ThemedView style={styles.container}>
			<View style={styles.header}>
				<ThemedText type="title">Lançamentos</ThemedText>
				<TouchableOpacity 
					onPress={() => setShowFilters(!showFilters)}
					style={styles.filterToggle}
				>
					<ThemedText style={styles.filterToggleText}>
						{showFilters ? '▲ Ocultar Filtros' : '▼ Mostrar Filtros'}
					</ThemedText>
				</TouchableOpacity>
			</View>

			{showFilters && (
				<View style={styles.filtersBox}>
					<View style={styles.filtersRow}>
						<TouchableOpacity onPress={() => setType('all')} style={[styles.chip, type === 'all' && styles.chipActive]}>
							<ThemedText style={type === 'all' && styles.chipTextActive}>Todos</ThemedText>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => setType('income')} style={[styles.chip, type === 'income' && styles.chipActive]}>
							<ThemedText style={type === 'income' && styles.chipTextActive}>Receitas</ThemedText>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => setType('expense')} style={[styles.chip, type === 'expense' && styles.chipActive]}>
							<ThemedText style={type === 'expense' && styles.chipTextActive}>Despesas</ThemedText>
						</TouchableOpacity>
					</View>
					
					<TouchableOpacity 
						onPress={() => setShowCategoryModal(true)} 
						style={[styles.input, styles.categorySelector]}
					>
						<ThemedText style={categoryId ? styles.categorySelected : styles.categoryPlaceholder}>
							Categoria: {categoryName}
						</ThemedText>
						<ThemedText style={styles.categoryArrow}>▼</ThemedText>
					</TouchableOpacity>

					<View style={styles.dateRow}>
						<View style={styles.dateInputContainer}>
							<ThemedText style={styles.dateLabel}>De:</ThemedText>
							<TextInput 
								placeholder="yyyy-mm-dd" 
								value={dateFrom} 
								onChangeText={setDateFrom} 
								style={styles.dateInput}
								placeholderTextColor="#6B6B6B"
							/>
						</View>
						<View style={styles.dateInputContainer}>
							<ThemedText style={styles.dateLabel}>Até:</ThemedText>
							<TextInput 
								placeholder="yyyy-mm-dd" 
								value={dateTo} 
								onChangeText={setDateTo} 
								style={styles.dateInput}
								placeholderTextColor="#6B6B6B"
							/>
						</View>
					</View>
				</View>
			)}

			<View style={styles.summaryRow}>
				<View style={[styles.summaryCard, styles.incomeCard]}>
					<ThemedText style={styles.summaryLabel}>Receitas</ThemedText>
					<ThemedText style={[styles.summaryValue, { color: '#00D09C' }]}>R$ {totalIncome.toFixed(2)}</ThemedText>
				</View>
				<View style={[styles.summaryCard, styles.expenseCard]}>
					<ThemedText style={styles.summaryLabel}>Despesas</ThemedText>
					<ThemedText style={[styles.summaryValue, { color: '#FF4757' }]}>R$ {totalExpense.toFixed(2)}</ThemedText>
				</View>
			</View>

			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#00D09C" />
				</View>
			) : (
				<FlatList
					data={data}
					keyExtractor={(i) => i.id}
					showsVerticalScrollIndicator={false}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load().finally(() => setRefreshing(false)); }} />}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<ThemedText style={styles.emptyText}>Nenhum lançamento encontrado</ThemedText>
							<ThemedText style={styles.emptyHint}>Adicione receitas e despesas na aba "Adicionar"</ThemedText>
						</View>
					}
					renderItem={({ item }) => (
            <View style={[styles.row, styles.shadow, { borderLeftColor: item.type === 'income' ? '#00D09C' : '#FF4757' }]}>
							<View style={styles.rowHeader}>
								<ThemedText type="defaultSemiBold" style={styles.rowCategory}>
									{item.category_name ?? (item.type === 'income' ? 'Receita' : 'Despesa')}
								</ThemedText>
								<ThemedText style={[styles.rowAmount, { color: item.type === 'income' ? '#00D09C' : '#FF4757' }]}>
									R$ {item.amount.toFixed(2)}
								</ThemedText>
							</View>
							<View style={styles.rowFooter}>
								<ThemedText style={styles.rowDate}>
									📅 {new Date(item.created_at).toLocaleDateString('pt-BR')}
								</ThemedText>
								{item.description && (
									<ThemedText style={styles.rowDescription}>{item.description}</ThemedText>
								)}
							</View>
						</View>
					)}
				/>
			)}

			{/* Modal de Seleção de Categoria */}
			<Modal
				visible={showCategoryModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowCategoryModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<ThemedText type="subtitle">Filtrar por Categoria</ThemedText>
							<TouchableOpacity onPress={() => setShowCategoryModal(false)}>
								<ThemedText style={styles.modalClose}>✕</ThemedText>
							</TouchableOpacity>
						</View>
						<ScrollView style={styles.modalScroll}>
							<TouchableOpacity 
								onPress={clearCategoryFilter}
								style={[styles.categoryItem, !categoryId && styles.categoryItemSelected]}
							>
								<ThemedText style={styles.categoryItemText}>Todas as categorias</ThemedText>
								{!categoryId && <ThemedText style={styles.checkmark}>✓</ThemedText>}
							</TouchableOpacity>
							{categories.map((cat) => (
								<TouchableOpacity 
									key={cat.id}
									onPress={() => selectCategory(cat)}
									style={[styles.categoryItem, categoryId === cat.id && styles.categoryItemSelected]}
								>
									<ThemedText style={styles.categoryItemText}>{cat.name}</ThemedText>
									{categoryId === cat.id && <ThemedText style={styles.checkmark}>✓</ThemedText>}
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { 
		flex: 1, 
		padding: 16,
		backgroundColor: '#1A1A1A',
	},
	header: { 
		flexDirection: 'row', 
		justifyContent: 'space-between', 
		alignItems: 'center',
		marginBottom: 12,
	},
	filterToggle: {
		padding: 8,
	},
	filterToggleText: {
		fontSize: 14,
		color: '#00D09C',
		fontWeight: '600',
	},
	filtersBox: { 
		gap: 12, 
		padding: 16, 
		borderRadius: 16, 
		backgroundColor: '#2D2D2D',
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#3D3D3D',
	},
	filtersRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
	input: { 
		paddingHorizontal: 14, 
		paddingVertical: 12, 
		borderRadius: 12, 
		borderWidth: 1.5, 
		borderColor: '#3D3D3D',
		backgroundColor: '#1A1A1A',
		fontSize: 14,
		color: '#E5E5E5',
	},
	chip: { 
		paddingHorizontal: 16, 
		paddingVertical: 10, 
		borderRadius: 999, 
		borderWidth: 1.5, 
		borderColor: '#3D3D3D',
		backgroundColor: '#1A1A1A',
	},
	chipActive: { 
		backgroundColor: '#00D09C',
		borderColor: '#00D09C',
	},
	chipTextActive: {
		color: '#1A1A1A',
		fontWeight: '700',
	},
	categorySelector: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	categoryPlaceholder: { color: '#A0A0A0', fontSize: 14 },
	categorySelected: { color: '#E5E5E5', fontSize: 14, fontWeight: '500' },
	categoryArrow: { fontSize: 12, color: '#A0A0A0' },
	dateRow: { 
		flexDirection: 'row', 
		gap: 12,
	},
	dateInputContainer: {
		flex: 1,
		gap: 4,
	},
	dateLabel: {
		fontSize: 12,
		fontWeight: '600',
		color: '#A0A0A0',
	},
	dateInput: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 12,
		borderWidth: 1.5,
		borderColor: '#3D3D3D',
		backgroundColor: '#1A1A1A',
		fontSize: 14,
		color: '#E5E5E5',
	},
	summaryRow: {
		flexDirection: 'row',
		gap: 12,
		marginBottom: 12,
	},
	summaryCard: { 
		flex: 1, 
		padding: 16, 
		borderRadius: 16,
		borderWidth: 1,
	},
	incomeCard: {
		backgroundColor: '#2D2D2D',
		borderColor: 'rgba(0, 208, 156, 0.3)',
	},
	expenseCard: {
		backgroundColor: '#2D2D2D',
		borderColor: 'rgba(255, 71, 87, 0.3)',
	},
	summaryLabel: {
		fontSize: 12,
		fontWeight: '600',
		marginBottom: 4,
		color: '#A0A0A0',
	},
	summaryValue: {
		fontSize: 18,
		fontWeight: 'bold',
	},
  row: { 
		padding: 16, 
		borderRadius: 16, 
		backgroundColor: '#2D2D2D', 
		marginBottom: 10, 
		borderLeftWidth: 4,
		gap: 8,
		borderWidth: 1,
		borderColor: '#3D3D3D',
	},
	rowHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	rowCategory: {
		fontSize: 16,
		color: '#E5E5E5',
		fontWeight: '500',
	},
	rowAmount: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	rowFooter: {
		gap: 4,
	},
	rowDate: {
		fontSize: 13,
		color: '#A0A0A0',
	},
	rowDescription: {
		fontSize: 14,
		color: '#A0A0A0',
		fontStyle: 'italic',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyContainer: {
		padding: 40,
		alignItems: 'center',
		gap: 8,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
		color: '#E5E5E5',
	},
	emptyHint: {
		fontSize: 14,
		color: '#A0A0A0',
		textAlign: 'center',
	},
  shadow: { 
		shadowColor: '#00D09C', 
		shadowOpacity: 0.1, 
		shadowRadius: 12, 
		shadowOffset: { width: 0, height: 4 }, 
		elevation: 4 
	},
	// Modal styles
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.8)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#2D2D2D',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		maxHeight: '70%',
		paddingBottom: 20,
		borderWidth: 1,
		borderColor: '#3D3D3D',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#3D3D3D',
	},
	modalClose: {
		fontSize: 24,
		color: '#A0A0A0',
		fontWeight: '300',
	},
	modalScroll: {
		maxHeight: 400,
	},
	categoryItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#3D3D3D',
	},
	categoryItemSelected: {
		backgroundColor: 'rgba(0, 208, 156, 0.1)',
	},
	categoryItemText: {
		fontSize: 16,
		color: '#E5E5E5',
	},
	checkmark: {
		fontSize: 18,
		color: '#00D09C',
		fontWeight: 'bold',
	},
});


