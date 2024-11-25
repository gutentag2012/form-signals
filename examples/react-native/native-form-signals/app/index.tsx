import { UserForm } from '@/components/UserForm'
import { View } from 'react-native'

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <UserForm />
    </View>
  )
}
