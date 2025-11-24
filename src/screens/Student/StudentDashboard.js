import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StatusBar, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function StudentDashboard({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) setStudentName(JSON.parse(user).name);
    };
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [])
  );

  const fetchSessions = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get('/session/active');
      setSessions(data);
    } catch (error) {
      console.log('Error fetching sessions');
    }
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* --- HERO SECTION --- */}
      <View className="bg-indigo-600 pt-12 pb-8 px-6 rounded-b-[40px] shadow-xl shadow-indigo-500/30">
        
        {/* Header Row */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
             <Text className="text-indigo-200 text-xs font-bold tracking-widest uppercase">Student Portal</Text>
             <Text className="text-white text-2xl font-black tracking-tight">Presenzo.</Text>
          </View>
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-indigo-500/50 px-4 py-2 rounded-xl border border-indigo-400/30"
          >
            <Text className="text-white text-xs font-bold">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome & Actions */}
        <View>
          <Text className="text-indigo-100 text-lg">Hello,</Text>
          <Text className="text-white text-3xl font-bold mb-6 truncate">{studentName}</Text>
          
          <View className="flex-row space-x-3">
            {/* History Button */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('HistoryScreen')}
              className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/20 flex-row justify-center items-center space-x-2 active:bg-white/20"
            >
              <Text className="text-white font-bold text-sm">📜 History</Text>
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

      {/* --- LIVE CLASSES SECTION --- */}
      <View className="flex-1 px-6 -mt-4">
        
        <View className="flex-row justify-between items-end mb-4 px-2">
          <Text className="text-slate-800 text-lg font-bold">Live Classes</Text>
          <View className="bg-emerald-100 px-3 py-1 rounded-full">
             <Text className="text-emerald-700 text-xs font-bold uppercase">
               {sessions.length > 0 ? '🔴 Active Now' : '⚪ No Classes'}
             </Text>
          </View>
        </View>

        {sessions.length === 0 ? (
          <View className="flex-1 justify-center items-center bg-white rounded-3xl border border-dashed border-slate-200 m-2 h-64 opacity-50">
             <Text className="text-5xl mb-4">💤</Text>
             <Text className="text-slate-500 font-bold text-lg">No active classes.</Text>
             <Text className="text-slate-400 text-sm mt-1">Pull down to refresh</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchSessions} tintColor="#4f46e5"/>}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                className="bg-white p-5 mb-4 rounded-3xl shadow-sm border border-slate-100 flex-row justify-between items-center active:bg-slate-50"
                onPress={() => navigation.navigate('ScanScreen', { sessionId: item._id, courseName: item.course.name })}
              >
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center space-x-2 mb-1">
                    <View className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></View>
                    <Text className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                      {item.course.courseCode}
                    </Text>
                  </View>
                  <Text className="text-slate-800 text-lg font-bold leading-tight mb-1">
                    {item.course.name}
                  </Text>
                  <Text className="text-slate-400 text-xs font-medium">
                    by Prof. {item.faculty.name}
                  </Text>
                </View>

                <View className="bg-indigo-600 px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/30">
                   <Text className="text-white font-bold text-xs">Check In</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* --- FOOTER --- */}
      <View className="items-center py-4 opacity-50">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          POWERED BY
        </Text>
        <Text className="text-xs font-black text-slate-500 tracking-tighter mt-0.5">
          ALPHA DEVS
        </Text>
      </View>

    </View>
  );
}