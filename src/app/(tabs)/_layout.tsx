import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'

type IoniconsName = ComponentProps<typeof Ionicons>['name']

function TabIcon({
  name,
  focusedName,
  color,
  focused,
}: {
  name: IoniconsName
  focusedName: IoniconsName
  color: string
  focused: boolean
}) {
  return (
    <Ionicons name={focused ? focusedName : name} size={24} color={color} />
  )
}

function tabIcon(name: IoniconsName, focusedName: IoniconsName) {
  const Icon = ({ color, focused }: { color: string; focused: boolean }) => (
    <TabIcon
      name={name}
      focusedName={focusedName}
      color={color}
      focused={focused}
    />
  )
  Icon.displayName = 'TabBarIcon'
  return Icon
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#a3a3a3',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Plan',
          tabBarIcon: tabIcon('calendar-outline', 'calendar'),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recetas',
          tabBarIcon: tabIcon('restaurant-outline', 'restaurant'),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Despensa',
          tabBarIcon: tabIcon('cube-outline', 'cube'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
    </Tabs>
  )
}
