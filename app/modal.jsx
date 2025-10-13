import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function Modal() {
  const router = useRouter();
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('');
  const [itemColor, setItemColor] = useState('');

  const handleAddItem = () => {
    if (!itemName.trim() || !itemType.trim() || !itemColor.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Here you would typically save the item to your wardrobe state/storage
    Alert.alert(
      'Success',
      `${itemName} added to your wardrobe!`,
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <LinearGradient colors={['#fce7f3', '#fdf2f8', '#ffffff']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Item</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g., Blue Jeans, White T-Shirt"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={itemType}
              onChangeText={setItemType}
              placeholder="e.g., top, bottom, shoes, outer"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              value={itemColor}
              onChangeText={setItemColor}
              placeholder="e.g., blue, white, black"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Text style={styles.addButtonText}>Add to Wardrobe</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Add</Text>
          <View style={styles.quickButtons}>
            {['T-Shirt', 'Jeans', 'Sneakers', 'Jacket'].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.quickButton}
                onPress={() => setItemName(item)}
              >
                <Text style={styles.quickButtonText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 60,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#be185d',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#be185d',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  quickActions: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});
