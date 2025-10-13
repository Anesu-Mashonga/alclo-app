import { useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
  Image,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { wardrobeSeed } from "../lib/seeds";
import { sampleOutfitForDay } from "../lib/outfit-engine";
import { OPENWEATHER_API_KEY } from "@env";
import * as Location from "expo-location";

// --- Helper Functions ---
function getFormattedDate() {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('en-US', options);
}

const getWeatherIcon = (condition) => {
  if (!condition) return "🌤️";
  if (condition.includes("Clear")) return "☀️";
  if (condition.includes("Cloud")) return "☁️";
  if (condition.includes("Rain")) return "🌧️";
  return "🌤️";
};

// --- Main Component ---
export default function Home() {
  const router = useRouter();
  const [wardrobe, setWardrobe] = useState(wardrobeSeed);
  const [weather, setWeather] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [event, setEvent] = useState("Work");
  const [currentAvatar, setCurrentAvatar] = useState(0);
  const [tooltip, setTooltip] = useState({ visible: false, item: null, position: { x: 0, y: 0 } });

  const avatarImages = [
    require('../assets/img/african-avatar.png'),
    require('../assets/img/male-avatar.png')
  ];

  const recommended = useMemo(() => {
    if (!weather) return null;
    return sampleOutfitForDay(wardrobe, weather, event);
  }, [wardrobe, weather, event, refreshKey]);

  // --- Effects ---
  useEffect(() => {
    // Fetch Weather Data
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location permission denied");
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        const data = await response.json();
        setWeather({
          tempC: data.main.temp,
          condition: data.weather[0].main,
        });
      } catch (error) {
        console.error(error);
        setLocationError("Weather unavailable");
      }
    })();

    // Avatar Switching Interval
    const interval = setInterval(() => {
      setCurrentAvatar((prev) => (prev + 1) % avatarImages.length);
    }, 1 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
  
  // --- UI Handlers ---
  const handleItemPress = (item, pressEvent) => {
    setTooltip({
      visible: true,
      item: item,
      position: { x: pressEvent.nativeEvent.pageX, y: pressEvent.nativeEvent.pageY },
    });
    setTimeout(() => setTooltip({ visible: false, item: null, position: { x: 0, y: 0 } }), 2000);
  };

  // --- Render Functions ---
  const renderClothingItem = (type, label) => {
    const item = recommended?.items.find((i) => i?.type === type);
    if (!item) return null;

    return (
      <TouchableOpacity style={styles.clothingItem} onPress={(e) => handleItemPress(item, e)}>
        <Image source={item.imageUrl} style={styles.clothingImage} resizeMode="contain" />
        <Text style={styles.clothingName}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderAccessoryItem = (item, index) => {
    return (
      <TouchableOpacity key={index} style={styles.accessoryItem} onPress={(e) => handleItemPress(item, e)}>
        <Image source={item.imageUrl} style={styles.accessoryImage} resizeMode="contain" />
      </TouchableOpacity>
    );
  };

  const mainClothingItems = recommended?.items.filter(item => ["top", "bottom", "outer", "shoes"].includes(item.type));

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, Ane Mash! 👋</Text>
            <Text style={styles.subGreeting}>Let's pick your outfit for today.</Text>
          </View>
          {/* --- REVERTED PROFILE ICON --- */}
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarText}>AM</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Today's Context Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{getFormattedDate()}</Text>
          <View style={styles.contextRow}>
            <View style={styles.contextItem}><Text style={styles.contextEmoji}>{getWeatherIcon(weather?.condition)}</Text><View><Text style={styles.contextValue}>{weather ? `${Math.round(weather.tempC)}°C` : (locationError || "...")}</Text><Text style={styles.contextLabel}>{weather?.condition || "Weather"}</Text></View></View>
            <View style={styles.contextDivider} />
            <TouchableOpacity style={styles.contextItem}><Text style={styles.contextEmoji}>📅</Text><View><Text style={styles.contextValue}>{event}</Text><Text style={styles.contextLabel}>Activity (Tap to change)</Text></View></TouchableOpacity>
          </View>
        </View>

        {/* Outfit of the Day Card */}
        {recommended ? (
          <View style={[styles.card, styles.outfitCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Outfit of the Day</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={() => setRefreshKey((prev) => prev + 1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.refreshIcon}>↻</Text>
                  <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.acceptIcon}>✓</Text>
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
            {recommended.reason && (
              <View style={styles.outfitReasonChip}><Text style={styles.outfitReasonText}>{recommended.reason}</Text></View>
            )}

            <View style={styles.clothingGrid}>
              {renderClothingItem("top", "Top")}
              {renderClothingItem("bottom", "Bottom")}
              {renderClothingItem("outer", "Outerwear")}
              {renderClothingItem("shoes", "Shoes")}
            </View>

            {recommended.items.filter((item) => item?.type === "accessories").length > 0 && (
                <>
                <View style={styles.divider} />
                <Text style={styles.accessoriesTitle}>Suggested Accessories</Text>
                <View style={styles.accessoriesRow}>
                    {recommended.items.filter((item) => item?.type === "accessories").map(renderAccessoryItem)}
                </View>
                </>
            )}
          </View>
        ) : weather === null && locationError === null ? (
          <View style={[styles.card, styles.outfitCard]}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingEmoji}>✨</Text>
              <Text style={styles.loadingText}>Please wait while I Curate the perfect fit for you 😉</Text>
              <View style={styles.loadingDots}>
                <Text style={styles.loadingDot}>.</Text>
                <Text style={styles.loadingDot}>.</Text>
                <Text style={styles.loadingDot}>.</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Virtual Try-On Card - UPDATED LAYOUT */}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Virtual Try-On</Text>
            </View>
            <View style={styles.vtoContent}>
              <View style={styles.vtoTextContainer}>
                <Text style={styles.vtoText}>See how today's outfit looks on your virtual model.</Text>
                <TouchableOpacity style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Try Outfit</Text>
                </TouchableOpacity>
              </View>
          <Image
            source={avatarImages[currentAvatar]}
            style={[styles.vtoAvatar, { transform: [{ scale: 1.2 }] }]}
            resizeMode="contain"
          />

            </View>
        </View>

        {/* Recommended Purchases Card */}
        <View style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.cardTitle}>For You</Text><Text style={styles.cardTitleEmoji}>🛍️</Text></View>
            <Text style={styles.cardSubtitle}>Recommended items to complete your look.</Text>
            <View style={styles.recommendationGrid}>
                <TouchableOpacity style={styles.recommendationItem}><Image source={require('../assets/img/White Trainers.jpg')} style={styles.recommendationImage} resizeMode="contain" /><Text style={styles.recommendationName}>White Sneakers</Text><Text style={styles.recommendationPrice}>$89</Text></TouchableOpacity>
                <TouchableOpacity style={styles.recommendationItem}><Image source={require('../assets/img/Blue Denim Jacket.jpg')} style={styles.recommendationImage} resizeMode="contain" /><Text style={styles.recommendationName}>Denim Jacket</Text><Text style={styles.recommendationPrice}>$129</Text></TouchableOpacity>
                <TouchableOpacity style={styles.recommendationItem}><Image source={require('../assets/img/black-shirt.jpg')} style={styles.recommendationImage} resizeMode="contain" /><Text style={styles.recommendationName}>Black T-Shirt</Text><Text style={styles.recommendationPrice}>$29</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Shop All Recommendations</Text></TouchableOpacity>
        </View>

        {/* Wardrobe Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wardrobe Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}><Text style={styles.statNumber}>47</Text><Text style={styles.statLabel}>Total Items</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>8</Text><Text style={styles.statLabel}>Worn Weekly</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>12</Text><Text style={styles.statLabel}>In Laundry</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>23</Text><Text style={styles.statLabel}>Favorites</Text></View>
          </View>
        </View>
      </ScrollView>

      {tooltip.visible && (
        <View style={styles.tooltipOverlay} pointerEvents="none"><View style={[styles.tooltipContainer, { top: tooltip.position.y - 60, left: tooltip.position.x - 75 }]}><Text style={styles.tooltipText}>{tooltip.item.name}</Text><View style={styles.tooltipArrow} /></View></View>
      )}
    </SafeAreaProvider>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  container: { paddingHorizontal: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24 },
  greeting: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subGreeting: { fontSize: 16, color: '#6B7280', marginTop: 4 },
  // --- REVERTED PROFILE ICON STYLES ---
  profileButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(190, 24, 93, 0.1)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(190, 24, 93, 0.2)" },
  profileAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(190, 24, 93, 0.2)", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "600", color: "#be185d" },
  // Generic Card
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#111827', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  cardTitleEmoji: { fontSize: 18 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  contextRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  contextItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  contextEmoji: { fontSize: 24, marginRight: 12 },
  contextValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  contextLabel: { fontSize: 14, color: '#6B7280' },
  contextDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  outfitCard: { backgroundColor: 'white', borderColor: 'rgba(0, 0, 0, 0.1)', borderWidth: 1 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  refreshIcon: { fontSize: 14, color: '#6B7280' },
  refreshText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BE185D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  acceptIcon: { fontSize: 14, color: '#FFFFFF' },
  acceptText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  loadingEmoji: {
    fontSize: 32,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  loadingDot: {
    fontSize: 24,
    color: '#BE185D',
    fontWeight: 'bold',
  },
  outfitReasonChip: { alignSelf: 'flex-start', backgroundColor: 'rgba(190, 24, 93, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  outfitReasonText: { color: '#BE185D', fontSize: 13, fontWeight: '500' },
  
  // --- MODIFIED OUTFIT STYLES TO MATCH RECOMMENDATIONS ---
  clothingGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  clothingItem: { flex: 1 },
  clothingImage: { width: '100%', height: 100, borderRadius: 12, backgroundColor: '#F3F4F6', marginBottom: 8 },
  clothingName: { fontSize: 14, fontWeight: '500', color: '#374151' },
  // ---------------------------------------------------------

  divider: { height: 1, backgroundColor: 'rgba(190, 24, 93, 0.1)', marginVertical: 8 },
  accessoriesTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, marginTop: 8 },
  accessoriesRow: { flexDirection: 'row', gap: 12 },
  accessoryItem: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(190, 24, 93, 0.2)', justifyContent: 'center', alignItems: 'center' },
  accessoryImage: { width: 50, height: 50, borderRadius: 25 },
  
  // --- UPDATED VTO STYLES ---
  vtoContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 12,
    justifyContent: 'space-between'
  },
  vtoTextContainer: { 
    flex: 1, 
    marginRight: 16,
    justifyContent: 'center'
  },
  vtoText: { 
    fontSize: 15, 
    color: '#374151', 
    lineHeight: 22, 
    marginBottom: 16 
  },
  vtoAvatar: { 
    width: 120, 
    height: 200, 
    borderRadius: 60,
    marginTop: -85,
    marginRight: -10,
    marginLeft: 0,
    marginBottom: -50,
    padding: 0
  },
  // --------------------------
  
  // --- RECOMMENDATION STYLES (NOW THE TEMPLATE) ---
  recommendationGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  recommendationItem: { flex: 1 },
  recommendationImage: { width: '100%', height: 100, borderRadius: 12, backgroundColor: '#F3F4F6', marginBottom: 8 },
  recommendationName: { fontSize: 14, fontWeight: '500', color: '#374151' },
  recommendationPrice: { fontSize: 13, color: '#6B7280' },
  // -------------------------------------------------

  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#BE185D' },
  statLabel: { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  primaryButton: { backgroundColor: '#BE185D', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'flex-start' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14, textAlign: 'center' },
  secondaryButton: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, marginTop: 16 },
  secondaryButtonText: { color: '#374151', fontWeight: '600', fontSize: 15, textAlign: 'center' },
  tooltipOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  tooltipContainer: { position: 'absolute', backgroundColor: '#111827', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, width: 150, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  tooltipText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  tooltipArrow: { position: 'absolute', top: '100%', width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#111827' },
});
