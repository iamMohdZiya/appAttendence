import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import api from '../../services/api';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


export default function SessionScreen({ route, navigation }) {
  const { course } = route.params;
  const [sessionId, setSessionId] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]); // Store list of students
  const [refreshInterval, setRefreshInterval] = useState(0); // Counter to force re-renders

  // 1. Start Session on Mount
  useEffect(() => {
    startClassSession();
    return () => clearInterval(timer);
  }, []);

  // 2. Poll for Updates (QR every 30s, Roster every 5s)
  useEffect(() => {
    let rosterTimer;
    if (sessionId) {
      // Fetch roster immediately
      fetchRoster(sessionId);
      // Then fetch every 5 seconds
      rosterTimer = setInterval(() => fetchRoster(sessionId), 5000);
    }
    return () => clearInterval(rosterTimer);
  }, [sessionId]);

  let timer; // QR Timer

 const startClassSession = async () => {
    try {
      // 1. Get Faculty Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location is required to start a class.');
        navigation.goBack();
        return;
      }

      // Get accurate location
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      // 2. Send Lat/Lng to Backend
      const { data } = await api.post('/session/start', {
        courseId: course._id,
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });

      setSessionId(data.sessionId);
      setQrCode(data.qrCode);
      setLoading(false);

      timer = setInterval(() => refreshQR(data.sessionId), 30000);

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to start session.');
      navigation.goBack();
    }
  const downloadSessionCSV = async () => {
    // Filter only Present students from the current 'attendees' state
    const presentStudents = attendees.filter(a => a.status === 'Present');
    
    if (presentStudents.length === 0) {
      Alert.alert("Info", "No present students to download.");
      return;
    }

    let csvContent = "Student Name,Roll No,Status,Time\n";
    presentStudents.forEach(item => {
      const time = new Date(item.createdAt).toLocaleTimeString();
      csvContent += `${item.student?.name},${item.student?.rollNo},${item.status},${time}\n`;
    });

    const fileName = `Session_${course.courseCode}_${new Date().getTime()}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;

    try {
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.log("CSV Error", error);
    }
  };

  const endSession = () => {
    clearInterval(timer);
    
    Alert.alert(
      "Session Ended",
      `Total Present: ${attendees.filter(a => a.status === 'Present').length}`,
      [
        { text: "Download Report", onPress: () => { downloadSessionCSV(); navigation.goBack(); } },
        { text: "Close", onPress: () => navigation.goBack(), style: "cancel" }
      ]
    );
  };

};

  const refreshQR = async (id) => {
    try {
      const { data } = await api.get(`/session/${id}/qr`);
      setQrCode(data.code);
    } catch (error) {
      console.log("QR Refresh Failed");
    }
  };

  const fetchRoster = async (id) => {
    try {
      const { data } = await api.get(`/attendance/session/${id}`);
      setAttendees(data);
    } catch (error) {
      console.log("Roster fetch failed");
    }
  };

 const endSession = async () => {
    // 1. Stop local timer
    clearInterval(timer);

    try {
      // 2. Tell Backend to close the session
      await api.post('/session/end', { sessionId });
      
      Alert.alert(
        "Session Ended",
        `Class marked as finished.\nTotal Present: ${attendees.filter(a => a.status === 'Present').length}`,
        [
          { text: "Download Report", onPress: () => { downloadSessionCSV(); navigation.goBack(); } },
          { text: "Close", onPress: () => navigation.goBack(), style: "cancel" }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Could not end session on server (Check internet).");
      navigation.goBack(); // Navigate back anyway so they aren't stuck
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Starting Class...</Text>
      </View>
    );
  }
  

  return (
    <View style={styles.container}>
      {/* Top Section: QR Code */}
      <View style={styles.topSection}>
        <Text style={styles.courseTitle}>{course.courseCode}</Text>
        <View style={styles.qrWrapper}>
          {qrCode && <QRCode value={qrCode} size={180} />}
        </View>
        <Text style={styles.codeText}>Code: {qrCode}</Text>
      </View>

      {/* Bottom Section: Live Roster */}
      <View style={styles.bottomSection}>
        <Text style={styles.rosterTitle}>Live Attendees ({attendees.length})</Text>
        
        {attendees.length === 0 ? (
          <Text style={styles.emptyText}>Waiting for scans...</Text>
        ) : (
          <FlatList
            data={attendees}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.studentRow}>
                <View>
                  <Text style={styles.studentName}>{item.student?.name || 'Unknown'}</Text>
                  <Text style={styles.studentRoll}>{item.student?.rollNo || 'No Roll No'}</Text>
                </View>
                <View style={[
                  styles.badge, 
                  { backgroundColor: item.status === 'Present' ? '#4CAF50' : '#FFC107' }
                ]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity style={styles.endButton} onPress={endSession}>
        <Text style={styles.btnText}>End Session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  topSection: { 
    flex: 1.2, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    paddingBottom: 20,
    elevation: 5
  },
  courseTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  qrWrapper: { padding: 10, borderWidth: 4, borderColor: '#007AFF', borderRadius: 15 },
  codeText: { fontSize: 18, marginTop: 10, fontWeight: 'bold', letterSpacing: 2, color: '#555' },

  bottomSection: { flex: 1, padding: 20 },
  rosterTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#444' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20, fontStyle: 'italic' },
  
  studentRow: { 
    backgroundColor: 'white', 
    padding: 12, 
    borderRadius: 8, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  studentName: { fontSize: 16, fontWeight: '600', color: '#333' },
  studentRoll: { fontSize: 12, color: '#888' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  endButton: { 
    backgroundColor: '#D32F2F', 
    padding: 15, 
    margin: 20, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});