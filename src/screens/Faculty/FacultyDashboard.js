import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FacultyDashboard({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchCourses();
    getUserDetails();
  }, []);

  const getUserDetails = async () => {
    const user = await AsyncStorage.getItem('user');
    if (user) setUserName(JSON.parse(user).name);
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/session/my-courses');
      setCourses(data);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch your courses');
    }
  };

  const handleStartSession = (course) => {
    // Navigate to Session Screen, passing course details
    navigation.navigate('SessionScreen', { course });
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Hello, {userName}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('FacultyReports')}>
  <Text style={styles.reportBtnText}>View Reports</Text>
</TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')}>
        <Text style={{color: '#007AFF', fontSize: 12, marginTop: 2}}>Edit Profile</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>My Courses</Text>
      
      {courses.length === 0 ? (
        <Text style={styles.emptyText}>No courses assigned yet.</Text>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.courseCode}>{item.courseCode}</Text>
                <Text style={styles.courseName}>{item.name}</Text>
              </View>
              <TouchableOpacity 
                style={styles.startButton} 
                onPress={() => handleStartSession(item)}
              >
                <Text style={styles.btnText}>Start</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  welcome: { fontSize: 18, fontWeight: 'bold' },
  logout: { color: 'red', fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, elevation: 3 },
  courseCode: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  courseName: { fontSize: 14, color: '#666' },
  startButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  reportBtn: { marginTop: 10, backgroundColor: '#6c757d', padding: 10, borderRadius: 5, alignSelf: 'flex-start' },
  reportBtnText: { color: 'white', fontWeight: 'bold' }
});