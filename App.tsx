import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import all screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import FacultyDashboard from './src/screens/Faculty/FacultyDashboard';
import SessionScreen from './src/screens/Faculty/SessionScreen';
import StudentDashboard from './src/screens/Student/StudentDashboard';
import ScanScreen from './src/screens/Student/ScanScreen';
import HistoryScreen from './src/screens/Student/HistoryScreen';
import FacultyReports from './src/screens/Faculty/FacultyReports';
import ProfileScreen from './src/screens/common/ProfileScreen'
import "./global.css" 
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="FacultyDashboard" component={FacultyDashboard} />
        <Stack.Screen name="SessionScreen" component={SessionScreen} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        <Stack.Screen name="ScanScreen" component={ScanScreen} />
        <Stack.Screen name="HistoryScreen" component={HistoryScreen} />
        <Stack.Screen name="FacultyReports" component={FacultyReports} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}