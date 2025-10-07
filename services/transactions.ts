import { supabase } from '@/lib/supabase';

export type Transaction = {
	id: string;
	type: 'income' | 'expense';
	amount: number;
	description?: string | null;
	category_id?: string | null;
	created_at: string;
	receipt_path?: string | null;
};

export async function listTransactions(limit = 200): Promise<Transaction[]> {
	const { data, error } = await supabase
		.from('transactions')
		.select('id,type,amount,description,category_id,created_at,receipt_path')
		.order('created_at', { ascending: false })
		.limit(limit);
	
	if (error) throw error;
	return (data || []).map((r) => ({ ...r, amount: Number(r.amount || 0) })) as Transaction[];
}

export async function createTransaction(payload: Omit<Transaction, 'id'>) {
	const { error } = await supabase.from('transactions').insert(payload);
	if (error) throw error;
}


