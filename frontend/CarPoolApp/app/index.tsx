import { StyleSheet, Text, TouchableOpacity, View, Image, SafeAreaView } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

const Page = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top section for title and logo */}
        <View style={styles.headerContainer}>
          <Image
            // Use require() to load a local image
            // Make sure you have an image at './assets/images/logo.png' or update the path
            source={require('../assets/images/react-logo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome to CarPoolConnect</Text>
          <Text style={styles.subtitle}>Connecting you to your next destination.</Text>
        </View>

        {/* Bottom section for buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.buttonText}>Login or Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={() => router.replace("/(tabs)/(drawer)/home_screen")}
          >
            <Text style={styles.buttonOutlineText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Page;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Set background color for the safe area
  },
  container: {
    flex: 1,
    justifyContent: "space-between", // Pushes header to top, buttons to bottom
    alignItems: "center",
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center', // Center the header content in its available space
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60, // Make it circular
    marginBottom: 30,
    backgroundColor: '#f0f0f0', // Placeholder background
  },
  title: {
    fontSize: 26, // Slightly larger
    fontWeight: "600", // A bit less bold than "bold"
    marginBottom: 10,
    textAlign: 'center',
    color: '#1A1A1A', // Darker text
  },
  subtitle: {
    fontSize: 16,
    color: '#555', // Softer grey
    marginBottom: 40,
    textAlign: 'center',
    maxWidth: '80%', // Keep subtitle from being too wide
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20, // Add some padding from the bottom edge
  },
  button: {
    backgroundColor: '#007AFF', // Primary blue
    paddingVertical: 16, // Slightly taller
    borderRadius: 12, // More rounded
    alignItems: 'center',
    width: '90%',
    marginBottom: 15,
    // Add shadow for depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, // Slightly thicker border
    borderColor: '#007AFF',
    shadowOpacity: 0, // No shadow for the outline button
    elevation: 0,
  },
  buttonOutlineText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  }
});




