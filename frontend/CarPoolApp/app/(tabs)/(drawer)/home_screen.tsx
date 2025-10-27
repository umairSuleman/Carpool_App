import { StyleSheet, View, Text } from 'react-native'
import React from 'react'
// Import UrlTile and Marker along with MapView
import MapView, { Marker, UrlTile } from 'react-native-maps'; 

const Page = () => {
  // --- UPDATED TILE URL ---
  // Switched to Stadia Maps (Stamen Toner Lite) - free tier, no API key needed
  // Requires attribution (see Text component below)
  const tileUrl = "https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}.png";

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        // provider={null} // You can explicitly set provider to null 
      >
        {/* This component overlays the OSM tiles on top of the map */}
        <UrlTile
          /**
           * The URL template for the tile server. {z} is zoom, {x} is x-coord, {y} is y-coord.
           */
          urlTemplate={tileUrl}
          /**
           * Set a max zoom level.
           */
          maximumZ={19}
          flipY={false} // Standard for this provider

          /**
           * We keep the User-Agent as it's good practice for any web request.
           */
          userAgent="edu.yourcollege.carpoolconnect/1.0.0"
        />

        {/* --- ADD MARKERS HERE --- */}
        
        {/* A simple marker at the map's initial location */}
        <Marker 
          coordinate={{
            latitude: 37.78825,
            longitude: -122.4324
          }}
          title="Marker 1"
          description="This is the first marker"
        />

        {/* A second marker nearby */}
        <Marker 
          coordinate={{
            latitude: 37.785834,
            longitude: -122.406417
          }}
          title="Marker 2"
          description="This is another marker"
          pinColor="blue" // You can also customize the color
        />

      </MapView>

      {/* --- ATTRIBUTION --- */}
      {/* Stadia Maps/Stamen requires attribution */}
      <View style={styles.attributionContainer}>
        <Text style={styles.attributionText}>
          Map tiles by Stadia Maps, Stamen Design, under CC BY 3.0. Data © OpenStreetMap contributors.
        </Text>
      </View>
    </View>
  )
}

export default Page

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  // --- NEW STYLES FOR ATTRIBUTION ---
  attributionContainer: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  attributionText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333',
  },
})

