import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import ThemedView from '../components/themed-view';
import { wardrobeSeed } from '../lib/seeds';

const { width, height } = Dimensions.get('window');
const LAUNDRY_THRESHOLD_HOURS = 16;

const Laundry = () => {
  const router = useRouter();
  const [wardrobe, setWardrobe] = useState(wardrobeSeed);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');
  const [showStatusCard, setShowStatusCard] = useState(true);
  const [animation] = useState(new Animated.Value(0));
  const [statusCardAnimation] = useState(new Animated.Value(1));

  // Calculate laundry items
  const laundryItems = useMemo(() => {
    const now = new Date();
    return wardrobe.filter(item => {
      if (!item.lastWorn) return false;
      const lastWorn = new Date(item.lastWorn);
      const hoursSinceWorn = (now - lastWorn) / (1000 * 60 * 60);
      return hoursSinceWorn >= LAUNDRY_THRESHOLD_HOURS;
    });
  }, [wardrobe]);

  // Filter and sort laundry items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...laundryItems];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.color.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterBy !== 'all') {
      if (filterBy === 'urgent') {
        const now = new Date();
        filtered = filtered.filter(item => {
          const lastWorn = new Date(item.lastWorn);
          const hoursSinceWorn = (now - lastWorn) / (1000 * 60 * 60);
          return hoursSinceWorn >= 48;
        });
      } else {
        filtered = filtered.filter(item => item.type === filterBy);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.lastWorn) - new Date(a.lastWorn);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [laundryItems, searchQuery, sortBy, filterBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalItems = wardrobe.length;
    const dirtyItems = laundryItems.length;
    const urgentItems = laundryItems.filter(item => {
      const now = new Date();
      const lastWorn = new Date(item.lastWorn);
      const hoursSinceWorn = (now - lastWorn) / (1000 * 60 * 60);
      return hoursSinceWorn >= 48;
    }).length;
    const cleanItems = totalItems - dirtyItems;
    const dirtyPercentage = totalItems > 0 ? (dirtyItems / totalItems) * 100 : 0;

    return {
      totalItems,
      dirtyItems,
      cleanItems,
      urgentItems,
      dirtyPercentage,
    };
  }, [wardrobe, laundryItems]);

  // Get progress color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage < 30) return '#10B981';
    if (percentage < 70) return '#F59E0B';
    return '#EF4444';
  };

  // Animate progress on mount
  useEffect(() => {
    Animated.timing(animation, {
      toValue: stats.dirtyPercentage / 100,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [stats.dirtyPercentage]);

  const handleCleanItem = (itemId) => {
    Alert.alert(
      "Mark as Clean",
      "Mark this item as cleaned and ready to wear?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Clean",
          onPress: () => {
            setWardrobe(prev => prev.map(item =>
              item.id === itemId
                ? { ...item, lastWorn: new Date().toISOString().split('T')[0] }
                : item
            ));
          }
        }
      ]
    );
  };

  const handleBulkClean = () => {
    if (filteredAndSortedItems.length === 0) return;

    Alert.alert(
      "Bulk Clean",
      `Mark all ${filteredAndSortedItems.length} items as clean?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark All Clean",
          onPress: () => {
            setWardrobe(prev => prev.map(item => {
              const isInCurrentFilter = filteredAndSortedItems.some(filtered => filtered.id === item.id);
              return isInCurrentFilter
                ? { ...item, lastWorn: new Date().toISOString().split('T')[0] }
                : item;
            }));
          }
        }
      ]
    );
  };

  const renderLaundryItem = ({ item, index }) => {
    const now = new Date();
    const lastWorn = new Date(item.lastWorn);
    const hoursSinceWorn = (now - lastWorn) / (1000 * 60 * 60);
    const isUrgent = hoursSinceWorn >= 48;

    return (
      <Animated.View
        style={[
          styles.laundryItemCard,
          isUrgent && styles.urgentItemCard,
          {
            opacity: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={isUrgent ? ['#fef2f2', '#fee2e2'] : ['#ffffff', '#f8fafc']}
          style={styles.laundryItemGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.laundryItemContent}>
            <View style={styles.itemImageContainer}>
              <Image source={item.imageUrl} style={styles.itemImage} resizeMode="cover" />
              <View style={[styles.dirtyBadge, isUrgent && styles.urgentBadge]}>
                <Text style={styles.dirtyBadgeText}>{isUrgent ? '🚨' : '🧺'}</Text>
              </View>
              {isUrgent && <View style={styles.urgentIndicator} />}
            </View>
            
            <View style={styles.itemInfo}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemName, isUrgent && styles.urgentText]} numberOfLines={1}>
                  {item.name}
                </Text>
                {isUrgent && (
                  <View style={styles.urgentTag}>
                    <Text style={styles.urgentTagText}>URGENT</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.itemMeta}>
                <Text style={styles.itemType}>{item.type}</Text>
                <View style={styles.colorDot} backgroundColor={item.color.toLowerCase()} />
                <Text style={styles.itemColor}>{item.color}</Text>
              </View>
              
              <Text style={[styles.lastWornText, isUrgent && styles.urgentText]}>
                Last worn: {new Date(item.lastWorn).toLocaleDateString()}
              </Text>
              {isUrgent && (
                <Text style={styles.urgentTimeText}>
                  {Math.round(hoursSinceWorn)} hours ago
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.cleanButton, isUrgent && styles.urgentButton]}
              onPress={() => handleCleanItem(item.id)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={isUrgent ? ['#EF4444', '#DC2626'] : ['#BE185D', '#DB2777']}
                style={styles.cleanButtonGradient}
              >
                <Text style={styles.cleanButtonText}>✓</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Laundry</Text>
        <Text style={styles.subtitle}>Manage your clothing maintenance</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statPill}>
          <Text style={styles.statPillNumber}>{stats.dirtyItems}</Text>
          <Text style={styles.statPillLabel}>To Wash</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={[styles.statPillNumber, { color: '#EF4444' }]}>{stats.urgentItems}</Text>
          <Text style={styles.statPillLabel}>Urgent</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={[styles.statPillNumber, { color: '#10B981' }]}>{stats.cleanItems}</Text>
          <Text style={styles.statPillLabel}>Clean</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchIcon}>
          <Text style={styles.searchIconText}>🔍</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Filter by:</Text>
          <View style={styles.filterChips}>
            {[
              { key: 'all', label: 'All', emoji: '👕' },
              { key: 'urgent', label: 'Urgent', emoji: '🚨' },
              { key: 'top', label: 'Tops', emoji: '👚' },
              { key: 'bottom', label: 'Bottoms', emoji: '👖' },
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  filterBy === option.key && styles.activeFilterChip,
                ]}
                onPress={() => setFilterBy(option.key)}
              >
                <Text style={[
                  styles.filterChipEmoji,
                  filterBy === option.key && styles.activeFilterChipEmoji
                ]}>
                  {option.emoji}
                </Text>
                <Text style={[
                  styles.filterChipText,
                  filterBy === option.key && styles.activeFilterChipText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Sort by:</Text>
          <View style={styles.sortChips}>
            {[
              { key: 'date', label: 'Latest', icon: '📅' },
              { key: 'name', label: 'Name', icon: '🔤' },
              { key: 'type', label: 'Type', icon: '🏷️' },
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortChip,
                  sortBy === option.key && styles.activeSortChip,
                ]}
                onPress={() => setSortBy(option.key)}
              >
                <Text style={[
                  styles.sortChipIcon,
                  sortBy === option.key && styles.activeSortChipIcon
                ]}>
                  {option.icon}
                </Text>
                <Text style={[
                  styles.sortChipText,
                  sortBy === option.key && styles.activeSortChipText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const animatedProgress = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ThemedView style={styles.container} useScrollView={false}>
      <FlatList
        data={filteredAndSortedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderLaundryItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery || filterBy !== 'all' ? 'No items found' : 'All Clean!'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || filterBy !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No items need washing right now'}
            </Text>
            {(searchQuery || filterBy !== 'all') && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setFilterBy('all');
                }}
              >
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => <View style={styles.footerSpacer} />}
      />

      {/* Enhanced Progress Card */}
      {showStatusCard && (
        <Animated.View 
          style={[
            styles.progressContainer,
            {
              opacity: statusCardAnimation,
              transform: [
                {
                  translateY: statusCardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient 
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']} 
            style={styles.progressCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.progressHeader}>
              <View style={styles.progressTitleContainer}>
                <Text style={styles.progressTitle}>Wardrobe Status</Text>
                <Text style={styles.progressSubtitle}>{stats.totalItems} total items</Text>
              </View>
              <View style={styles.progressHeaderButtons}>
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={() => setWardrobe([...wardrobe])}
                >
                  <Text style={styles.refreshButtonText}>↻</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => {
                    Animated.timing(statusCardAnimation, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => setShowStatusCard(false));
                  }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.progressContent}>
              {/* Circular Progress */}
              <View style={styles.progressCircleContainer}>
                <View style={styles.progressCircle}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        borderColor: getProgressColor(stats.dirtyPercentage),
                        transform: [{ rotate: animatedProgress }],
                      },
                    ]}
                  />
                  <View style={styles.progressCenter}>
                    <Text style={[styles.progressPercentage, { color: getProgressColor(stats.dirtyPercentage) }]}>
                      {Math.round(stats.dirtyPercentage)}%
                    </Text>
                    <Text style={styles.progressLabel}>Dirty</Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressBarFill,
                      { 
                        width: `${stats.dirtyPercentage}%`,
                        backgroundColor: getProgressColor(stats.dirtyPercentage)
                      }
                    ]} 
                  />
                </View>
                <View style={styles.progressBarLabels}>
                  <Text style={styles.progressBarLabel}>Clean</Text>
                  <Text style={styles.progressBarLabel}>Dirty</Text>
                </View>
              </View>
            </View>

            {/* Status Message */}
            <View style={styles.statusContainer}>
              <Text style={[styles.statusText, { color: getProgressColor(stats.dirtyPercentage) }]}>
                {stats.dirtyPercentage < 30 ? '🟢 Excellent! Wardrobe is well-maintained' :
                 stats.dirtyPercentage < 70 ? '🟡 Consider doing some laundry soon' :
                 '🔴 Laundry day! Many items need washing'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Enhanced Floating Action Buttons */}
      <View style={styles.floatingButtons}>
        {/* Bulk Clean Button */}
        {filteredAndSortedItems.length > 0 && (
          <TouchableOpacity
            style={styles.bulkCleanFab}
            onPress={handleBulkClean}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#BE185D', '#DB2777']}
              style={styles.bulkCleanGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.bulkCleanIcon}>🧺</Text>
              <Text style={styles.bulkCleanFabText}>Clean All</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Show Status Card Button */}
        {!showStatusCard && (
          <TouchableOpacity
            style={styles.showStatusButton}
            onPress={() => {
              setShowStatusCard(true);
              statusCardAnimation.setValue(0);
              Animated.timing(statusCardAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }).start();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6B7280', '#9CA3AF']}
              style={styles.showStatusGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.showStatusIcon}>📊</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
};

export default Laundry;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 40,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#BE185D',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statPillNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#BE185D',
    marginBottom: 2,
  },
  statPillLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(190, 24, 93, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchIconText: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  clearSearchButton: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  controlsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  controlRow: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(190, 24, 93, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(190, 24, 93, 0.1)',
  },
  activeFilterChip: {
    backgroundColor: '#BE185D',
    borderColor: '#BE185D',
  },
  filterChipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  activeFilterChipEmoji: {
    color: '#FFFFFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#BE185D',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortChips: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.1)',
  },
  activeSortChip: {
    backgroundColor: '#6B7280',
    borderColor: '#6B7280',
  },
  sortChipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  activeSortChipIcon: {
    color: '#FFFFFF',
  },
  sortChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeSortChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  laundryItemCard: {
    marginBottom: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  laundryItemGradient: {
    borderRadius: 20,
  },
  laundryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
  },
  dirtyBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dirtyBadgeText: {
    fontSize: 12,
  },
  urgentBadge: {
    backgroundColor: '#EF4444',
  },
  urgentIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#EF4444',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  urgentTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  urgentTagText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginRight: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  itemColor: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lastWornText: {
    fontSize: 12,
    color: '#BE185D',
    fontWeight: '500',
  },
  urgentTimeText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 2,
  },
  urgentText: {
    color: '#EF4444',
  },
  cleanButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cleanButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  cleanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  urgentButton: {
    // Inherits from cleanButton
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  clearFiltersButton: {
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    marginTop: 16,
  },
  clearFiltersButtonText: {
    color: '#BE185D',
    fontSize: 14,
    fontWeight: '600',
  },
  footerSpacer: {
    height: 20,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  progressCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  progressTitleContainer: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#BE185D',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  progressContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressCircleContainer: {
    marginBottom: 20,
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: 'transparent',
    transformOrigin: 'center',
  },
  progressCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBarLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    gap: 12,
  },
  bulkCleanFab: {
    borderRadius: 25,
    shadowColor: '#BE185D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bulkCleanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
  },
  bulkCleanIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  bulkCleanFabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  showStatusButton: {
    borderRadius: 25,
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  showStatusGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showStatusIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  urgentItemCard: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
});