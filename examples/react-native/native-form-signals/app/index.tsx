import { Text, View } from "react-native";
import {UserForm} from "@/components/UserForm";

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
  );
}
