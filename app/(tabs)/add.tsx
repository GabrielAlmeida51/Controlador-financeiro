import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type Category = { id: string; name: string };

export default function AddScreen() {
	const [type, setType] = useState<'income' | 'expense'>('expense');
	const [amount, setAmount] = useState('');
	const [categoryId, setCategoryId] = useState<string | null>(null);
	const [categoryName, setCategoryName] = useState<string>('Selecione uma categoria');
	const [description, setDescription] = useState('');
	const [date, setDate] = useState(new Date());
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [categories, setCategories] = useState<Category[]>([]);
	const [showCategoryModal, setShowCategoryModal] = useState(false);

	const loadCategories = useCallback(async () => {
		const { data, error } = await supabase.from('categories').select('id,name').order('name');
		if (error) {
			console.warn('Erro ao carregar categorias:', error.message);
			return;
		}
		setCategories(data || []);
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadCategories();
		}, [loadCategories])
	);

	useEffect(() => {
		const channel = supabase
			.channel('add-categories')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
				loadCategories();
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [loadCategories]);

	async function pickImage() {
		const res = await ImagePicker.launchImageLibraryAsync({ 
			mediaTypes: ImagePicker.MediaTypeOptions.Images, 
			quality: 0.7 
		});
		
		if (!res.canceled) {
			setImageUri(res.assets[0].uri);
		}
	}

	async function uploadReceipt(userId: string): Promise<string | null> {
		if (!imageUri) return null;
		
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
    const filePath = `${userId}/${Date.now()}.jpg`;
    const arrayBuffer = decodeBase64(base64);
    const { data, error } = await supabase.storage.from('receipts').upload(filePath, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
		
		if (error) {
			console.warn(error.message);
			return null;
		}
		
		return data?.path ?? null;
	}

	async function onSubmit() {
		if (!amount || amount.trim() === '') {
			return Alert.alert('Erro', 'Informe um valor válido.');
		}
		
		const numAmount = Number(amount.replace(',', '.'));
		
		if (isNaN(numAmount) || numAmount <= 0) {
			return Alert.alert('Erro', 'Informe um valor numérico válido maior que zero.');
		}

		setLoading(true);
		
		const { data: userRes } = await supabase.auth.getUser();
		const userId = userRes.user?.id;
		
		if (!userId) {
			setLoading(false);
			return Alert.alert('Erro', 'Faça login para continuar.');
		}
		
		let receiptPath: string | null = null;
		try {
			receiptPath = await uploadReceipt(userId);
		} catch (err) {
			console.warn('Erro ao fazer upload do comprovante:', err);
		}
		
		const { error } = await supabase.from('transactions').insert({
			type,
			amount: numAmount,
			category_id: categoryId,
			description: description.trim() || null,
			created_at: date.toISOString(),
			receipt_path: receiptPath,
		});
		
		setLoading(false);
		
		if (error) return Alert.alert('Erro', error.message);
		
		Alert.alert('Sucesso', 'Lançamento salvo com sucesso!');
		setAmount('');
		setCategoryId(null);
		setCategoryName('Selecione uma categoria');
		setDescription('');
		setImageUri(null);
	}

	function selectCategory(cat: Category) {
		setCategoryId(cat.id);
		setCategoryName(cat.name);
		setShowCategoryModal(false);
	}

	return (
    <ThemedView style={styles.container}>
			<ScrollView 
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				<ThemedText type="title" style={styles.title}>Adicionar Lançamento</ThemedText>
				
				<View style={styles.section}>
					<ThemedText type="subtitle" style={styles.sectionTitle}>Tipo</ThemedText>
					<View style={styles.row}>
						<TouchableOpacity 
							onPress={() => setType('expense')} 
							style={[styles.typeBtn, styles.shadow, type === 'expense' && styles.typeActive]}
						>
							<ThemedText style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>💸 Despesa</ThemedText>
						</TouchableOpacity>
						<TouchableOpacity 
							onPress={() => setType('income')} 
							style={[styles.typeBtn, styles.shadow, type === 'income' && styles.typeActive]}
						>
							<ThemedText style={[styles.typeText, type === 'income' && styles.typeTextActive]}>💰 Receita</ThemedText>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.section}>
					<ThemedText type="subtitle" style={styles.sectionTitle}>Valor *</ThemedText>
					<TextInput 
						placeholder="Ex: 123.45" 
						keyboardType="decimal-pad" 
						value={amount} 
						onChangeText={setAmount} 
						style={[styles.input, styles.shadow]}
						placeholderTextColor="#6B6B6B"
					/>
				</View>

				<View style={styles.section}>
					<ThemedText type="subtitle" style={styles.sectionTitle}>Categoria</ThemedText>
					<TouchableOpacity 
						onPress={() => setShowCategoryModal(true)} 
						style={[styles.input, styles.shadow, styles.categorySelector]}
					>
						<ThemedText style={categoryId ? styles.categorySelected : styles.categoryPlaceholder}>
							{categoryName}
						</ThemedText>
						<ThemedText style={styles.categoryArrow}>▼</ThemedText>
					</TouchableOpacity>
				</View>

				<View style={styles.section}>
					<ThemedText type="subtitle" style={styles.sectionTitle}>Descrição</ThemedText>
					<TextInput 
						placeholder="Adicione uma descrição (opcional)" 
						value={description} 
						onChangeText={setDescription} 
						style={[styles.input, styles.shadow, styles.textArea]}
						multiline
						numberOfLines={3}
						placeholderTextColor="#6B6B6B"
					/>
				</View>

				<View style={styles.section}>
					<ThemedText type="subtitle" style={styles.sectionTitle}>Comprovante</ThemedText>
					<TouchableOpacity onPress={pickImage} style={[styles.button, styles.shadow, styles.imageButton]}>
						<ThemedText style={styles.buttonText}>
							{imageUri ? '✓ Comprovante Anexado' : '📎 Anexar Comprovante'}
						</ThemedText>
					</TouchableOpacity>
					{imageUri && (
						<ThemedText style={styles.imageHint}>Toque novamente para trocar</ThemedText>
					)}
				</View>

				<TouchableOpacity 
					disabled={loading} 
					onPress={onSubmit} 
					style={[styles.button, styles.shadow, styles.submitButton, loading && styles.buttonDisabled]}
				>
					<ThemedText style={styles.buttonText}>
						{loading ? '⏳ Salvando...' : '✓ Salvar Lançamento'}
					</ThemedText>
				</TouchableOpacity>
			</ScrollView>

			<Modal
				visible={showCategoryModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowCategoryModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<ThemedText type="subtitle">Selecione uma Categoria</ThemedText>
							<TouchableOpacity onPress={() => setShowCategoryModal(false)}>
								<ThemedText style={styles.modalClose}>✕</ThemedText>
							</TouchableOpacity>
						</View>
						<ScrollView style={styles.modalScroll}>
							<TouchableOpacity 
								onPress={() => {
									setCategoryId(null);
									setCategoryName('Sem categoria');
									setShowCategoryModal(false);
								}}
								style={[styles.categoryItem, !categoryId && styles.categoryItemSelected]}
							>
								<ThemedText style={styles.categoryItemText}>Sem categoria</ThemedText>
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
		backgroundColor: '#1A1A1A',
	},
	scrollContent: {
		padding: 16,
	},
	title: { 
		marginBottom: 24,
		color: '#E5E5E5',
		fontSize: 26,
	},
	section: { marginBottom: 24 },
	sectionTitle: { 
		marginBottom: 10, 
		fontSize: 16,
		color: '#E5E5E5',
		fontWeight: '600',
	},
	row: { flexDirection: 'row', gap: 12 },
  input: { 
		paddingHorizontal: 18, 
		paddingVertical: 16, 
		borderRadius: 16, 
		borderWidth: 1.5, 
		borderColor: '#3D3D3D', 
		backgroundColor: '#2D2D2D',
		fontSize: 16,
		color: '#E5E5E5',
	},
	textArea: { 
		minHeight: 100, 
		textAlignVertical: 'top',
		paddingTop: 16,
	},
	button: { 
		alignItems: 'center', 
		justifyContent: 'center', 
		padding: 16, 
		borderRadius: 16, 
		backgroundColor: '#00D09C' 
	},
	buttonText: { 
		color: '#1A1A1A', 
		fontWeight: '700', 
		fontSize: 17,
		letterSpacing: 0.3,
	},
	buttonDisabled: { opacity: 0.5 },
  typeBtn: { 
		flex: 1, 
		padding: 16, 
		borderRadius: 16, 
		borderWidth: 2, 
		borderColor: '#3D3D3D', 
		alignItems: 'center', 
		backgroundColor: '#2D2D2D' 
	},
	typeActive: { 
		backgroundColor: 'rgba(0, 208, 156, 0.15)', 
		borderColor: '#00D09C' 
	},
	typeText: { 
		fontWeight: '600', 
		fontSize: 16,
		color: '#E5E5E5',
	},
	typeTextActive: { 
		color: '#00D09C',
		fontWeight: '700',
	},
	categorySelector: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	categoryPlaceholder: { 
		color: '#A0A0A0', 
		fontSize: 16 
	},
	categorySelected: { 
		color: '#E5E5E5', 
		fontSize: 16, 
		fontWeight: '500' 
	},
	categoryArrow: { 
		fontSize: 12, 
		color: '#A0A0A0' 
	},
	imageButton: { 
		backgroundColor: '#2D2D2D',
		borderWidth: 1.5,
		borderColor: '#3D3D3D',
	},
	imageHint: { 
		fontSize: 12, 
		color: '#A0A0A0', 
		marginTop: 8, 
		textAlign: 'center',
		fontStyle: 'italic',
	},
	submitButton: { 
		backgroundColor: '#00D09C', 
		marginTop: 12,
		marginBottom: 20,
		paddingVertical: 18,
	},
  shadow: { 
		shadowColor: '#00D09C', 
		shadowOpacity: 0.15, 
		shadowRadius: 16, 
		shadowOffset: { width: 0, height: 6 }, 
		elevation: 6 
	},
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


