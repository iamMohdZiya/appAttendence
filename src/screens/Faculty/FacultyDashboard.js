import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StatusBar, Image, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // Auto-refresh when screen loads
import api from '../../services/api';

export default function FacultyDashboard({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  // Load User Info
  useEffect(() => {
    getUserDetails();
  }, []);

  // Fetch courses whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [])
  );

  const getUserDetails = async () => {
    const user = await AsyncStorage.getItem('user');
    if (user) setUserName(JSON.parse(user).name);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/session/my-courses');
      setCourses(data);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch your courses');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = (course) => {
    navigation.navigate('SessionScreen', { course });
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* --- HERO SECTION (Welcome & Actions) --- */}
      <View className="bg-indigo-600 pt-12 pb-8 px-6 rounded-b-[40px] shadow-xl shadow-indigo-500/30">
        
        {/* Top Header Row */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
             <Text className="text-white/80 text-xs font-bold tracking-widest uppercase">Faculty Portal</Text>
             <Text className="text-white text-2xl font-black tracking-tight">Presenzo.</Text>
          </View>
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-indigo-500/50 px-4 py-2 rounded-xl border border-indigo-400/30"
          >
            <Text className="text-white text-xs font-bold">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Greeting & Quick Actions */}
        <View>
          <Text className="text-indigo-100 text-lg">Welcome back,</Text>
          <Text className="text-white text-3xl font-bold mb-6">{userName}</Text>
          
          <View className="flex-row space-x-3">
            {/* Report Button */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('FacultyReports')}
              className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/20 flex-row justify-center items-center space-x-2 active:bg-white/20"
            >
              <Text className="text-white font-bold text-sm">📄 Reports</Text>
            </TouchableOpacity>

            {/* Profile Button */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('ProfileScreen')}
              className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/20 flex-row justify-center items-center space-x-2 active:bg-white/20"
            >
              <Text className="text-white font-bold text-sm">👤 Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* --- CONTENT SECTION --- */}
      <View className="flex-1 px-6 -mt-4">
        
        <View className="flex-row justify-between items-end mb-4 px-2">
          <Text className="text-slate-800 text-lg font-bold">Your Courses</Text>
          <Text className="text-slate-400 text-xs font-bold uppercase">{courses.length} Assigned</Text>
        </View>

        {courses.length === 0 ? (
          <View className="flex-1 justify-center items-center opacity-50">
             <Text className="text-4xl mb-2">📚</Text>
             <Text className="text-slate-500 font-medium">No courses assigned yet.</Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchCourses} tintColor="#4f46e5"/>}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <View className="bg-white p-5 mb-4 rounded-3xl shadow-sm border border-slate-100 flex-row justify-between items-center">
                
                {/* Course Info */}
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center space-x-2 mb-1">
                    <View className="h-2 w-2 rounded-full bg-indigo-500"></View>
                    <Text className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
                      {item.courseCode}
                    </Text>
                  </View>
                  <Text className="text-slate-800 text-lg font-bold leading-tight">
                    {item.name}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-1">
                    {item.department || 'General'} Dept
                  </Text>
                </View>

                {/* Start Button */}
                <TouchableOpacity 
                  onPress={() => handleStartSession(item)}
                  className="bg-indigo-50 h-12 w-12 rounded-full justify-center items-center border border-indigo-100 active:bg-indigo-600 group"
                >
                  {/* Simple Play Icon using Text (or use standard icon lib) */}
                  <Text className="text-indigo-600 text-xl ml-1">▶</Text>
                </TouchableOpacity>

              </View>
            )}
          />
        )}
      </View>

      {/* --- FOOTER (Alpha Devs Branding) --- */}
      <View className="items-center py-4 opacity-50">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Designed & Developed by
        </Text>
        <Text className="text-xs font-black text-slate-500 tracking-tighter">
          ALPHA DEVS
        </Text>
      </View>

    </View>
  );
}