import { Image, StyleSheet, Text, View } from 'react-native';

export default function OutfitCard({ outfit }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Recommended Outfit</Text>
      <View style={styles.itemsRow}>
        {outfit.items.map((it) => (
          <View key={it.id} style={styles.itemCard}>
            {it.imageUrl ? (
              <Image source={it.imageUrl} style={styles.thumb} resizeMode="contain" />
            ) : (
              <View style={styles.thumb} />
            )}
            <Text style={styles.itemName} numberOfLines={1}>
              {it.name}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.reason}>{outfit.reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  itemsRow: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  itemCard: {
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  itemName: {
    marginTop: 6,
    width: 80,
    textAlign: 'center',
    fontSize: 13,
    color: '#444',
  },
  reason: {
    marginTop: 12,
    color: '#374151',
    fontSize: 14,
  },
});
