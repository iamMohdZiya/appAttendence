import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity, FlatList, StatusBar, SafeAreaView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';

export default function SessionScreen({ route, navigation }) {
  const { course } = route.params;
  const [sessionId, setSessionId] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]); 
  
  let timer; // QR Timer Reference

  // 1. Start Session on Mount
  useEffect(() => {
    startClassSession();
    return () => clearInterval(timer);
  }, []);

  // 2. Poll for Updates (Roster every 5s)
  useEffect(() => {
    let rosterTimer;
    if (sessionId) {
      fetchRoster(sessionId); // Immediate fetch
      rosterTimer = setInterval(() => fetchRoster(sessionId), 5000);
    }
    return () => clearInterval(rosterTimer);
  }, [sessionId]);

  const startClassSession = async () => {
    try {
      // 1. Get Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location is required to start a class.');
        navigation.goBack();
        return;
      }

      // 2. Get Location
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      // 3. Send to Backend
      const { data } = await api.post('/session/start', {
        courseId: course._id,
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });

      setSessionId(data.sessionId);
      setQrCode(data.qrCode);
      setLoading(false);

      // 4. Start Rotating QR
      timer = setInterval(() => refreshQR(data.sessionId), 30000);

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to start session.');
      navigation.goBack();
    }
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

  const downloadSessionCSV = async () => {
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

  const handleEndSession = () => {
    clearInterval(timer);
    Alert.alert(
      "End Session?",
      `Total Present: ${attendees.filter(a => a.status === 'Present').length}`,
      [
        { text: "Cancel", onPress: () => { 
            // Restart timer if cancelled
            timer = setInterval(() => refreshQR(sessionId), 30000); 
          }, style: "cancel" 
        },
        { text: "End & Download", onPress: () => confirmEndSession() }
      ]
    );
  };

  const confirmEndSession = async () => {
    try {
      await api.post('/session/end', { sessionId });
      downloadSessionCSV(); 
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Could not close session on server.");
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-slate-500 mt-4 font-medium">Initializing Location & Session...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />

      {/* --- TOP SECTION: QR CARD --- */}
      <View className="items-center pt-8 pb-8">
        <Text className="text-2xl font-black text-slate-800 mb-6">{course.courseCode}</Text>
        
        {/* QR Wrapper with Shadow */}
        <View className="bg-white p-6 rounded-3xl shadow-2xl shadow-indigo-200/50 border-4 border-white">
          {qrCode && <QRCode value={qrCode} size={220} />}
        </View>

        <View className="mt-8 flex-row items-center bg-indigo-50 px-6 py-3 rounded-full">
          <Text className="text-indigo-400 text-xs font-bold mr-2 uppercase tracking-widest">Current Code</Text>
          <Text className="text-xl font-mono font-bold text-indigo-700 tracking-[0.2em]">
            {qrCode}
          </Text>
        </View>
      </View>

      {/* --- BOTTOM SECTION: LIVE ROSTER (Bottom Sheet Style) --- */}
      <View className="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] px-6 pt-8 overflow-hidden">
        
        <View className="flex-row justify-between items-end mb-6 border-b border-slate-50 pb-4">
          <View>
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">Realtime Updates</Text>
            <Text className="text-2xl font-bold text-slate-800">Live Roster</Text>
          </View>
          <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <Text className="text-emerald-600 font-bold text-xs">
              {attendees.length} Scanned
            </Text>
          </View>
        </View>

        {attendees.length === 0 ? (
          <View className="flex-1 justify-center items-center opacity-40 mb-10">
            <Text className="text-4xl mb-2">📡</Text>
            <Text className="text-slate-500 font-medium">Waiting for students...</Text>
          </View>
        ) : (
          <FlatList
            data={attendees}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View className="flex-row justify-between items-center py-3 border-b border-slate-50">
                <View className="flex-row items-center">
                  <View className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center mr-3">
                    <Text className="text-slate-500 font-bold">{item.student?.name?.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text className="text-slate-800 font-bold text-sm">{item.student?.name || 'Unknown'}</Text>
                    <Text className="text-slate-400 text-xs font-mono">{item.student?.rollNo || 'No ID'}</Text>
                  </View>
                </View>
                
                <View className={`px-3 py-1 rounded-full ${item.status === 'Present' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                  <Text className={`text-xs font-bold ${item.status === 'Present' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {item.status}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        {/* End Session Floating Button */}
        <View className="absolute bottom-8 left-6 right-6">
          <TouchableOpacity 
            onPress={handleEndSession}
            className="bg-rose-500 w-full py-4 rounded-2xl shadow-lg shadow-rose-500/30 items-center flex-row justify-center space-x-2 active:bg-rose-600"
          >
            <Text className="text-white font-bold text-lg">End Session</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}