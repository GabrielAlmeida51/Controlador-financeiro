import { ThemedText } from '@/components/themed-text';
import { Circle } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Bar, CartesianChart, useChartPressState } from 'victory-native';

type Props = {
	data: Array<{ month: string; income: number; expense: number }>;
};

type State = { hasError: boolean };

export class SafeChart extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.warn('Chart error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<View style={styles.fallbackContainer}>
					<ThemedText>Não foi possível renderizar o gráfico no seu dispositivo.</ThemedText>
					<ThemedText style={styles.fallbackHint}>Usando visualização alternativa:</ThemedText>
					{this.renderFallbackChart()}
				</View>
			);
		}
		if (!this.props.data || this.props.data.length === 0) {
			return <ThemedText>Nenhum dado para exibir.</ThemedText>;
		}

		try {
			return <VictoryChartWrapper data={this.props.data} />;
		} catch (error) {
			console.warn('Victory chart failed, using fallback:', error);
			return this.renderFallbackChart();
		}
	}

	renderFallbackChart() {
		const { data } = this.props;
		if (!data || data.length === 0) {
			return <ThemedText>Nenhum dado para exibir.</ThemedText>;
		}

		const max = Math.max(
			...data.map((d) => Math.max(d.income || 0, d.expense || 0)),
			1
		);

		return (
			<View style={{ gap: 8, width: '100%', padding: 8 }}>
				{data.slice(-6).map((d) => (
					<View key={d.month} style={{ gap: 6 }}>
						<ThemedText style={styles.monthLabel}>{d.month.split('-').reverse().join('/')}</ThemedText>
						<View style={styles.barsContainer}>
							<View style={styles.barRow}>
								<ThemedText style={styles.barLabel}>R</ThemedText>
								<View style={[styles.bar, { width: `${(d.income / max) * 80}%`, backgroundColor: '#16a34a' }]} />
							</View>
							<View style={styles.barRow}>
								<ThemedText style={styles.barLabel}>D</ThemedText>
								<View style={[styles.bar, { width: `${(d.expense / max) * 80}%`, backgroundColor: '#dc2626' }]} />
							</View>
						</View>
						<View style={styles.legendRow}>
							<ThemedText style={styles.legendText}>Receitas: R$ {d.income.toFixed(2)}</ThemedText>
							<ThemedText style={styles.legendText}>Despesas: R$ {d.expense.toFixed(2)}</ThemedText>
						</View>
					</View>
				))}
			</View>
		);
	}
}

// Componente separado para Victory Native Chart
function VictoryChartWrapper({ data }: { data: Array<{ month: string; income: number; expense: number }> }) {
	// Prepara dados para o gráfico (últimos 6 meses)
	const chartData = data.slice(-6).flatMap((d, index) => [
		{ x: index, y: d.income, type: 'income', month: d.month },
		{ x: index + 0.4, y: d.expense, type: 'expense', month: d.month },
	]);

	const { state, isActive } = useChartPressState({ x: 0, y: { income: 0, expense: 0 } });

	return (
		<View style={styles.chartContainer}>
			<View style={{ height: 250, width: '100%' }}>
				<CartesianChart
					data={chartData}
					xKey="x"
					yKeys={["y"]}
					domainPadding={{ left: 20, right: 20, top: 20 }}
					chartPressState={state}
				>
					{({ points, chartBounds }) => (
						<>
							{points.y.map((point, index) => {
								const isIncome = chartData[index]?.type === 'income';
								return (
									<Bar
										key={index}
										points={[point]}
										chartBounds={chartBounds}
										color={isIncome ? '#16a34a' : '#dc2626'}
										barWidth={15}
										roundedCorners={{ topLeft: 4, topRight: 4 }}
									/>
								);
							})}
							{isActive && (
								<Circle
									cx={state.x.position}
									cy={state.y.income.position}
									r={8}
									color="#16a34a"
									opacity={0.8}
								/>
							)}
						</>
					)}
				</CartesianChart>
			</View>
			<View style={styles.legendContainer}>
				<View style={styles.legendItem}>
					<View style={[styles.legendColor, { backgroundColor: '#16a34a' }]} />
					<ThemedText>Receitas</ThemedText>
				</View>
				<View style={styles.legendItem}>
					<View style={[styles.legendColor, { backgroundColor: '#dc2626' }]} />
					<ThemedText>Despesas</ThemedText>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	chartContainer: { width: '100%', gap: 12 },
	fallbackContainer: { gap: 8, padding: 8 },
	fallbackHint: { fontSize: 12, opacity: 0.7, marginTop: 4 },
	monthLabel: { fontWeight: '600', fontSize: 13 },
	barsContainer: { gap: 4 },
	barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	barLabel: { width: 16, fontSize: 12, fontWeight: '600' },
	bar: { height: 12, borderRadius: 6, minWidth: 2 },
	legendRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
	legendText: { fontSize: 11 },
	legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingTop: 8 },
	legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	legendColor: { width: 16, height: 16, borderRadius: 4 },
});


