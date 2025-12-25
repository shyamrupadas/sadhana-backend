import { FastifyInstance } from 'fastify'
import { ApiShemas } from '../schema'
import { NotFoundError } from '../utils/errors'
import {
  calculateSleepDuration,
  getYesterdayMoscow,
  getMoscowDate,
} from '../utils/datetime'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export class SleepRecordsService {
  constructor(private fastify: FastifyInstance) {}

  async getAllSleepRecords(userId: string): Promise<ApiShemas['DailyEntry'][]> {
    const client = await this.fastify.pg.connect()

    try {
      const now = getMoscowDate()
      const fiveDaysAgo = now.subtract(4, 'day').format('YYYY-MM-DD')
      const today = now.format('YYYY-MM-DD')

      const result = await client.query(
        'SELECT id, date, sleep_data, habits FROM daily_entries WHERE user_id = $1 AND date >= $2 AND date <= $3 ORDER BY date DESC',
        [userId, fiveDaysAgo, today]
      )

      return result.rows.map((row) => ({
        id: row.date,
        date: row.date,
        sleep: row.sleep_data,
        habits: row.habits,
      }))
    } finally {
      client.release()
    }
  }

  async getAllSleepRecordsForStats(userId: string): Promise<ApiShemas['DailyEntry'][]> {
    const client = await this.fastify.pg.connect()

    try {
      const result = await client.query(
        'SELECT id, date, sleep_data, habits FROM daily_entries WHERE user_id = $1 ORDER BY date DESC',
        [userId]
      )

      return result.rows.map((row) => ({
        id: row.date,
        date: row.date,
        sleep: row.sleep_data,
        habits: row.habits,
      }))
    } finally {
      client.release()
    }
  }

  async getSleepRecordByDate(
    userId: string,
    date: string
  ): Promise<ApiShemas['DailyEntry'] | null> {
    const client = await this.fastify.pg.connect()

    try {
      const result = await client.query(
        'SELECT id, date, sleep_data, habits FROM daily_entries WHERE user_id = $1 AND date = $2',
        [userId, date]
      )

      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0]
      return {
        id: row.date,
        date: row.date,
        sleep: row.sleep_data,
        habits: row.habits,
      }
    } finally {
      client.release()
    }
  }

  async upsertSleepRecord(
    userId: string,
    date: string,
    sleepData: ApiShemas['SleepDataInput']
  ): Promise<ApiShemas['DailyEntry']> {
    const client = await this.fastify.pg.connect()

    try {
      const durationMin = calculateSleepDuration(
        sleepData.bedtime ?? null,
        sleepData.wakeTime ?? null,
        sleepData.napDurationMin ?? 0
      )

      const sleepDataComplete: ApiShemas['SleepData'] = {
        bedtime: sleepData.bedtime ?? null,
        wakeTime: sleepData.wakeTime ?? null,
        napDurationMin: sleepData.napDurationMin ?? 0,
        durationMin,
      }

      const existing = await client.query(
        'SELECT habits FROM daily_entries WHERE user_id = $1 AND date = $2',
        [userId, date]
      )

      const habits =
        existing.rows.length > 0 && Array.isArray(existing.rows[0].habits)
          ? existing.rows[0].habits
          : []

      const entryId = `${userId}-${date}`
      const result = await client.query(
        `INSERT INTO daily_entries (id, user_id, date, sleep_data, habits)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
         ON CONFLICT (user_id, date)
         DO UPDATE SET sleep_data = $4::jsonb, updated_at = NOW()
         RETURNING id, date, sleep_data, habits`,
        [entryId, userId, date, JSON.stringify(sleepDataComplete), JSON.stringify(habits)]
      )

      const row = result.rows[0]
      return {
        id: row.date,
        date: row.date,
        sleep: row.sleep_data,
        habits: row.habits,
      }
    } finally {
      client.release()
    }
  }

  async updateHabitValue(
    userId: string,
    date: string,
    habitKey: string,
    value: boolean
  ): Promise<ApiShemas['DailyEntry']> {
    const client = await this.fastify.pg.connect()

    try {
      const existing = await client.query(
        'SELECT sleep_data, habits FROM daily_entries WHERE user_id = $1 AND date = $2',
        [userId, date]
      )

      let sleepData: ApiShemas['SleepData']
      let habits: ApiShemas['HabitCheck'][]

      if (existing.rows.length === 0) {
        sleepData = {
          bedtime: null,
          wakeTime: null,
          napDurationMin: 0,
          durationMin: 0,
        }
        habits = []
      } else {
        const row = existing.rows[0]
        sleepData = row.sleep_data || {
          bedtime: null,
          wakeTime: null,
          napDurationMin: 0,
          durationMin: 0,
        }
        habits = Array.isArray(row.habits) ? row.habits : []
      }

      const habitIndex = habits.findIndex((h) => h.key === habitKey)

      if (habitIndex >= 0) {
        habits[habitIndex].value = value
      } else {
        habits.push({ key: habitKey, value })
      }

      const entryId = `${userId}-${date}`
      const result = await client.query(
        `INSERT INTO daily_entries (id, user_id, date, sleep_data, habits)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
         ON CONFLICT (user_id, date)
         DO UPDATE SET habits = $5::jsonb, updated_at = NOW()
         RETURNING id, date, sleep_data, habits`,
        [entryId, userId, date, JSON.stringify(sleepData), JSON.stringify(habits)]
      )

      const row = result.rows[0]
      return {
        id: row.date,
        date: row.date,
        sleep: row.sleep_data,
        habits: row.habits,
      }
    } finally {
      client.release()
    }
  }

  async removeHabitFromDay(
    userId: string,
    date: string,
    habitKey: string
  ): Promise<ApiShemas['DailyEntry']> {
    const client = await this.fastify.pg.connect()

    try {
      const existing = await client.query(
        'SELECT sleep_data, habits FROM daily_entries WHERE user_id = $1 AND date = $2',
        [userId, date]
      )

      if (existing.rows.length === 0) {
        throw new NotFoundError('Daily entry not found')
      }

      const habits: ApiShemas['HabitCheck'][] = existing.rows[0].habits.filter(
        (h: ApiShemas['HabitCheck']) => h.key !== habitKey
      )

      const result = await client.query(
        `UPDATE daily_entries
         SET habits = $1::jsonb, updated_at = NOW()
         WHERE user_id = $2 AND date = $3
         RETURNING id, date, sleep_data, habits`,
        [JSON.stringify(habits), userId, date]
      )

      const row = result.rows[0]
      return {
        id: row.date,
        date: row.date,
        sleep: row.sleep_data,
        habits: row.habits,
      }
    } finally {
      client.release()
    }
  }

  async checkYesterdayData(userId: string): Promise<boolean> {
    const client = await this.fastify.pg.connect()

    try {
      const yesterday = getYesterdayMoscow()

      const result = await client.query(
        'SELECT sleep_data FROM daily_entries WHERE user_id = $1 AND date = $2',
        [userId, yesterday]
      )

      if (result.rows.length === 0) {
        return false
      }

      const sleepData: ApiShemas['SleepData'] = result.rows[0].sleep_data

      return (
        sleepData.bedtime !== null &&
        sleepData.wakeTime !== null &&
        sleepData.bedtime !== undefined &&
        sleepData.wakeTime !== undefined
      )
    } finally {
      client.release()
    }
  }
}
