import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { UserForm } from './src/UserForm'

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Native Form Signals</Text>

      <UserForm />

      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    marginHorizontal: 32,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: 'bold',
  },
})
