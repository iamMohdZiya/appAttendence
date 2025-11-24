import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Leave empty unless changing
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserData(user);
        setName(user.name);
        setEmail(user.email);
      }
    } catch (error) {
      console.log("Error loading profile");
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = { name, email };
      if (password.length > 0) {
        payload.password = password;
      }

      const { data } = await api.put('/auth/profile', payload);

      // Update local storage with new data
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setUserData(data);
      setPassword(''); // Clear password field after update
      
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>My Profile</Text>

      {/* READ ONLY FIELDS */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Academic Details (Read-Only)</Text>
        
        <Text style={styles.label}>Role</Text>
        <TextInput style={[styles.input, styles.readOnly]} value={userData.role?.toUpperCase()} editable={false} />

        <Text style={styles.label}>Department</Text>
        <TextInput style={[styles.input, styles.readOnly]} value={userData.dept || 'N/A'} editable={false} />

        {userData.role === 'student' && (
          <>
            <Text style={styles.label}>Roll Number</Text>
            <TextInput style={[styles.input, styles.readOnly]} value={userData.rollNo} editable={false} />
          </>
        )}

        {userData.role === 'faculty' && (
          <>
            <Text style={styles.label}>Staff ID</Text>
            <TextInput style={[styles.input, styles.readOnly]} value={userData.staffId} editable={false} />
          </>
        )}
      </View>

      {/* EDITABLE FIELDS */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Personal Details</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput 
          style={styles.input} 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none"
        />

        <Text style={styles.label}>New Password (leave blank to keep current)</Text>
        <TextInput 
          style={styles.input} 
          value={password} 
          onChangeText={setPassword} 
          placeholder="Enter new password"
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Saving..." : "Update Profile"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f5f5', paddingBottom: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333', marginTop: 30 },
  
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 10 },
  
  label: { fontSize: 12, color: '#666', marginBottom: 5, marginTop: 5 },
  input: { backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', color: '#333' },
  readOnly: { backgroundColor: '#e0e0e0', color: '#666', borderWidth: 0 },

  saveButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  backButton: { marginTop: 15, alignItems: 'center' },
  backText: { color: '#666' }
});