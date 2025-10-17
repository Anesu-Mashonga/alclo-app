import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'

const WardrobeItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.card}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={item.imageUrl} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
          <View style={styles.overlay}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.type}</Text>
            </View>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <View style={styles.colorIndicator}>
            <View style={[styles.colorDot, { backgroundColor: getColorFromName(item.color) }]} />
            <Text style={styles.colorText}>{item.color}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const getColorFromName = (colorName) => {
  const colorMap = {
    white: '#ffffff',
    black: '#000000',
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#10b981',
    grey: '#6b7280',
    yellow: '#f59e0b',
    brown: '#92400e',
    khaki: '#d97706',
  }
  return colorMap[colorName] || '#6b7280'
}

export default WardrobeItem

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 4,
  },
  card: {
    width: 140,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    margin: 12,
  },
  image: {
    width: 116,
    height: 116,
    borderRadius: 16,
  },
  imagePlaceholder: {
    width: 116,
    height: 116,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  info: {
    padding: 16,
    paddingTop: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 18,
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
})
