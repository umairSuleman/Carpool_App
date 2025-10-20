import { Text, View, StyleSheet,ImageBackground } from 'react-native';

const backgroundImg = require('./background_index.jpg');

export default function AboutScreen() {
  return (
    <ImageBackground source={backgroundImg} style={styles.background}>
      <View style={styles.container}>
      <Text style={styles.text}>About screen</Text>
    </View>
    </ImageBackground>
    
  );
}

// add background to this page as well.


const styles = StyleSheet.create({
    background: {
    flex: 1,             
    resizeMode: 'cover', 
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#25292e', // REMOVE THIS
  },
  text: {
    color: '#fff',
    fontSize: 24,
  },
});