export const ErrorText = ({ message }: { message?: string }) => {
  if (!message) return null
  return <p className="font-medium text-[0.8rem] text-destructive">{message}</p>
}
