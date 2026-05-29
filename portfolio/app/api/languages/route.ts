import { NextResponse } from 'next/server'

const GITHUB_REST = 'https://api.github.com'

interface Repo {
  name: string
  fork: boolean
  languages_url: string
}

interface AccountConfig {
  token: string
  username: string
  label: string
  includeRepos: Set<string> | null // null = all repos
}

function parseRepoList(env: string | undefined): Set<string> | null {
  if (!env?.trim()) return null
  return new Set(env.split(',').map(r => r.trim().toLowerCase()).filter(Boolean))
}

async function fetchAllRepos(config: AccountConfig): Promise<Repo[]> {
  const repos: Repo[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `${GITHUB_REST}/user/repos?per_page=100&page=${page}&type=all`,
      {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github+json',
        },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) { console.error(`[${config.label}] Repos HTTP ${res.status}`); break }
    const batch: Repo[] = await res.json()
    if (!batch.length) break

    // Filter to only included repos if a list is specified
    const filtered = config.includeRepos
      ? batch.filter(r => config.includeRepos!.has(r.name.toLowerCase()))
      : batch

    repos.push(...filtered)
    if (batch.length < 100) break
    page++
  }

  return repos
}

async function fetchRepoLanguages(
  token: string,
  languagesUrl: string
): Promise<Record<string, number>> {
  try {
    const res = await fetch(languagesUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return {}
    return res.json()
  } catch { return {} }
}

export async function GET() {
  const personalToken       = process.env.GITHUB_TOKEN
  const personalUser        = process.env.GITHUB_USERNAME ?? 'NoirAbhinav'
  const personalInclude     = parseRepoList(process.env.GITHUB_INCLUDE_REPOS)
  const workToken           = process.env.GITHUB_WORK_TOKEN
  const workUser            = process.env.GITHUB_WORK_USERNAME
  const workInclude         = parseRepoList(process.env.GITHUB_WORK_INCLUDE_REPOS)

  if (!personalToken) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not set' }, { status: 500 })
  }

  const accounts: AccountConfig[] = [
    { token: personalToken, username: personalUser, label: 'personal', includeRepos: personalInclude },
    ...(workToken && workUser
      ? [{ token: workToken, username: workUser, label: 'work', includeRepos: workInclude }]
      : []),
  ]

  const repoLists = await Promise.all(accounts.map(fetchAllRepos))

  // Log which repos are being used (visible in Vercel function logs)
  repoLists.forEach((repos, i) => {
    console.log(`[${accounts[i].label}] Using ${repos.length} repos:`, repos.map(r => r.name).join(', '))
  })

  const merged: Record<string, number> = {}

  await Promise.all(
    accounts.map(async (account, idx) => {
      const repos = repoLists[idx]
      const chunks: Repo[][] = []
      for (let i = 0; i < repos.length; i += 20) chunks.push(repos.slice(i, i + 20))

      for (const chunk of chunks) {
        const results = await Promise.all(
          chunk.map(repo => fetchRepoLanguages(account.token, repo.languages_url))
        )
        results.forEach(langMap => {
          Object.entries(langMap).forEach(([lang, bytes]) => {
            merged[lang] = (merged[lang] ?? 0) + (bytes as number)
          })
        })
      }
    })
  )

  if (Object.keys(merged).length === 0) {
    return NextResponse.json({ error: 'No language data found' }, { status: 500 })
  }

const IGNORE = new Set([
  'HTML', 'CSS', 'Makefile', 'Shell', 'Dockerfile', 'CMake',
  'YAML', 'JSON', 'TOML', 'Markdown', 'PLpgSQL', 'Batchfile',
  'PowerShell', 'Vim Script', 'Nix', 'HCL', 'Jinja',
  'Jupyter Notebook', 'SCSS', 'EJS', 'Vue',  // ← add these
])

  const filtered = Object.fromEntries(
    Object.entries(merged).filter(([lang]) => !IGNORE.has(lang))
  )

  const totalBytes = Object.values(filtered).reduce((s, v) => s + v, 0)

  const languages = Object.entries(filtered)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: Math.round((bytes / totalBytes) * 100),
    }))

  const sum = languages.reduce((s, l) => s + l.percentage, 0)
  if (sum !== 100 && languages.length > 0) languages[0].percentage += 100 - sum

  // Return which repos were used so the frontend can show it
  const repoNames = repoLists.flatMap((repos, i) =>
    repos.map(r => ({ repo: r.name, account: accounts[i].label }))
  )

  return NextResponse.json({ languages, totalBytes, repos: repoNames })
}