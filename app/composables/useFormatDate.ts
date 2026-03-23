export function useFormatDate() {
  function toDate(d: any): Date | null {
    if (!d) return null

    if (d?._seconds !== undefined) return new Date(d._seconds * 1000)

    if (d?.seconds !== undefined) return new Date(d.seconds * 1000)

    const date = new Date(d)
    return isNaN(date.getTime()) ? null : date
  }

  function fmtDate(d: any, short = false) {
    const date = toDate(d)
    if (!date) return 'N/A'
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: short ? 'short' : 'long',
      day: 'numeric',
    })
  }

  function fmtTime(d: any) {
    const date = toDate(d)
    if (!date) return null
    return date.toLocaleTimeString()
  }

  return { fmtDate, fmtTime, toDate }
}

