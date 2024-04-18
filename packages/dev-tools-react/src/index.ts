import { FormDevTools as DevTools } from './FormDevTools'
import { FormDevTools as Noop } from './noop'

export const FormDevTools =
  process.env.NODE_ENV === 'development' ? DevTools : Noop
