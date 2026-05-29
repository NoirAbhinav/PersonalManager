import { NextResponse } from 'next/server'

const GITHUB_GRAPHQL = 'https://api.github.com/graphql'

const QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`

interface RawDay {
  date: string
  contributionCount: number
  contributionLevel: string
}

interface AccountConfig {
  token: string
  username: string
  label: string
}

function levelFromCount(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count <= 2)  return 1
  if (count <= 4)  return 2
  if (count <= 7)  return 3
  return 4
}

async function fetchAccount(config: AccountConfig): Promise<{
  days: Record<string, number>
  total: number
} | null> {
  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { username: config.username },
      }),
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      console.error(`[${config.label}] HTTP ${res.status}`)
      return null
    }

    const json = await res.json()

    if (json.errors) {
      console.error(`[${config.label}] GraphQL error:`, json.errors[0]?.message)
      return null
    }

    const calendar = json.data?.user?.contributionsCollection?.contributionCalendar
    if (!calendar) {
      console.error(`[${config.label}] No calendar data`)
      return null
    }

    const days: Record<string, number> = {}
    calendar.weeks.forEach((week: { contributionDays: RawDay[] }) => {
      week.contributionDays.forEach(d => {
        days[d.date] = (days[d.date] ?? 0) + d.contributionCount
      })
    })

    return { days, total: calendar.totalContributions }
  } catch (err) {
    console.error(`[${config.label}] Fetch error:`, err)
    return null
  }
}

export async function GET() {
  const personalToken = process.env.GITHUB_TOKEN
  const personalUser  = process.env.GITHUB_USERNAME ?? 'NoirAbhinav'
  const workToken     = process.env.GITHUB_WORK_TOKEN
  const workUser      = process.env.GITHUB_WORK_USERNAME

  if (!personalToken) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not set' }, { status: 500 })
  }

  // Fetch both accounts in parallel
  const accounts: AccountConfig[] = [
    { token: personalToken, username: personalUser, label: 'personal' },
    ...(workToken && workUser
      ? [{ token: workToken, username: workUser, label: 'work' }]
      : []),
  ]

  const results = await Promise.all(accounts.map(fetchAccount))

  // Merge: sum counts per date across both accounts
  const merged: Record<string, number> = {}
  let totalContributions = 0

  results.forEach(result => {
    if (!result) return
    totalContributions += result.total
    Object.entries(result.days).forEach(([date, count]) => {
      merged[date] = (merged[date] ?? 0) + count
    })
  })

  if (Object.keys(merged).length === 0) {
    return NextResponse.json({ error: 'Failed to fetch from any account' }, { status: 500 })
  }

  // Sort dates and build final array
  const sortedDates = Object.keys(merged).sort()
  const days = sortedDates.map(date => {
    const count = merged[date]
    return {
      date,
      count,
      level: levelFromCount(count),
    }
  })

  // Calculate current streak from merged data
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++
    else break
  }

  // How many accounts actually returned data
  const activeAccounts = results.filter(Boolean).length

  return NextResponse.json({
    days,
    totalContributions,
    streak,
    accounts: activeAccounts,
  })
}