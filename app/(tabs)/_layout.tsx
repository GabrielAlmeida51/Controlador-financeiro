import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
	const { signOut, user } = useAuth();
	const router = useRouter();

	async function handleLogout() {
		Alert.alert(
			'Sair',
			'Deseja realmente sair da sua conta?',
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Sair',
					style: 'destructive',
					onPress: async () => {
						await signOut();
						router.replace('/auth');
					},
				},
			]
		);
	}

  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
				headerStyle: {
					backgroundColor: Colors[colorScheme ?? 'light'].background,
				},
				headerTintColor: Colors[colorScheme ?? 'light'].text,
        tabBarStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background, borderTopColor: '#1f2022' },
        tabBarActiveBackgroundColor: '#161617',
        tabBarButton: HapticTab,
				headerRight: () => user ? (
					<TouchableOpacity 
						onPress={handleLogout}
						style={{ marginRight: 16, padding: 8 }}
					>
						<ThemedText style={{ fontSize: 14, color: '#dc2626', fontWeight: '600' }}>
							Sair
						</ThemedText>
					</TouchableOpacity>
				) : null,
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Lançamentos',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.text.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Adicionar',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.app.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categorias',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.grid.2x2.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
