import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Updated for Expo SDK 50+
import * as Location from 'expo-location';
import api from '../../services/api';

export default function ScanScreen({ route, navigation }) {
  const { sessionId, courseName } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      // Ask for Location Permissions on mount
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location is required to mark attendance.');
        navigation.goBack();
      }
    })();
  }, []);

  if (!permission) {
    return <View />; // Loading permissions
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your camera permission</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setLoading(true);

    try {
      // 1. Get Current Location
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      
      // 2. Prepare Payload
      const payload = {
        sessionId,
        scannedCode: data, // The QR code string
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        },
        accuracy: location.coords.accuracy
      };

      // 3. Send to Backend
      const response = await api.post('/attendance/mark', payload);

      // 4. Handle Success
      Alert.alert(
        response.data.status === 'Present' ? 'Success!' : 'Warning',
        response.data.message,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.log(error.response?.data);
      Alert.alert('Attendance Failed', error.response?.data?.message || 'Something went wrong.');
      setScanned(false); // Allow scanning again if failed
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanning for {courseName}</Text>
      <Text style={styles.subtitle}>Align QR code within frame</Text>

      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: 'white', marginTop: 10 }}>Verifying Location...</Text>
          </View>
        )}
      </View>
      
      {scanned && !loading && (
        <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 40 },
  subtitle: { color: '#ccc', marginBottom: 20 },
  cameraContainer: { width: 300, height: 300, overflow: 'hidden', borderRadius: 20, marginBottom: 20 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }
});