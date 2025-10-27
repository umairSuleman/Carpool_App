import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

const Page = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to CarPoolConnect</Text>
      <Text style={styles.subtitle}>Please choose an option to continue</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.buttonText}>Login or Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          // This navigates to the (tabs) layout, which then
          // automatically loads the (drawer) and its default home_screen
          onPress={() => router.replace("/(tabs)/(drawer)/home_screen")}
        >
          <Text style={styles.buttonOutlineText}>Continue without logging in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#fff', // White background
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF', // Primary blue
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    width: '90%',
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonOutlineText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
