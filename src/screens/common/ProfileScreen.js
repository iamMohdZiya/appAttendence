import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Leave empty unless changing
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserData(user);
        setName(user.name);
        setEmail(user.email);
      }
    } catch (error) {
      console.log("Error loading profile");
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = { name, email };
      if (password.length > 0) {
        payload.password = password;
      }

      const { data } = await api.put('/auth/profile', payload);

      // Update local storage with new data
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setUserData(data);
      setPassword(''); // Clear password field after update
      
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      className="flex-1 bg-slate-50"
    >
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        
        {/* Header */}
        <View className="mb-8 mt-4">
          <Text className="text-3xl font-black text-slate-800 tracking-tight">My Profile</Text>
          <Text className="text-slate-500 font-medium">Manage your personal information</Text>
        </View>

        {/* --- READ ONLY SECTION --- */}
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
          <View className="flex-row items-center mb-5 border-b border-slate-50 pb-3">
             <View className="h-2 w-2 rounded-full bg-slate-300 mr-2"></View>
             <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest">Academic Details</Text>
          </View>
          
          <View className="space-y-4">
            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Role</Text>
              <View className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3">
                <Text className="text-slate-500 font-bold">{userData.role?.toUpperCase()}</Text>
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Department</Text>
              <View className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3">
                <Text className="text-slate-500 font-medium">{userData.dept || 'N/A'}</Text>
              </View>
            </View>

            {userData.role === 'student' && (
              <View>
                <Text className="text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Roll Number</Text>
                <View className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3">
                  <Text className="text-slate-500 font-mono">{userData.rollNo}</Text>
                </View>
              </View>
            )}

            {userData.role === 'faculty' && (
              <View>
                <Text className="text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Staff ID</Text>
                <View className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3">
                  <Text className="text-slate-500 font-mono">{userData.staffId}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* --- EDITABLE SECTION --- */}
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
          <View className="flex-row items-center mb-5 border-b border-slate-50 pb-3">
             <View className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></View>
             <Text className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Edit Details</Text>
          </View>

          <View className="space-y-5">
            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Full Name</Text>
              <TextInput 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 text-base focus:border-indigo-500 focus:bg-white"
                value={name} 
                onChangeText={setName} 
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Email Address</Text>
              <TextInput 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 text-base focus:border-indigo-500 focus:bg-white"
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase mb-1 ml-1">New Password</Text>
              <TextInput 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3 text-base focus:border-indigo-500 focus:bg-white"
                value={password} 
                onChangeText={setPassword} 
                placeholder="Leave blank to keep current"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* --- ACTIONS --- */}
        <TouchableOpacity 
          className={`w-full py-4 rounded-2xl shadow-lg shadow-indigo-500/30 items-center mb-4 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg tracking-wide">
            {loading ? "Updating..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full py-3 items-center"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-slate-400 font-bold">Cancel</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}