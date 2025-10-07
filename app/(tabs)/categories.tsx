import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type Category = { id: string; name: string };

export default function CategoriesScreen() {
	const [name, setName] = useState('');
	const [data, setData] = useState<Category[]>([]);
	const [loading, setLoading] = useState(false);

	const load = useCallback(async () => {
		const { data, error } = await supabase.from('categories').select('id,name').order('name');
		
		if (error) {
			console.warn('Erro ao carregar categorias:', error.message);
			return;
		}
		
		setData(data || []);
	}, []);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load])
	);

	useEffect(() => {
		const channel = supabase
			.channel('categories-list')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
				load();
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [load]);

	async function add() {
		const trimmedName = name.trim();
		
		if (!trimmedName) {
			return Alert.alert('Erro', 'Digite um nome para a categoria.');
		}
		
		setLoading(true);
		
		const { error } = await supabase.from('categories').insert({ name: trimmedName });
		
		setLoading(false);
		
		if (error) {
			return Alert.alert('Erro', error.message);
		}
		
		Alert.alert('Sucesso', 'Categoria criada com sucesso!');
		setName('');
		load();
	}

	async function deleteCategory(id: string, categoryName: string) {
		Alert.alert(
			'Confirmar Exclusão',
			`Deseja realmente excluir a categoria "${categoryName}"?\n\nAtenção: Os lançamentos associados não serão excluídos, apenas ficarão sem categoria.`,
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Excluir',
					style: 'destructive',
					onPress: async () => {
						const { error } = await supabase.from('categories').delete().eq('id', id);
						
						if (error) {
							return Alert.alert('Erro', error.message);
						}
						
						Alert.alert('Sucesso', 'Categoria excluída!');
						load();
					},
				},
			]
		);
	}

	return (
    <ThemedView style={styles.container}>
			<ThemedText type="title" style={styles.title}>Categorias</ThemedText>
			
			<View style={styles.addSection}>
				<ThemedText type="subtitle" style={styles.sectionTitle}>Adicionar Nova Categoria</ThemedText>
				<View style={styles.row}>
					<TextInput 
						placeholder="Nome da categoria" 
						value={name} 
						onChangeText={setName} 
						style={[styles.input, styles.shadow]}
						placeholderTextColor="#6B6B6B"
						onSubmitEditing={add}
						returnKeyType="done"
					/>
					<TouchableOpacity 
						onPress={add} 
						disabled={loading}
						style={[styles.button, styles.shadow, loading && styles.buttonDisabled]}
					>
						<ThemedText style={styles.buttonText}>
							{loading ? '...' : '+ Adicionar'}
						</ThemedText>
					</TouchableOpacity>
				</View>
			</View>

			<ThemedText type="subtitle" style={styles.listTitle}>
				Minhas Categorias ({data.length})
			</ThemedText>

      <FlatList
				data={data}
				keyExtractor={(i) => i.id}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<ThemedText style={styles.emptyText}>Nenhuma categoria cadastrada</ThemedText>
						<ThemedText style={styles.emptyHint}>Adicione categorias para organizar suas finanças</ThemedText>
					</View>
				}
        renderItem={({ item }) => (
					<View style={[styles.rowItem, styles.shadow]}>
						<View style={styles.categoryIcon}>
							<ThemedText style={styles.categoryIconText}>📁</ThemedText>
						</View>
						<ThemedText style={styles.categoryName}>{item.name}</ThemedText>
						<TouchableOpacity 
							onPress={() => deleteCategory(item.id, item.name)}
							style={styles.deleteButton}
						>
							<ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
						</TouchableOpacity>
					</View>
				)}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { 
		flex: 1, 
		padding: 16,
		backgroundColor: '#1A1A1A',
	},
	title: { 
		marginBottom: 24,
		color: '#E5E5E5',
		fontSize: 26,
	},
	addSection: {
		marginBottom: 24,
		padding: 20,
		borderRadius: 20,
		backgroundColor: '#2D2D2D',
		borderWidth: 1,
		borderColor: 'rgba(0, 208, 156, 0.15)',
	},
	sectionTitle: { 
		marginBottom: 14, 
		fontSize: 16,
		color: '#E5E5E5',
		fontWeight: '600',
	},
	row: { flexDirection: 'row', gap: 12 },
  rowItem: { 
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16, 
		borderRadius: 16, 
		backgroundColor: '#2D2D2D', 
		marginBottom: 12,
		gap: 12,
		borderWidth: 1,
		borderColor: '#3D3D3D',
	},
	categoryIcon: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(0, 208, 156, 0.15)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	categoryIconText: {
		fontSize: 22,
	},
	categoryName: {
		flex: 1,
		fontSize: 16,
		fontWeight: '500',
		color: '#E5E5E5',
	},
	deleteButton: {
		padding: 8,
	},
	deleteButtonText: {
		fontSize: 22,
	},
	input: { 
		flex: 1, 
		paddingHorizontal: 18, 
		paddingVertical: 14, 
		borderRadius: 16, 
		borderWidth: 1.5, 
		borderColor: '#3D3D3D',
		backgroundColor: '#1A1A1A',
		fontSize: 16,
		color: '#E5E5E5',
	},
	button: { 
		paddingHorizontal: 24, 
		alignItems: 'center', 
		justifyContent: 'center', 
		borderRadius: 16, 
		backgroundColor: '#00D09C',
		minWidth: 130,
		paddingVertical: 14,
	},
	buttonText: { 
		color: '#1A1A1A', 
		fontWeight: '700',
		fontSize: 16,
		letterSpacing: 0.3,
	},
	buttonDisabled: {
		opacity: 0.5,
	},
	listTitle: {
		marginBottom: 14,
		fontSize: 16,
		color: '#E5E5E5',
		fontWeight: '600',
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
		shadowOpacity: 0.12, 
		shadowRadius: 14, 
		shadowOffset: { width: 0, height: 5 }, 
		elevation: 5 
	},
});


