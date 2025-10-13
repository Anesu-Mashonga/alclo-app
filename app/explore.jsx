import React, { useState, useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform, StatusBar } from 'react-native';
import ThemedView from '../components/themed-view';
import { wardrobeSeed } from '../lib/seeds';
import { sampleOutfitForDay } from '../lib/outfit-engine';

const { width, height } = Dimensions.get('window');

export default function Explore() {
  const [wardrobe] = useState(wardrobeSeed);
  const [selectedOccasion, setSelectedOccasion] = useState('Work');

  const occasions = ['Work', 'Casual', 'Party', 'Date', 'Sport'];

  // Generate outfit suggestions for different occasions
  const outfitSuggestions = useMemo(() => {
    return occasions.map(occasion => ({
      occasion,
      outfit: sampleOutfitForDay(wardrobe, { tempC: 22, condition: 'Clear' }, occasion)
    }));
  }, [wardrobe]);

  const renderOccasionButton = (occasion) => (
    <TouchableOpacity
      key={occasion}
      style={[
        styles.occasionButton,
        selectedOccasion === occasion && styles.activeOccasionButton
      ]}
      onPress={() => setSelectedOccasion(occasion)}
    >
      <Text style={[
        styles.occasionButtonText,
        selectedOccasion === occasion && styles.activeOccasionButtonText
      ]}>
        {occasion}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Style Explorer</Text>
        <Text style={styles.subtitle}>Discover outfits for every occasion</Text>
      </View>

      {/* Occasion Filter */}
      <View style={styles.occasionContainer}>
        {occasions.map(renderOccasionButton)}
      </View>
    </View>
  );

  const renderOutfitSuggestion = ({ item }) => (
    <View style={styles.outfitCard}>
      <View style={styles.outfitHeader}>
        <Text style={styles.outfitOccasion}>{item.occasion}</Text>
        <Text style={styles.outfitEmoji}>✨</Text>
      </View>

      {item.outfit && (
        <View style={styles.outfitItems}>
          {item.outfit.items.map((outfitItem, index) => (
            <View key={index} style={styles.outfitItem}>
              <Text style={styles.outfitItemEmoji}>
                {outfitItem.category === 'Tops' ? '👕' :
                 outfitItem.category === 'Bottoms' ? '👖' :
                 outfitItem.category === 'Shoes' ? '👟' : '👜'}
              </Text>
              <View style={styles.outfitItemInfo}>
                <Text style={styles.outfitItemName}>{outfitItem.name}</Text>
                <Text style={styles.outfitItemCategory}>{outfitItem.category}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {!item.outfit && (
        <Text style={styles.noOutfitText}>No items available for this occasion</Text>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container} useScrollView={false}>
      <FlatList
        data={outfitSuggestions}
        keyExtractor={(item) => item.occasion}
        renderItem={renderOutfitSuggestion}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.contentContainer}
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
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 40,
    paddingHorizontal: 20,
    paddingBottom: 120, // Extra padding for footer
  },
  header: {
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
  occasionContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  occasionButton: {
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
  },
  activeOccasionButton: {
    backgroundColor: '#be185d',
  },
  occasionButtonText: {
    fontSize: 16,
    color: '#be185d',
    fontWeight: '600',
  },
  activeOccasionButtonText: {
    color: '#ffffff',
  },
  outfitCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  outfitOccasion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#be185d',
  },
  outfitEmoji: {
    fontSize: 24,
  },
  outfitItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  outfitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(190, 24, 93, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
    minWidth: width * 0.25, // Responsive width based on screen size
  },
  outfitItemEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  outfitItemInfo: {
    flex: 1,
  },
  outfitItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  outfitItemCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  noOutfitText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  footerSpacer: {
    height: 20,
  },
});
