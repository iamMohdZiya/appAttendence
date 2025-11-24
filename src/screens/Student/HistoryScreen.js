import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../../services/api';

export default function HistoryScreen() {
  const [fullHistory, setFullHistory] = useState([]); 
  const [filteredHistory, setFilteredHistory] = useState([]); 
  const [uniqueCourses, setUniqueCourses] = useState([]); 
  const [selectedCourseId, setSelectedCourseId] = useState('ALL'); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/attendance/history');
      setFullHistory(data);
      setFilteredHistory(data);

      // Extract Unique Courses safely
      const coursesMap = new Map();
      data.forEach(item => {
        // Check if course exists to prevent crashes
        if (item.session?.course && item.session?.course?._id) {
          coursesMap.set(item.session.course._id.toString(), item.session.course);
        }
      });
      
      // Convert Map values to array
      setUniqueCourses(Array.from(coursesMap.values()));

    } catch (error) {
      console.log('Error fetching history', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (courseId) => {
    setSelectedCourseId(courseId);
    if (courseId === 'ALL') {
      setFilteredHistory(fullHistory);
    } else {
      const filtered = fullHistory.filter(item => item.session?.course?._id === courseId);
      setFilteredHistory(filtered);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Present': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 pt-4">
      
      <View className="px-6 mb-4">
        <Text className="text-3xl font-black text-slate-800 tracking-tight">History</Text>
        <Text className="text-slate-500 font-medium">Track your attendance records</Text>
      </View>

      {/* --- HORIZONTAL FILTER LIST --- */}
      <View className="h-12 mb-4 pl-6">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ _id: 'ALL', courseCode: 'All' }, ...uniqueCourses]}
          
          // FIX: Robust Key Extractor for Horizontal List
          keyExtractor={(item, index) => item._id ? item._id.toString() : `course-${index}`}
          
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleFilter(item._id)}
              className={`mr-3 px-5 justify-center rounded-full border ${
                selectedCourseId === item._id 
                  ? 'bg-indigo-600 border-indigo-600' 
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`font-bold text-xs uppercase tracking-wide ${
                selectedCourseId === item._id ? 'text-white' : 'text-slate-600'
              }`}>
                {item.courseCode}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Stats Summary */}
      <View className="mx-6 mb-6 flex-row justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <View>
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Classes</Text>
          <Text className="text-xl font-black text-slate-800">{filteredHistory.length}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present</Text>
          <Text className="text-xl font-black text-emerald-600">
            {filteredHistory.filter(i => i.status === 'Present').length}
          </Text>
        </View>
      </View>

      {/* --- VERTICAL ATTENDANCE LIST --- */}
      {filteredHistory.length === 0 ? (
        <View className="flex-1 justify-center items-center opacity-50">
          <Text className="text-4xl mb-2">📭</Text>
          <Text className="text-slate-500 font-medium">No records found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          
          // FIX: Robust Key Extractor for Vertical List
          keyExtractor={(item, index) => item._id ? item._id.toString() : `history-${index}`}
          
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="bg-white p-4 mb-3 rounded-2xl shadow-sm border border-slate-100 flex-row justify-between items-center">
              
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <View className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></View>
                  <Text className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
                    {item.session?.course?.courseCode || 'N/A'}
                  </Text>
                </View>
                <Text className="text-slate-800 font-bold text-base mb-1" numberOfLines={1}>
                  {item.session?.course?.name || 'Unknown Course'}
                </Text>
                <Text className="text-slate-400 text-xs font-medium">
                  {new Date(item.createdAt).toDateString()} • {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>

              <View className={`px-3 py-1.5 rounded-lg border ${getStatusStyle(item.status)}`}>
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(item.status).split(' ')[1]}`}>
                  {item.status}
                </Text>
              </View>

            </View>
          )}
        />
      )}
    </View>
  );
}