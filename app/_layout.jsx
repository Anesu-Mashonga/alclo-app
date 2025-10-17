import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';

const RootLayout = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Home', route: '/', icon: '⌂' },
    { name: 'Wardrobe', route: '/wardrobe', icon: '👕' },
    { name: 'Upload', route: '/modal', icon: '＋' },
    { name: 'Explore', route: '/explore', icon: '✨' },
    { name: 'Laundry', route: '/laundry', icon: '🧺' },
  ];

  return (
    <View style={styles.container}>
      {/* The Stack component handles the screen content */}
      <Stack screenOptions={{ headerShown: false }} />
      
      {/* Modern Tab Bar */}
      <View style={styles.footer}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.route;
          const isUploadButton = item.name === 'Upload';

          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.navItem,
                isUploadButton && styles.uploadNavItem,
              ]}
              onPress={() => router.push(item.route)}
            >
              <View style={[
                styles.navIconContainer,
                isUploadButton && styles.uploadIconContainer,
                isActive && !isUploadButton && styles.activeNavItem,
              ]}>
                <Text style={[
                  styles.navIcon,
                  isActive && styles.activeNavText,
                  isUploadButton && styles.uploadNavIcon,
                ]}>
                  {item.icon}
                </Text>
              </View>
              <Text style={[
                styles.navText,
                isActive && styles.activeNavText,
                isUploadButton && { display: 'none' } // Hide text for upload button
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default RootLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // A light background color for the app
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70, // Increased height for a modern look and safe area
    paddingBottom: 20, // Bottom padding for home indicator
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  uploadNavItem: {
    marginTop: -25, // Elevate the upload button
  },
  navIconContainer: {
    width: 60,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: 4,
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#BE185D',
    shadowColor: '#BE185D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNavItem: {
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
  },
  navIcon: {
    fontSize: 22,
    color: '#6B7280', // Default icon color
  },
  uploadNavIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  navText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#BE185D',
    fontWeight: '600',
  },
});