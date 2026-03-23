export function serializeDoc(data: Record<string, any>) {
  const result: Record<string, any> = {}
  for (const [key, val] of Object.entries(data)) {
    if (val?._seconds !== undefined || val?.seconds !== undefined) {
      const secs = val._seconds ?? val.seconds
      result[key] = new Date(secs * 1000).toISOString()
    } else {
      result[key] = val
    }
  }
  return result
}