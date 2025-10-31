import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native'; 

export default function AboutScreen() {
  const { colors } = useTheme(); 

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image 
          source={require('../../../assets/images/android-icon-monochrome.png')} // Replace with your actual logo path
          style={styles.logo}
        />
        <Text style={[styles.appName, { color: colors.text }]}>CarPoolConnect</Text>
        <Text style={[styles.tagline, { color: colors.text }]}>
          Connecting Communities, One Ride at a Time.
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Our Mission</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>
            At CarPoolConnect, we believe in a smarter, greener, and more connected way to travel. Our mission is to make daily commutes and journeys more efficient, affordable, and environmentally friendly by linking drivers with empty seats to passengers heading in the same direction.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Why CarPoolConnect?</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>
            🚗 <Text style={{fontWeight: 'bold'}}>Save Money:</Text> Share fuel costs and reduce your daily expenses.{"\n"}
            🌍 <Text style={{fontWeight: 'bold'}}>Help the Planet:</Text> Less cars on the road means less emissions and traffic.{"\n"}
            🤝 <Text style={{fontWeight: 'bold'}}>Build Community:</Text> Meet new people and strengthen local connections.{"\n"}
            ⏰ <Text style={{fontWeight: 'bold'}}>Convenience:</Text> Find or offer rides that fit your schedule.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Our Values</Text>
          <Text style={[styles.sectionText, { color: colors.text }]}>
            • <Text style={{fontWeight: 'bold'}}>Safety First:</Text> We prioritize your peace of mind with verified profiles and secure payment options.{"\n"}
            • <Text style={{fontWeight: 'bold'}}>Reliability:</Text> A seamless experience from booking to drop-off.{"\n"}
            • <Text style={{fontWeight: 'bold'}}>Sustainability:</Text> Committed to reducing our carbon footprint.{"\n"}
            • <Text style={{fontWeight: 'bold'}}>Inclusivity:</Text> A welcoming platform for everyone.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Connect With Us</Text>
          <Text style={[styles.sectionText, { color: colors.text, marginBottom: 15 }]}>
            Have questions or feedback? We'd love to hear from you!
          </Text>
          <TouchableOpacity 
            style={styles.contactButton} 
            onPress={() => Linking.openURL('mailto:support@carpoolconnect.com')}
          >
            <Text style={styles.contactButtonText}>Send us an Email</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.contactButton, { marginTop: 10, backgroundColor: '#55acee' }]} // Twitter blue
            onPress={() => Linking.openURL('https://www.youtube.com/')} 
          >
            <Text style={styles.contactButtonText}>Follow us on Twitter</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: colors.text }]}>
          CarPoolConnect v1.0.0
        </Text>
        <Text style={[styles.copyrightText, { color: colors.text }]}>
          © {new Date().getFullYear()} CarPoolConnect. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 15,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  section: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left', // Keep text left-aligned for readability
  },
  contactButton: {
    backgroundColor: '#007AFF', // Standard iOS/Android blue
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    fontSize: 14,
    marginTop: 30,
    marginBottom: 5,
  },
  copyrightText: {
    fontSize: 12,
    textAlign: 'center',
  },
});