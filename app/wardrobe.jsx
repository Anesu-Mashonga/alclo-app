import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import WardrobeItem from '../components/WardrobeItem';
import ThemedView from '../components/themed-view';
import { wardrobeSeed } from '../lib/seeds';

const { width, height } = Dimensions.get('window');

export default function Wardrobe() {
  const [wardrobe, setWardrobe] = useState(wardrobeSeed);
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Tops', 'Bottoms', 'Shoes', 'Accessories'];

  const filteredWardrobe = filter === 'All'
    ? wardrobe
    : wardrobe.filter(item => item.category === filter);

  const renderCategoryButton = (category) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        filter === category && styles.activeCategoryButton
      ]}
      onPress={() => setFilter(category)}
    >
      <Text style={[
        styles.categoryButtonText,
        filter === category && styles.activeCategoryButtonText
      ]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <Text style={styles.subtitle}>Discover your perfect style</Text>
      </View>

      {/* Add Item Button */}
      <View style={styles.addItemSection}>
        <TouchableOpacity
          style={styles.addItemCard}
          onPress={() => router.push('/modal')}
        >
          <View style={styles.addItemIcon}>
            <Text style={styles.addItemEmoji}>📸</Text>
          </View>
          <View style={styles.addItemContent}>
            <Text style={styles.addItemTitle}>Add Item</Text>
            <Text style={styles.addItemSubtitle}>Snap or upload photos</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContainer}
      >
        <View style={styles.categoryContainer}>
          {categories.map(renderCategoryButton)}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <ThemedView style={styles.container} useScrollView={false}>
      <FlatList
        data={filteredWardrobe}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WardrobeItem item={item} />}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.contentContainer}
        columnWrapperStyle={styles.wardrobeRow}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => <View style={styles.footerSpacer} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#be185d',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#db2777',
    lineHeight: 22,
  },
  addItemSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  addItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  addItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addItemEmoji: {
    fontSize: 20,
  },
  addItemContent: {
    flex: 1,
  },
  addItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  addItemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryScrollContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryButton: {
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#be185d',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#be185d',
    fontWeight: '500',
  },
  activeCategoryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 40,
    paddingHorizontal: 20,
    paddingBottom: 120, // Extra padding for footer
  },
  wardrobeRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  footerSpacer: {
    height: 20,
  },
});
