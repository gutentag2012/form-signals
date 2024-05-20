export async function serverDelay(ms = 1000) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function IsUsernameTaken(username: string) {
  await serverDelay()
  return username.toLowerCase().includes('taken')
}
