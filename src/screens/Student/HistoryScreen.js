import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../services/api';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/attendance/history');
      setHistory(data);
    } catch (error) {
      console.log('Error fetching history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return '#4CAF50'; // Green
      case 'Pending': return '#FFC107'; // Amber
      case 'Rejected': return '#F44336'; // Red
      default: return '#999';
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 50}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>
      
      {history.length === 0 ? (
        <Text style={styles.emptyText}>No records found.</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                {/* Check if session is populated, handle potential missing data safely */}
                <Text style={styles.courseName}>
                  {item.session?.course?.name || 'Unknown Course'}
                </Text>
                <Text style={styles.date}>
                  {new Date(item.createdAt).toDateString()} • {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
  courseName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 12, color: '#888', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});