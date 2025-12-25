import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const MOSCOW_TZ = 'Europe/Moscow'

export function parseDateTime(dateTime: string): Dayjs {
  return dayjs(dateTime)
}

export function formatTime(dateTime: string | Dayjs): string {
  const d = typeof dateTime === 'string' ? dayjs(dateTime) : dateTime
  return d.format('HH:mm')
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${String(mins).padStart(2, '0')}`
}

export function getMoscowDate(): Dayjs {
  return dayjs().tz(MOSCOW_TZ)
}

export function getYesterdayMoscow(): string {
  return dayjs().tz(MOSCOW_TZ).subtract(1, 'day').format('YYYY-MM-DD')
}

export function calculateSleepDuration(
  bedtime: string | null,
  wakeTime: string | null,
  napDurationMin: number
): number {
  if (!bedtime || !wakeTime) {
    return napDurationMin
  }

  const bed = dayjs(bedtime)
  const wake = dayjs(wakeTime)

  let diff = wake.diff(bed, 'minute')

  if (diff < 0) {
    diff = diff + 24 * 60
  }

  return napDurationMin + diff
}
