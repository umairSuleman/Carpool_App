import { Text, View, StyleSheet,ImageBackground  } from 'react-native';
import { Link } from 'expo-router'; 
import { Image } from 'expo-image';
import ImageViewer from './components/Background';

const backgroundImg = require('./background_index.jpg');

export default function Index() {
  return (
    <ImageBackground source={backgroundImg} style={styles.background}>
      <View style={styles.content}>
        <Text style={styles.text}>Home Screen</Text>
        <Link href="/about" style={styles.button}>Go to About Screen</Link>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,             
    resizeMode: 'cover', 
  },
  // container: {
  //   flex: 1,
  //   backgroundColor: '#25292e',
  //   alignItems: 'center',
  // },
  text: {
    color: '#fff',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
