import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';

export default function FacultyReports() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null); // Optional
  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState('');   // YYYY-MM-DD
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set default dates (Today)
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
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save CSV");
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Faculty Reports</Text>
      
      {/* Date Inputs (Simple Text for now, can use DatePicker library if preferred) */}
      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Start (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2025-11-23" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>End (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2025-11-23" />
        </View>
      </View>

      {/* Course Filter Buttons */}
      <Text style={styles.label}>Filter by Course (Optional):</Text>
      <View style={{ height: 50, marginBottom: 10 }}>
        <FlatList 
          horizontal 
          data={courses}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.courseChip, selectedCourse?._id === item._id && styles.selectedChip]}
              onPress={() => setSelectedCourse(selectedCourse?._id === item._id ? null : item)}
            >
              <Text style={[styles.chipText, selectedCourse?._id === item._id && styles.selectedChipText]}>
                {item.courseCode}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity style={styles.genButton} onPress={generateReport} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Loading..." : "Show Present Students"}</Text>
      </TouchableOpacity>

      {/* Results List */}
      <FlatList
        data={reportData}
        keyExtractor={item => item._id}
        style={{ marginTop: 10 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.studentName}>{item.student?.name}</Text>
              <Text style={styles.rollNo}>{item.student?.rollNo}</Text>
            </View>
            <View>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.course}>{item.session?.course?.courseCode}</Text>
            </View>
          </View>
        )}
      />

      {/* Download Button */}
      {reportData.length > 0 && (
        <TouchableOpacity style={styles.downButton} onPress={downloadCSV}>
          <Text style={styles.btnText}>Download CSV</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  inputGroup: { width: '48%' },
  label: { fontSize: 12, color: '#666', marginBottom: 5 },
  input: { backgroundColor: 'white', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  
  courseChip: { backgroundColor: '#e0e0e0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, justifyContent:'center' },
  selectedChip: { backgroundColor: '#007AFF' },
  chipText: { color: '#333' },
  selectedChipText: { color: 'white', fontWeight: 'bold' },

  genButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  downButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, elevation: 1 },
  studentName: { fontSize: 16, fontWeight: '600' },
  rollNo: { color: '#666', fontSize: 12 },
  date: { fontSize: 12, color: '#333', textAlign: 'right' },
  course: { fontSize: 12, fontWeight: 'bold', color: '#007AFF', textAlign: 'right' }
});