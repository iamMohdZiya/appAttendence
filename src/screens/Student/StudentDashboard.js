import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function StudentDashboard({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [studentName, setStudentName] = useState('');

  // Load name on mount
  useEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) setStudentName(JSON.parse(user).name);
    };
    loadUser();
  }, []);

  // Fetch sessions whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [])
  );

  const fetchSessions = async () => {
    setRefreshing(true);
    try {
      // This will now only return sessions where isActive === true
      const { data } = await api.get('/session/active');
      setSessions(data);
    } catch (error) {
      console.log('Error fetching sessions', error);
    }
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome,</Text>
          <Text style={styles.nameText}>{studentName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* History Button */}
      <TouchableOpacity 
        style={styles.historyButton} 
        onPress={() => navigation.navigate('HistoryScreen')}
      >
        <Text style={styles.historyBtnText}>View Attendance History</Text>
      </TouchableOpacity>

      {/* Live Classes Section */}
      <Text style={styles.sectionTitle}>Live Classes</Text>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
           <Text style={styles.emptyText}>No active classes right now.</Text>
           <Text style={styles.subText}>Pull down to refresh</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchSessions} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('ScanScreen', { sessionId: item._id, courseName: item.course.name })}
            >
              <View style={styles.cardContent}>
                <Text style={styles.courseCode}>{item.course.courseCode}</Text>
                <Text style={styles.courseName}>{item.course.name}</Text>
                <Text style={styles.faculty}>by {item.faculty.name}</Text>
              </View>
              <View style={styles.actionBadge}>
                 <Text style={styles.actionText}>Check In</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', paddingTop: 50 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcome: { fontSize: 16, color: '#666' },
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  logoutBtn: { padding: 8 },
  logoutText: { color: 'red', fontWeight: 'bold' },

  historyButton: { backgroundColor: '#4a5568', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 25, elevation: 2 },
  historyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },

  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4 },
  cardContent: { flex: 1 },
  courseCode: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  courseName: { fontSize: 14, color: '#666', marginTop: 2 },
  faculty: { fontSize: 12, color: '#999', marginTop: 4, fontStyle: 'italic' },
  
  actionBadge: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginLeft: 10 },
  actionText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16, fontWeight: '500' },
  subText: { color: '#999', fontSize: 12, marginTop: 5 }
});