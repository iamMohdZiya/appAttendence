import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      // Store Token & Role
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));

      // Navigate based on Role
      if (data.role === 'faculty') {
        navigation.replace('FacultyDashboard');
      } else if (data.role === 'student') {
        navigation.replace('StudentDashboard');
      } else {
        Alert.alert("Access Denied", "Admins must use the Web Portal.");
      }

    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-50 justify-center px-8"
    >
      <StatusBar barStyle="dark-content" />

      {/* --- HEADER / BRANDING --- */}
      <View className="items-center mb-12">
        <View className="flex-row items-end">
          <Text className="text-5xl font-black text-slate-800 tracking-tighter">Presenzo</Text>
          <Text className="text-5xl font-black text-indigo-600 tracking-tighter">.</Text>
        </View>
        <Text className="text-slate-400 text-xs font-bold tracking-[0.2em] mt-2 uppercase">
          Mobile Attendance Portal
        </Text>
      </View>

      {/* --- INPUT FORM CARD --- */}
      <View className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        <Text className="text-xl font-bold text-slate-800 mb-6 text-center">Sign In</Text>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-slate-400 uppercase mb-2 ml-2">Email Address</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl px-5 py-4 text-base focus:border-indigo-500 focus:bg-white"
            placeholder="student@college.edu"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        
        {/* Password Input */}
        <View className="mb-8">
          <Text className="text-xs font-bold text-slate-400 uppercase mb-2 ml-2">Password</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl px-5 py-4 text-base focus:border-indigo-500 focus:bg-white"
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity 
          className={`w-full py-4 rounded-2xl shadow-lg shadow-indigo-500/30 items-center ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg tracking-wide">
            {loading ? "Authenticating..." : "Login"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- FOOTER --- */}
      <View className="mt-10 items-center">
        <Text className="text-slate-400 text-xs">Don't have an account?</Text>
        <Text className="text-indigo-600 font-bold text-sm mt-1">Contact your Administrator</Text>
      </View>

    </KeyboardAvoidingView>
  );
}