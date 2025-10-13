import { StyleSheet, View, ScrollView } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'

const ThemedView = ({ style, children, useScrollView = true, ...props }) => {
  return (
    <LinearGradient
      colors={['#fce7f3', '#fdf2f8', '#ffffff']}
      style={[styles.container, style]}
      {...props}
    >
      {useScrollView ? (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.contentContainer}>
          {children}
        </View>
      )}
    </LinearGradient>
  )
}

export default ThemedView

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding for better scrolling
  }
})
