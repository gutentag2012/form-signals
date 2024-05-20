import { useFieldContext } from '@formsignals/form-react'
import { Text, TextInput, type TextInputProps, View } from 'react-native'
import {useComputed} from "@preact/signals-react";

interface FormInputProps
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {}

export function FormInput(props: FormInputProps) {
  const field = useFieldContext<string, ''>()
  const errorText = field.errors.value.join(', ')
  const hasError = errorText.length > 0

  return (
    <View>
      <TextInput
        style={{
          height: 40,
          borderColor: hasError ? 'red' : 'gray',
          borderWidth: 1,
          marginBottom: 4,
          borderRadius: 4,
          padding: 8,
        }}
        value={field.data.value}
        onChangeText={field.handleChange}
        {...props}
      />
      {field.isValidating.value && (
        <Text style={{ fontSize: 12, marginBottom: 4 }}>Validating...</Text>
      )}
      <Text
        style={{
          color: 'red',
          fontSize: 12,
          marginBottom: 4,
        }}
      >
        {errorText}
      </Text>
    </View>
  )
}
