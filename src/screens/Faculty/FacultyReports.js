import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';

export default function FacultyReports() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/session/my-courses');
      setCourses(data);
    } catch (error) {
      console.log('Error fetching courses');
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Error", "Please select valid dates (YYYY-MM-DD)");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/attendance/faculty-report', {
        params: {
          startDate,
          endDate,
          courseId: selectedCourse?._id
        }
      });
      setReportData(data);
      if (data.length === 0) Alert.alert("Info", "No present students found for this period.");
    } catch (error) {
      Alert.alert("Error", "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (reportData.length === 0) return;

    let csvContent = "Date,Course,Student Name,Roll No,Status\n";
    reportData.forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString();
      const course = item.session?.course?.courseCode || 'N/A';
      const row = `${date},${course},${item.student?.name},${item.student?.rollNo},${item.status}`;
      csvContent += row + "\n";
    });

    const fileName = `Attendance_Report_${startDate}_to_${endDate}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;

    try {
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save CSV");
    }
  };

  return (
    <View className="flex-1 bg-slate-50 px-6 pt-4">
      
      {/* Header */}
      <View className="mb-6">
        <Text className="text-3xl font-black text-slate-800 tracking-tight">Reports</Text>
        <Text className="text-slate-500 font-medium">Export detailed attendance logs</Text>
      </View>

      {/* --- FILTER CARD --- */}
      <View className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6">
        
        <Text className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Date Range</Text>
        <View className="flex-row space-x-4 mb-5">
          <View className="flex-1">
            <Text className="text-[10px] text-slate-400 mb-1 ml-1">START DATE</Text>
            <TextInput 
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 font-medium"
              value={startDate} 
              onChangeText={setStartDate} 
              placeholder="YYYY-MM-DD" 
            />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-slate-400 mb-1 ml-1">END DATE</Text>
            <TextInput 
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 font-medium"
              value={endDate} 
              onChangeText={setEndDate} 
              placeholder="YYYY-MM-DD" 
            />
          </View>
        </View>

        <Text className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Select Course</Text>
        <View className="h-12 mb-4">
          <FlatList 
            horizontal 
            data={courses}
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => setSelectedCourse(selectedCourse?._id === item._id ? null : item)}
                className={`mr-3 px-5 justify-center rounded-full border ${selectedCourse?._id === item._id ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
              >
                <Text className={`font-bold ${selectedCourse?._id === item._id ? 'text-white' : 'text-slate-600'}`}>
                  {item.courseCode}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <TouchableOpacity 
          className={`w-full py-4 rounded-2xl items-center ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          onPress={generateReport}
          disabled={loading}
        >
          <Text className="text-white font-bold tracking-wide text-base">
            {loading ? "Generating..." : "Generate Report"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- RESULTS LIST --- */}
      <View className="flex-1">
        <View className="flex-row justify-between items-end mb-3 px-1">
          <Text className="text-slate-800 font-bold text-lg">Results</Text>
          <Text className="text-slate-400 text-xs font-bold uppercase">{reportData.length} Records Found</Text>
        </View>

        <FlatList
          data={reportData}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View className="bg-white p-4 mb-3 rounded-2xl shadow-sm border border-slate-100 flex-row justify-between items-center">
              <View className="flex-row items-center flex-1">
                {/* Avatar Initial */}
                <View className="h-10 w-10 rounded-full bg-indigo-50 items-center justify-center mr-3 border border-indigo-100">
                  <Text className="text-indigo-600 font-bold text-sm">{item.student?.name?.charAt(0)}</Text>
                </View>
                
                <View>
                  <Text className="text-slate-800 font-bold text-base">{item.student?.name}</Text>
                  <Text className="text-slate-400 text-xs font-mono">{item.student?.rollNo}</Text>
                </View>
              </View>

              <View className="items-end">
                <View className="bg-emerald-100 px-2 py-1 rounded-md mb-1">
                  <Text className="text-emerald-700 text-[10px] font-bold uppercase tracking-wide">{item.status}</Text>
                </View>
                <Text className="text-slate-400 text-[10px]">{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* --- DOWNLOAD BUTTON (Floating) --- */}
      {reportData.length > 0 && (
        <View className="absolute bottom-8 left-6 right-6">
          <TouchableOpacity 
            className="w-full bg-emerald-600 py-4 rounded-2xl shadow-lg shadow-emerald-500/30 items-center flex-row justify-center space-x-2"
            onPress={downloadCSV}
          >
            <Text className="text-white text-xl">📥</Text>
            <Text className="text-white font-bold text-lg tracking-wide">Download CSV</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}