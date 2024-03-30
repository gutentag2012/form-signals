export const ErrorText = ({ message }: { message?: string }) => {
  if (!message) return null
  return <p className="text-[0.8rem] font-medium text-destructive">{message}</p>
}
