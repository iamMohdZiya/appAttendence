import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import api from '../../services/api';

export default function ScanScreen({ route, navigation }) {
  const { sessionId, courseName } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is needed to verify you are in the class.');
        navigation.goBack();
      }
    })();
  }, []);

  // --- 1. LOADING / PERMISSION STATES ---
  if (!permission) {
    return <View className="flex-1 bg-slate-900" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center p-8">
        <View className="bg-slate-800 p-8 rounded-3xl items-center w-full shadow-lg shadow-black/50">
          <Text className="text-4xl mb-4">📷</Text>
          <Text className="text-white text-xl font-bold mb-2 text-center">Camera Access</Text>
          <Text className="text-slate-400 text-center mb-6">
            Presenzo needs camera access to scan the faculty QR code.
          </Text>
          <TouchableOpacity 
            onPress={requestPermission}
            className="bg-indigo-600 w-full py-4 rounded-2xl items-center active:bg-indigo-700"
          >
            <Text className="text-white font-bold text-base">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- 2. SCAN HANDLER ---
  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setLoading(true);

    try {
      // Get Location
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      
      const payload = {
        sessionId,
        scannedCode: data,
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        },
        accuracy: location.coords.accuracy
      };

      const response = await api.post('/attendance/mark', payload);

      Alert.alert(
        response.data.status === 'Present' ? 'Attendance Marked! 🎉' : 'Check-in Warning ⚠️',
        response.data.message,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      Alert.alert(
        'Check-in Failed', 
        error.response?.data?.message || 'Could not verify location or code.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      >
        {/* --- UI OVERLAY --- */}
        <View className="flex-1 bg-black/60 justify-center items-center">
          
          {/* Top Text */}
          <View className="absolute top-16 items-center">
            <Text className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Checking In For</Text>
            <Text className="text-white text-2xl font-black tracking-tight">{courseName}</Text>
          </View>

          {/* Scanner Frame (Center) */}
          <View className="relative justify-center items-center">
            {/* The Frame */}
            <View className="w-72 h-72 border-4 border-indigo-500 rounded-3xl bg-transparent shadow-2xl shadow-indigo-500/20" />
            
            {/* Corner Accents (Optional Visuals) */}
            <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-2xl" />
            <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-2xl" />
            <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-2xl" />
            <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-2xl" />
          </View>

          {/* Bottom Instruction */}
          <View className="absolute bottom-16 px-8 py-3 bg-slate-800/80 rounded-full">
            <Text className="text-indigo-300 font-medium text-sm">
              Align QR code within the frame
            </Text>
          </View>

        </View>
      </CameraView>

      {/* --- LOADING OVERLAY (Full Screen) --- */}
      {loading && (
        <View className="absolute inset-0 bg-slate-900/90 justify-center items-center z-20">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-white text-xl font-bold mt-6">Verifying Location...</Text>
          <Text className="text-slate-400 text-sm mt-2">Please hold still</Text>
        </View>
      )}

      {/* --- RESCAN BUTTON (If scan failed but not loading) --- */}
      {scanned && !loading && (
        <View className="absolute bottom-10 w-full items-center z-10">
          <TouchableOpacity 
            onPress={() => setScanned(false)}
            className="bg-indigo-600 px-8 py-4 rounded-2xl shadow-lg shadow-indigo-500/40"
          >
            <Text className="text-white font-bold text-lg">Tap to Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}