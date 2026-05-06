// importing react hooks
import { useEffect, useMemo, useState } from 'react'
// styles for the app
import './App.css'

const emptyUsers = []
const emptyPeople = []
const emptyMovies = []
const emptyMovieCrew = []
const emptyAwards = []
const emptyCategories = []
const emptyAwardCategories = []
const emptyNominations = []
const emptyVotes = []

const emptyForms = {
  user: { name: '', email: '', password: '', role: 'voter' },
  person: { first_name: '', last_name: '', birth_date: '', nationality: '' },
  movie: { title: '', release_year: '', duration: '', description: '' },
  movieCrew: { movie_id: '', person_id: '', role: 'actor', character_name: '' },
  award: { name: '', year: '', description: '' },
  category: { name: '', nominee_type: 'ANY_CREW' },
  awardCategory: { award_id: '', category_id: '', start_time: '', end_time: '' },
  nomination: { award_id: '', category_id: '', movie_id: '', person_id: '' },
}

const emptyManageEditing = {
  user: null,
  person: null,
  movie: null,
  movieCrew: null,
  award: null,
  category: null,
  awardCategory: null,
  nomination: null,
}

const adminFiltersInitial = {
  userRole: '',
  userQuery: '',
  personQuery: '',
  personNation: '',
  movieQuery: '',
  crewMovieId: '',
  crewRole: '',
  crewPersonQuery: '',
  awardSearch: '',
  awardYear: '',
  categorySearch: '',
  acAwardId: '',
  acCategoryId: '',
  nomAwardId: '',
  nomCategoryId: '',
  nomMovieId: '',
  nomPersonQuery: '',
}

const nomineeTypeOptions = [
  { value: 'MOVIE', label: 'Movie only' },
  { value: 'ACTOR', label: 'Actor' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'WRITER', label: 'Writer' },
  { value: 'PRODUCER', label: 'Producer' },
  { value: 'SOUND_EDITOR', label: 'Sound editor' },
  { value: 'VFX', label: 'VFX' },
  { value: 'COSTUME_DESIGN', label: 'Costume design' },
  { value: 'ANY_CREW', label: 'Any crew role' },
]

const crewRoleOptions = [
  { value: 'actor', label: 'actor' },
  { value: 'director', label: 'director' },
  { value: 'writer', label: 'writer' },
  { value: 'producer', label: 'producer' },
  { value: 'sound_editor', label: 'sound editor' },
  { value: 'vfx', label: 'vfx' },
  { value: 'costume_design', label: 'costume design' },
]

function readStoredSession() {
  try {
    window.localStorage.removeItem('vote4oscars_current_user_id')
    window.localStorage.removeItem('vote4oscars_guest')
  } catch {
    // ignore storage access issues
  }
  return { userId: null, guest: false }
}

function persistSession(session) {
  void session
}

function slotWindowBounds(startTime, endTime) {
  const startMs = startTime ? new Date(startTime).getTime() : Number.NEGATIVE_INFINITY
  const endMs = endTime ? new Date(endTime).getTime() : Number.POSITIVE_INFINITY
  return { startMs, endMs }
}

function slotPhase(now, startTime, endTime) {
  const { startMs, endMs } = slotWindowBounds(startTime, endTime)
  if (Number.isFinite(endMs) && now > endMs) return 'past'
  if (Number.isFinite(startMs) && now < startMs) return 'upcoming'
  return 'ongoing'
}

/** Splits leaderboard groups: not yet ended vs ended (by voting slot window). */
function partitionLeaderboardGroups(groups, now) {
  const enriched = groups.map((g) => {
    const { startMs, endMs } = slotWindowBounds(g.start_time, g.end_time)
    const phase = slotPhase(now, g.start_time, g.end_time)
    return { ...g, startMs, endMs, phase }
  })
  const active = enriched
    .filter((g) => g.phase !== 'past')
    .sort((a, b) => {
      const order = { ongoing: 0, upcoming: 1 }
      return order[a.phase] - order[b.phase]
    })
  const past = enriched.filter((g) => g.phase === 'past').sort((a, b) => b.endMs - a.endMs)
  return { active, past }
}

function firstOpenLeaderboardCategoryId(groups, now) {
  const { active, past } = partitionLeaderboardGroups(groups, now)
  if (active.length > 0) return active[0].award_category_id
  if (past.length > 0) return past[0].award_category_id
  return groups[0]?.award_category_id ?? null
}

// main App component starts here
function App() {
  // defining state for all our db tables
  const [users, setUsers] = useState(emptyUsers)
  const [people, setPeople] = useState(emptyPeople)
  const [movies, setMovies] = useState(emptyMovies)
  const [movieCrew, setMovieCrew] = useState(emptyMovieCrew)
  const [awards, setAwards] = useState(emptyAwards)
  const [categories, setCategories] = useState(emptyCategories)
  const [awardCategories, setAwardCategories] = useState(emptyAwardCategories)
  const [nominations, setNominations] = useState(emptyNominations)
  const [votes, setVotes] = useState(emptyVotes)
  const [bootstrapLoading, setBootstrapLoading] = useState(true)
  const [bootstrapError, setBootstrapError] = useState('')
  const [forms, setForms] = useState(emptyForms)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [session, setSession] = useState(readStoredSession)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [votePickerAwardId, setVotePickerAwardId] = useState('')
  const [votePickerCategoryId, setVotePickerCategoryId] = useState('')
  const [openResultCategoryId, setOpenResultCategoryId] = useState(null)
  const [nominationsFilter, setNominationsFilter] = useState({ awardId: '', categoryId: '', query: '' })
  const [myVotesQuery, setMyVotesQuery] = useState('')
  const [manageSubTab, setManageSubTab] = useState('accounts')
  const [manageEditing, setManageEditing] = useState(() => ({ ...emptyManageEditing }))
  const [adminFilters, setAdminFilters] = useState(() => ({ ...adminFiltersInitial }))

  const applyBootstrapData = (payload) => {
    setUsers(Array.isArray(payload?.users) ? payload.users : [])
    setPeople(Array.isArray(payload?.people) ? payload.people : [])
    setMovies(Array.isArray(payload?.movies) ? payload.movies : [])
    setMovieCrew(Array.isArray(payload?.movieCrew) ? payload.movieCrew : [])
    setAwards(Array.isArray(payload?.awards) ? payload.awards : [])
    setCategories(Array.isArray(payload?.categories) ? payload.categories : [])
    setAwardCategories(Array.isArray(payload?.awardCategories) ? payload.awardCategories : [])
    setNominations(Array.isArray(payload?.nominations) ? payload.nominations : [])
    setVotes(Array.isArray(payload?.votes) ? payload.votes : [])
  }

  // fetching data from our backend api
  const loadBootstrapData = async () => {
    const response = await fetch('/api/bootstrap')
    if (!response.ok) {
      throw new Error(`Bootstrap request failed (${response.status})`)
    }
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const body = await response.text()
      const preview = body.slice(0, 120).replace(/\s+/g, ' ').trim()
      throw new Error(`Bootstrap returned non-JSON response. ${preview}`)
    }
    const payload = await response.json()
    applyBootstrapData(payload)
  }

  const mergeAdminFilters = (updates) => {
    setAdminFilters((prev) => ({ ...prev, ...updates }))
  }

  const nextId = (items, key) => (items.length ? Math.max(...items.map((item) => item[key])) + 1 : 1)

  // memoized functions to look up names by id
  const personNameById = useMemo(
    () =>
      people.reduce((acc, person) => {
        acc[person.person_id] = `${person.first_name} ${person.last_name}`
        return acc
      }, {}),
    [people],
  )

  const movieTitleById = useMemo(
    () =>
      movies.reduce((acc, movie) => {
        acc[movie.movie_id] = movie.title
        return acc
      }, {}),
    [movies],
  )

  const categoryNameById = useMemo(
    () =>
      categories.reduce((acc, category) => {
        acc[category.category_id] = category.name
        return acc
      }, {}),
    [categories],
  )

  const categoryById = useMemo(
    () =>
      categories.reduce((acc, category) => {
        acc[category.category_id] = category
        return acc
      }, {}),
    [categories],
  )

  const awardNameById = useMemo(
    () =>
      awards.reduce((acc, award) => {
        acc[award.award_id] = award.name
        return acc
      }, {}),
    [awards],
  )

  const awardCategoryLabelById = useMemo(
    () =>
      awardCategories.reduce((acc, row) => {
        acc[row.award_category_id] = `${awardNameById[row.award_id] || 'Award'} - ${categoryNameById[row.category_id] || 'Category'}`
        return acc
      }, {}),
    [awardCategories, awardNameById, categoryNameById],
  )

  const nominationLabelById = useMemo(
    () =>
      nominations.reduce((acc, nomination) => {
        const movie = movieTitleById[nomination.movie_id] || 'Unknown Movie'
        const person = nomination.person_id != null ? personNameById[nomination.person_id] || 'Unknown Person' : null
        const group = awardCategoryLabelById[nomination.award_category_id] || 'Unknown voting slot'
        acc[nomination.nomination_id] = person ? `${person} as ${movie} (${group})` : `${movie} (${group})`
        return acc
      }, {}),
    [nominations, personNameById, movieTitleById, awardCategoryLabelById],
  )

  const nominationShortLabelById = useMemo(
    () =>
      nominations.reduce((acc, nomination) => {
        const movie = movieTitleById[nomination.movie_id] || 'Unknown Movie'
        const person = nomination.person_id != null ? personNameById[nomination.person_id] || 'Unknown Person' : null
        acc[nomination.nomination_id] = person ? `${person} as ${movie}` : movie
        return acc
      }, {}),
    [nominations, personNameById, movieTitleById],
  )

  const voteCountByNomination = useMemo(
    () =>
      votes.reduce((acc, vote) => {
        acc[vote.nomination_id] = (acc[vote.nomination_id] || 0) + 1
        return acc
      }, {}),
    [votes],
  )

  const isGuestSession = Boolean(session.guest && session.userId == null)
  const isLoggedIn = session.userId != null || isGuestSession
  const currentUser = useMemo(
    () => (session.userId != null ? users.find((user) => user.user_id === Number(session.userId)) || null : null),
    [users, session.userId],
  )
  const isAdmin = currentUser?.role === 'admin'
  const canVote = session.userId != null && currentUser != null && !isAdmin
  const userVoteCount = useMemo(
    () => (session.userId != null ? votes.filter((vote) => vote.user_id === Number(session.userId)).length : 0),
    [votes, session.userId],
  )

  const liveGroups = useMemo(() => {
    return awardCategories.map((group) => {
      const rows = nominations
        .filter((n) => n.award_category_id === group.award_category_id)
        .map((n) => ({
          nomination_id: n.nomination_id,
          label: nominationShortLabelById[n.nomination_id] || `Nomination ${n.nomination_id}`,
          votes: voteCountByNomination[n.nomination_id] || 0,
        }))
      const totalVotes = rows.reduce((sum, row) => sum + row.votes, 0)
      return {
        award_category_id: group.award_category_id,
        title: awardCategoryLabelById[group.award_category_id] || `Group ${group.award_category_id}`,
        totalVotes,
        rows: rows.sort((a, b) => b.votes - a.votes),
        start_time: group.start_time,
        end_time: group.end_time,
      }
    })
  }, [awardCategories, nominations, nominationShortLabelById, voteCountByNomination, awardCategoryLabelById])

  const awardCategoryById = useMemo(
    () =>
      awardCategories.reduce((acc, row) => {
        acc[row.award_category_id] = row
        return acc
      }, {}),
    [awardCategories],
  )

  const nominationById = useMemo(
    () =>
      nominations.reduce((acc, row) => {
        acc[row.nomination_id] = row
        return acc
      }, {}),
    [nominations],
  )

  const myVoteByAwardCategory = useMemo(() => {
    if (session.userId == null) return {}
    return votes.reduce((acc, vote) => {
      if (vote.user_id !== Number(session.userId)) return acc
      const nomination = nominationById[vote.nomination_id]
      const awardCategoryId = vote.award_category_id ?? nomination?.award_category_id
      if (awardCategoryId == null) return acc
      acc[awardCategoryId] = vote.nomination_id
      return acc
    }, {})
  }, [votes, session.userId, nominationById])

  const nominationStandingsRows = useMemo(
    () =>
      liveGroups.flatMap((group) =>
        group.rows.map((row, index) => {
          const nomination = nominationById[row.nomination_id]
          const person = nomination && nomination.person_id != null ? personNameById[nomination.person_id] || `Person ${nomination.person_id}` : null
          const movie = nomination ? movieTitleById[nomination.movie_id] || `Movie ${nomination.movie_id}` : 'Unknown Movie'
          return {
            nomination_id: row.nomination_id,
            person_id: nomination?.person_id ?? null,
            movie_id: nomination?.movie_id ?? null,
            person,
            movie,
            awardCategory: group.title,
            place: index + 1,
            votes: row.votes,
          }
        }),
      ),
    [liveGroups, nominationById, personNameById, movieTitleById],
  )

  const nominationCategoryOptionsForFilter = useMemo(() => {
    const aid = Number(nominationsFilter.awardId)
    if (!aid) return []
    const seen = new Set()
    const opts = []
    for (const ac of awardCategories) {
      if (ac.award_id !== aid) continue
      if (seen.has(ac.category_id)) continue
      seen.add(ac.category_id)
      opts.push({
        category_id: ac.category_id,
        label: categoryNameById[ac.category_id] || `Category ${ac.category_id}`,
      })
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  }, [nominationsFilter.awardId, awardCategories, categoryNameById])

  const filteredNominationStandings = useMemo(() => {
    let list = nominationStandingsRows
    const aid = Number(nominationsFilter.awardId)
    const cid = Number(nominationsFilter.categoryId)
    if (aid || cid) {
      const allowed = new Set(
        awardCategories
          .filter((ac) => (!aid || ac.award_id === aid) && (!cid || ac.category_id === cid))
          .map((ac) => ac.award_category_id),
      )
      list = list.filter((row) => {
        const nomination = nominationById[row.nomination_id]
        return nomination ? allowed.has(nomination.award_category_id) : false
      })
    }
    const q = nominationsFilter.query.trim().toLowerCase()
    if (q) {
      list = list.filter((row) => `${row.person || ''} ${row.movie} ${row.awardCategory}`.toLowerCase().includes(q))
    }
    return list
  }, [nominationStandingsRows, nominationsFilter.awardId, nominationsFilter.categoryId, nominationsFilter.query, awardCategories, nominationById])

  const userVotesDetailed = useMemo(() => {
    if (session.userId == null) return []
    return votes
      .filter((vote) => vote.user_id === Number(session.userId))
      .map((vote) => {
        const nomination = nominationById[vote.nomination_id]
        const slot = nomination ? awardCategoryById[nomination.award_category_id] : null
        const startMs = slot?.start_time ? new Date(slot.start_time).getTime() : Number.NEGATIVE_INFINITY
        const endMs = slot?.end_time ? new Date(slot.end_time).getTime() : Number.POSITIVE_INFINITY
        const now = Date.now()
        const canRevoke = Boolean(slot && now >= startMs && now <= endMs)
        return {
          ...vote,
          nominationLabel: nominationLabelById[vote.nomination_id] || 'Unknown nomination',
          awardCategoryLabel: nomination ? awardCategoryLabelById[nomination.award_category_id] || 'Unknown slot' : 'Unknown slot',
          canRevoke,
        }
      })
      .sort((a, b) => new Date(b.cast_at).getTime() - new Date(a.cast_at).getTime())
  }, [votes, session.userId, nominationById, awardCategoryById, nominationLabelById, awardCategoryLabelById])

  const filteredUserVotesDetailed = useMemo(() => {
    const q = myVotesQuery.trim().toLowerCase()
    if (!q) return userVotesDetailed
    return userVotesDetailed.filter((vote) => `${vote.nominationLabel} ${vote.awardCategoryLabel}`.toLowerCase().includes(q))
  }, [userVotesDetailed, myVotesQuery])

  const nominationCategoriesForAward = useMemo(() => {
    const aid = Number(forms.nomination.award_id)
    if (!aid) return []
    const seen = new Set()
    const opts = []
    for (const ac of awardCategories) {
      if (ac.award_id !== aid) continue
      if (seen.has(ac.category_id)) continue
      seen.add(ac.category_id)
      opts.push({
        category_id: ac.category_id,
        label: categoryNameById[ac.category_id] || `Category ${ac.category_id}`,
      })
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  }, [awardCategories, forms.nomination.award_id, categoryNameById])

  const selectedNominationCategoryType = useMemo(() => {
    const cid = Number(forms.nomination.category_id)
    if (!cid) return null
    return categoryById[cid]?.nominee_type || null
  }, [forms.nomination.category_id, categoryById])

  const nominationPeopleForSelectedMovie = useMemo(() => {
    const movieId = Number(forms.nomination.movie_id)
    if (!movieId) return []
    if (selectedNominationCategoryType === 'MOVIE') return []
    const requiredRole =
      selectedNominationCategoryType && selectedNominationCategoryType !== 'ANY_CREW'
        ? selectedNominationCategoryType.toLowerCase()
        : null
    const personIds = new Set(
      movieCrew
        .filter((crew) => crew.movie_id === movieId && (!requiredRole || crew.role === requiredRole))
        .map((crew) => crew.person_id),
    )
    return people.filter((person) => personIds.has(person.person_id))
  }, [forms.nomination.movie_id, movieCrew, people, selectedNominationCategoryType])

  /** Categories not yet linked to the selected award (for creating new award–category rows). */
  const categoriesAvailableForAwardCategory = useMemo(() => {
    const aid = Number(forms.awardCategory.award_id)
    if (!aid) return []
    const editingAcId = manageEditing.awardCategory
    const linked = new Set(
      awardCategories
        .filter((ac) => ac.award_id === aid && ac.award_category_id !== editingAcId)
        .map((ac) => ac.category_id),
    )
    return categories
      .filter((c) => !linked.has(c.category_id))
      .map((c) => ({ category_id: c.category_id, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [awardCategories, forms.awardCategory.award_id, categories, manageEditing.awardCategory])

  const voteCategoriesForAward = useMemo(() => {
    const aid = Number(votePickerAwardId)
    if (!aid) return []
    const seen = new Set()
    const opts = []
    for (const ac of awardCategories) {
      if (ac.award_id !== aid) continue
      if (seen.has(ac.category_id)) continue
      seen.add(ac.category_id)
      opts.push({
        category_id: ac.category_id,
        label: categoryNameById[ac.category_id] || `Category ${ac.category_id}`,
      })
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  }, [awardCategories, votePickerAwardId, categoryNameById])

  const voteSlotAwardCategoryId = useMemo(() => {
    const aid = Number(votePickerAwardId)
    const cid = Number(votePickerCategoryId)
    if (!aid || !cid) return null
    const slot = awardCategories.find((ac) => ac.award_id === aid && ac.category_id === cid)
    return slot ? slot.award_category_id : null
  }, [votePickerAwardId, votePickerCategoryId, awardCategories])

  const voteAwardOptions = useMemo(() => {
    const nameById = new Map(awards.map((a) => [a.award_id, a.name]))
    const seen = new Set()
    const list = []
    for (const ac of awardCategories) {
      if (seen.has(ac.award_id)) continue
      seen.add(ac.award_id)
      list.push({
        award_id: ac.award_id,
        name: nameById.get(ac.award_id) || `Award #${ac.award_id}`,
      })
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [awards, awardCategories])

  const adminAcCatsForAwardFilter = useMemo(() => {
    const aid = Number(adminFilters.acAwardId)
    if (!aid) return []
    const seen = new Set()
    const opts = []
    for (const ac of awardCategories) {
      if (ac.award_id !== aid) continue
      if (seen.has(ac.category_id)) continue
      seen.add(ac.category_id)
      opts.push({
        category_id: ac.category_id,
        label: categoryNameById[ac.category_id] || `Category ${ac.category_id}`,
      })
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  }, [awardCategories, adminFilters.acAwardId, categoryNameById])

  const adminNomCatsForAwardFilter = useMemo(() => {
    const aid = Number(adminFilters.nomAwardId)
    if (!aid) return []
    const seen = new Set()
    const opts = []
    for (const ac of awardCategories) {
      if (ac.award_id !== aid) continue
      if (seen.has(ac.category_id)) continue
      seen.add(ac.category_id)
      opts.push({
        category_id: ac.category_id,
        label: categoryNameById[ac.category_id] || `Category ${ac.category_id}`,
      })
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  }, [awardCategories, adminFilters.nomAwardId, categoryNameById])

  const filteredAdminUsers = useMemo(() => {
    let list = users
    if (adminFilters.userRole) list = list.filter((u) => u.role === adminFilters.userRole)
    const q = adminFilters.userQuery.trim().toLowerCase()
    if (q) list = list.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q))
    return list
  }, [users, adminFilters.userRole, adminFilters.userQuery])

  const filteredAdminPeople = useMemo(() => {
    let list = people
    const q = adminFilters.personQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q))
    }
    const n = adminFilters.personNation.trim().toLowerCase()
    if (n) list = list.filter((p) => (p.nationality || '').toLowerCase().includes(n))
    return list
  }, [people, adminFilters.personQuery, adminFilters.personNation])

  const filteredAdminMovies = useMemo(() => {
    let list = movies
    const q = adminFilters.movieQuery.trim().toLowerCase()
    if (q) list = list.filter((m) => m.title.toLowerCase().includes(q))
    return list
  }, [movies, adminFilters.movieQuery])

  const filteredAdminCrew = useMemo(() => {
    let list = movieCrew
    const mid = Number(adminFilters.crewMovieId)
    if (mid) list = list.filter((r) => r.movie_id === mid)
    if (adminFilters.crewRole) list = list.filter((r) => r.role === adminFilters.crewRole)
    const q = adminFilters.crewPersonQuery.trim().toLowerCase()
    if (q) list = list.filter((r) => (personNameById[r.person_id] || '').toLowerCase().includes(q))
    return list
  }, [movieCrew, adminFilters.crewMovieId, adminFilters.crewRole, adminFilters.crewPersonQuery, personNameById])

  const filteredAdminAwards = useMemo(() => {
    let list = awards
    const q = adminFilters.awardSearch.trim().toLowerCase()
    if (q) list = list.filter((a) => (a.name || '').toLowerCase().includes(q))
    const y = adminFilters.awardYear.trim()
    if (y !== '') {
      const num = Number(y)
      list = Number.isFinite(num) ? list.filter((a) => Number(a.year) === num) : []
    }
    return list
  }, [awards, adminFilters.awardSearch, adminFilters.awardYear])

  const filteredAdminCategories = useMemo(() => {
    let list = categories
    const q = adminFilters.categorySearch.trim().toLowerCase()
    if (q) list = list.filter((c) => (c.name || '').toLowerCase().includes(q))
    return list
  }, [categories, adminFilters.categorySearch])

  const filteredAdminAwardCats = useMemo(() => {
    let list = awardCategories
    const aid = Number(adminFilters.acAwardId)
    const cid = Number(adminFilters.acCategoryId)
    if (aid) list = list.filter((ac) => ac.award_id === aid)
    if (cid) list = list.filter((ac) => ac.category_id === cid)
    return list
  }, [awardCategories, adminFilters.acAwardId, adminFilters.acCategoryId])

  const filteredAdminNominations = useMemo(() => {
    let list = nominations
    const aid = Number(adminFilters.nomAwardId)
    const cid = Number(adminFilters.nomCategoryId)
    if (aid || cid) {
      const slotIds = new Set(
        awardCategories
          .filter((ac) => (!aid || ac.award_id === aid) && (!cid || ac.category_id === cid))
          .map((ac) => ac.award_category_id),
      )
      list = list.filter((n) => slotIds.has(n.award_category_id))
    }
    const mid = Number(adminFilters.nomMovieId)
    if (mid) list = list.filter((n) => n.movie_id === mid)
    const pq = adminFilters.nomPersonQuery.trim().toLowerCase()
    if (pq) list = list.filter((n) => (personNameById[n.person_id] || '').toLowerCase().includes(pq))
    return list
  }, [nominations, awardCategories, adminFilters.nomAwardId, adminFilters.nomCategoryId, adminFilters.nomMovieId, adminFilters.nomPersonQuery, personNameById])

  // loading data when the component first mounts
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setBootstrapLoading(true)
      setBootstrapError('')
      try {
        await loadBootstrapData()
      } catch (error) {
        if (!cancelled) {
          setBootstrapError(error instanceof Error ? error.message : 'Unable to load data from backend.')
        }
      } finally {
        if (!cancelled) {
          setBootstrapLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (awardCategories.length === 0) return
    const aid = Number(votePickerAwardId)
    const cid = Number(votePickerCategoryId)
    const slotsForAward = aid ? awardCategories.filter((ac) => ac.award_id === aid) : []
    const awardOk = slotsForAward.length > 0
    if (awardOk) {
      const pairOk = Boolean(cid && slotsForAward.some((ac) => ac.category_id === cid))
      if (pairOk) return
      setVotePickerCategoryId(String(slotsForAward[0].category_id))
      return
    }
    const ac0 = awardCategories[0]
    setVotePickerAwardId(String(ac0.award_id))
    setVotePickerCategoryId(String(ac0.category_id))
  }, [awardCategories, votePickerAwardId, votePickerCategoryId])

  useEffect(() => {
    if (liveGroups.length === 0) return
    setOpenResultCategoryId((prev) => {
      if (prev != null && liveGroups.some((g) => g.award_category_id === prev)) return prev
      return firstOpenLeaderboardCategoryId(liveGroups, Date.now())
    })
  }, [liveGroups])

  useEffect(() => {
    if (!forms.nomination.person_id) return
    const selectedPersonId = Number(forms.nomination.person_id)
    if (!nominationPeopleForSelectedMovie.some((person) => person.person_id === selectedPersonId)) {
      updateForm('nomination', 'person_id', '')
    }
  }, [forms.nomination.person_id, nominationPeopleForSelectedMovie])

  useEffect(() => {
    persistSession(session)
  }, [session])

  useEffect(() => {
    if (isGuestSession && activeSection === 'vote') setActiveSection('dashboard')
  }, [isGuestSession, activeSection])

  useEffect(() => {
    if (isAdmin && activeSection === 'vote') setActiveSection('dashboard')
  }, [isAdmin, activeSection])

  useEffect(() => {
    if ((isGuestSession || isAdmin) && activeSection === 'myVotes') setActiveSection('dashboard')
  }, [isGuestSession, isAdmin, activeSection])

  useEffect(() => {
    setAdminFilters({ ...adminFiltersInitial })
  }, [manageSubTab])

  const updateForm = (name, key, value) => {
    setForms((prev) => ({ ...prev, [name]: { ...prev[name], [key]: value } }))
  }

  const resetForm = (name) => setForms((prev) => ({ ...prev, [name]: emptyForms[name] }))

  const cancelManageEdit = (key) => {
    resetForm(key)
    setManageEditing((prev) => ({ ...prev, [key]: null }))
  }

  const wipeVotesForNominations = (nominationIds) => {
    const idSet = new Set(nominationIds)
    setVotes((prev) => prev.filter((v) => !idSet.has(v.nomination_id)))
  }

  const submitUser = async (e) => {
    e.preventDefault()
    const email = forms.user.email.trim()
    if (!forms.user.name || !email) return
    const editingId = manageEditing.user
    if (!editingId && !forms.user.password) return
    if (
      users.some(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() && u.user_id !== editingId,
      )
    ) {
      window.alert('User with this email already exists.')
      return
    }

    try {
      const endpoint = editingId != null ? `/api/users/${editingId}` : '/api/users'
      const method = editingId != null ? 'PUT' : 'POST'
      const prev = editingId != null ? users.find((u) => u.user_id === editingId) : null
      const password =
        forms.user.password && forms.user.password.length > 0
          ? forms.user.password
          : prev?.password || ''

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: forms.user.name,
          email,
          password,
          role: forms.user.role,
        }),
      })

      if (!response.ok) throw new Error(`User save failed (${response.status})`)
      const payload = await response.json()
      const savedUser = payload?.result

      if (editingId != null) {
        setUsers((prevList) =>
          prevList.map((u) => (u.user_id === editingId ? { ...u, ...savedUser } : u)),
        )
      } else {
        setUsers((prev) => [...prev, savedUser])
      }
      cancelManageEdit('user')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save user.')
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Remove this user? Their votes will be deleted.')) return
    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`Delete user failed (${response.status})`)

      if (session.userId === userId) setSession({ userId: null, guest: false })
      setVotes((prev) => prev.filter((v) => v.user_id !== userId))
      setUsers((prev) => prev.filter((u) => u.user_id !== userId))
      if (manageEditing.user === userId) cancelManageEdit('user')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to delete user.')
    }
  }

  // adding or updating a person in the db
  const submitPerson = async (e) => {
    e.preventDefault()
    if (!forms.person.first_name || !forms.person.last_name) return
    const editingId = manageEditing.person
    try {
      const endpoint = editingId != null ? `/api/people/${editingId}` : '/api/people'
      const method = editingId != null ? 'PUT' : 'POST'
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forms.person),
      })
      if (!response.ok) throw new Error(`Person save failed (${response.status})`)
      const payload = await response.json()
      const savedPerson = payload?.result

      if (editingId != null) {
        setPeople((prev) =>
          prev.map((p) => (p.person_id === editingId ? { ...p, ...savedPerson } : p)),
        )
      } else {
        setPeople((prev) => [...prev, savedPerson])
      }
      cancelManageEdit('person')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save person.')
    }
  }

  const deletePerson = async (personId) => {
    if (!window.confirm('Remove this person? Related crew rows and nominations will be removed.')) return
    try {
      const response = await fetch(`/api/people/${personId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`Delete person failed (${response.status})`)

      const nominationIds = nominations.filter((n) => n.person_id === personId).map((n) => n.nomination_id)
      wipeVotesForNominations(nominationIds)
      setNominations((prev) => prev.filter((n) => n.person_id !== personId))
      setMovieCrew((prev) => prev.filter((r) => r.person_id !== personId))
      setPeople((prev) => prev.filter((p) => p.person_id !== personId))
      if (manageEditing.person === personId) cancelManageEdit('person')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to delete person.')
    }
  }

  // saving movie details
  const submitMovie = async (e) => {
    e.preventDefault()
    if (!forms.movie.title) return
    const editingId = manageEditing.movie
    try {
      const endpoint = editingId != null ? `/api/movies/${editingId}` : '/api/movies'
      const method = editingId != null ? 'PUT' : 'POST'
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: forms.movie.title,
          description: forms.movie.description,
          release_year: Number(forms.movie.release_year || 0),
          duration: Number(forms.movie.duration || 0),
        }),
      })
      if (!response.ok) throw new Error(`Movie save failed (${response.status})`)
      const payload = await response.json()
      const savedMovie = payload?.result

      if (editingId != null) {
        setMovies((prev) =>
          prev.map((m) => (m.movie_id === editingId ? { ...m, ...savedMovie } : m)),
        )
      } else {
        setMovies((prev) => [...prev, savedMovie])
      }
      cancelManageEdit('movie')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save movie.')
    }
  }

  const deleteMovie = async (movieId) => {
    if (!window.confirm('Remove this movie? Crew links and nominations tied to it will be removed.')) return
    try {
      const response = await fetch(`/api/movies/${movieId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`Delete movie failed (${response.status})`)

      const nominationIds = nominations.filter((n) => n.movie_id === movieId).map((n) => n.nomination_id)
      wipeVotesForNominations(nominationIds)
      setNominations((prev) => prev.filter((n) => n.movie_id !== movieId))
      setMovieCrew((prev) => prev.filter((r) => r.movie_id !== movieId))
      setMovies((prev) => prev.filter((m) => m.movie_id !== movieId))
      if (manageEditing.movie === movieId) cancelManageEdit('movie')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to delete movie.')
    }
  }

  // link a person to a movie as crew
  const submitMovieCrew = async (e) => {
    e.preventDefault()
    if (!forms.movieCrew.movie_id || !forms.movieCrew.person_id) return
    const editingId = manageEditing.movieCrew
    const row = {
      movie_id: Number(forms.movieCrew.movie_id),
      person_id: Number(forms.movieCrew.person_id),
      role: forms.movieCrew.role,
      character_name: forms.movieCrew.character_name,
    }
    try {
      const response = await fetch('/api/movie-crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      })
      if (!response.ok) throw new Error(`Movie crew save failed (${response.status})`)
      const payload = await response.json()
      const savedRow = payload?.result

      if (editingId != null) {
        setMovieCrew((prev) =>
          prev.map((r) => (r.crew_id === editingId ? { ...r, ...savedRow, crew_id: editingId } : r)),
        )
      } else {
        setMovieCrew((prev) => [...prev, { ...savedRow, crew_id: nextId(prev, 'crew_id') }])
      }
      cancelManageEdit('movieCrew')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save movie crew.')
    }
  }

  const deleteMovieCrew = async (crewId) => {
    if (!window.confirm('Remove this crew credit?')) return
    const target = movieCrew.find((r) => r.crew_id === crewId)
    if (!target) return
    try {
      const response = await fetch('/api/movie-crew', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie_id: target.movie_id,
          person_id: target.person_id,
          role: target.role,
        }),
      })
      if (!response.ok) throw new Error(`Delete movie crew failed (${response.status})`)

      setMovieCrew((prev) => prev.filter((r) => r.crew_id !== crewId))
      if (manageEditing.movieCrew === crewId) cancelManageEdit('movieCrew')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to delete movie crew.')
    }
  }

  // adding a new award like 'Oscars 2024'
  const submitAward = async (e) => {
    e.preventDefault()
    if (!forms.award.name) return
    const editingId = manageEditing.award
    try {
      const endpoint = editingId != null ? `/api/awards/${editingId}` : '/api/awards'
      const method = editingId != null ? 'PUT' : 'POST'
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: forms.award.name,
          year: Number(forms.award.year || 0),
          description: forms.award.description,
        }),
      })
      if (!response.ok) throw new Error(`Award save failed (${response.status})`)
      const payload = await response.json()
      const savedAward = payload?.result

      if (editingId != null) {
        setAwards((prev) =>
          prev.map((a) => (a.award_id === editingId ? { ...a, ...savedAward } : a)),
        )
      } else {
        setAwards((prev) => [...prev, savedAward])
      }
      cancelManageEdit('award')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save award.')
    }
  }

  const deleteAward = async (awardId) => {
    if (!window.confirm('Remove this award? Linked voting slots and their nominations/votes go too.')) return
    try {
      const response = await fetch(`/api/awards/${awardId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`Delete award failed (${response.status})`)

      const acIds = awardCategories.filter((ac) => ac.award_id === awardId).map((ac) => ac.award_category_id)
      const nominationIds = nominations.filter((n) => acIds.includes(n.award_category_id)).map((n) => n.nomination_id)
      wipeVotesForNominations(nominationIds)
      setNominations((prev) => prev.filter((n) => !acIds.includes(n.award_category_id)))
      setAwardCategories((prev) => prev.filter((ac) => ac.award_id !== awardId))
      setAwards((prev) => prev.filter((a) => a.award_id !== awardId))
      if (manageEditing.award === awardId) cancelManageEdit('award')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to delete award.')
    }
  }

  // creating category like 'Best Actor'
  const submitCategory = async (e) => {
    e.preventDefault()
    if (!forms.category.name) return
    const editingId = manageEditing.category
    try {
      const endpoint = editingId != null ? `/api/categories/${editingId}` : '/api/categories'
      const method = editingId != null ? 'PUT' : 'POST'
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: forms.category.name.trim(),
          nominee_type: forms.category.nominee_type || 'ANY_CREW',
        }),
      })
      if (!response.ok) {
        let message = `${editingId != null ? 'Update' : 'Create'} category failed (${response.status})`
        try {
          const payload = await response.json()
          if (payload?.message) message = payload.message
        } catch {
          // ignore JSON parse errors and keep generic status message
        }
        throw new Error(message)
      }
      const payload = await response.json()
      const savedCategory = payload?.result
      if (!savedCategory) throw new Error('Category API returned an empty result.')
      if (editingId != null) {
        setCategories((prev) =>
          prev.map((c) => (c.category_id === editingId ? { ...c, ...savedCategory } : c)),
        )
      } else {
        setCategories((prev) => [...prev, savedCategory])
      }
      cancelManageEdit('category')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save category right now.')
    }
  }

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Remove this category? Linked voting slots and nominations are removed.')) return
    try {
      const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' })
      if (!response.ok) {
        let message = `Delete category failed (${response.status})`
        try {
          const payload = await response.json()
          if (payload?.message) message = payload.message
        } catch {
          // ignore JSON parse errors and keep generic status message
        }
        throw new Error(message)
      }
      const acIds = awardCategories.filter((ac) => ac.category_id === categoryId).map((ac) => ac.award_category_id)
      const nominationIds = nominations.filter((n) => acIds.includes(n.award_category_id)).map((n) => n.nomination_id)
      wipeVotesForNominations(nominationIds)
      setNominations((prev) => prev.filter((n) => !acIds.includes(n.award_category_id)))
      setAwardCategories((prev) => prev.filter((ac) => ac.category_id !== categoryId))
      setCategories((prev) => prev.filter((c) => c.category_id !== categoryId))
      if (manageEditing.category === categoryId) cancelManageEdit('category')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to delete category right now.')
    }
  }

  const submitAwardCategory = async (e) => {
    e.preventDefault()
    if (!forms.awardCategory.award_id || !forms.awardCategory.category_id) return
    const aid = Number(forms.awardCategory.award_id)
    const cid = Number(forms.awardCategory.category_id)
    const editingId = manageEditing.awardCategory
    if (
      awardCategories.some(
        (ac) => ac.award_id === aid && ac.category_id === cid && ac.award_category_id !== editingId,
      )
    ) {
      window.alert('This award/category combination already exists.')
      return
    }

    try {
      const endpoint = editingId != null ? `/api/award-categories/${editingId}` : '/api/award-categories'
      const method = editingId != null ? 'PUT' : 'POST'
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          award_id: aid,
          category_id: cid,
          start_time: forms.awardCategory.start_time,
          end_time: forms.awardCategory.end_time,
        }),
      })
      if (!response.ok) throw new Error(`Award category save failed (${response.status})`)
      const payload = await response.json()
      const savedAc = payload?.result

      if (editingId != null) {
        setAwardCategories((prev) =>
          prev.map((ac) => (ac.award_category_id === editingId ? { ...ac, ...savedAc } : ac)),
        )
      } else {
        setAwardCategories((prev) => [...prev, savedAc])
      }
      cancelManageEdit('awardCategory')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save voting slot.')
    }
  }

  const deleteAwardCategoryRow = async (acId) => {
    if (!window.confirm('Remove this voting slot? Its nominations and votes will be deleted.')) return
    try {
      const response = await fetch(`/api/award-categories/${acId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`Delete voting slot failed (${response.status})`)

      const nominationIds = nominations.filter((n) => n.award_category_id === acId).map((n) => n.nomination_id)
      wipeVotesForNominations(nominationIds)
      setNominations((prev) => prev.filter((n) => n.award_category_id !== acId))
      setAwardCategories((prev) => prev.filter((ac) => ac.award_category_id !== acId))
      if (manageEditing.awardCategory === acId) cancelManageEdit('awardCategory')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to delete voting slot.')
    }
  }

  // saving a nomination for a movie/person
  const submitNomination = async (e) => {
    e.preventDefault()
    const aid = Number(forms.nomination.award_id)
    const cid = Number(forms.nomination.category_id)
    const slot = awardCategories.find((ac) => ac.award_id === aid && ac.category_id === cid)
    if (!slot || !forms.nomination.movie_id) return
    const editingId = manageEditing.nomination
    const movieId = Number(forms.nomination.movie_id)
    const hasPerson = forms.nomination.person_id !== ''
    const personId = selectedNominationCategoryType === 'MOVIE' ? null : hasPerson ? Number(forms.nomination.person_id) : null
    if (selectedNominationCategoryType !== 'MOVIE' && personId == null) {
      window.alert('This category requires selecting a crew member nominee.')
      return
    }
    if (!nominationPeopleForSelectedMovie.some((person) => person.person_id === personId) && personId != null) {
      window.alert('Selected person is not in the selected movie crew.')
      return
    }
    try {
      const endpoint = editingId != null ? `/api/nominations/${editingId}` : '/api/nominations'
      const method = editingId != null ? 'PUT' : 'POST'
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          award_category_id: slot.award_category_id,
          movie_id: movieId,
          person_id: personId,
        }),
      })
      if (!response.ok) {
        let message = `${editingId != null ? 'Update' : 'Create'} nomination failed (${response.status})`
        try {
          const payload = await response.json()
          if (payload?.message) message = payload.message
        } catch {
          // ignore JSON parse errors and keep generic status message
        }
        throw new Error(message)
      }
      const payload = await response.json()
      const savedNomination = payload?.result
      if (!savedNomination) throw new Error('Nomination API returned an empty result.')
      if (editingId != null) {
        setNominations((prev) =>
          prev.map((n) => (n.nomination_id === editingId ? { ...n, ...savedNomination } : n)),
        )
      } else {
        setNominations((prev) => [...prev, savedNomination])
      }
      cancelManageEdit('nomination')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save nomination right now.')
    }
  }

  const deleteNomination = async (nominationId) => {
    if (!window.confirm('Remove this nomination? Votes for it will be deleted.')) return
    try {
      const response = await fetch(`/api/nominations/${nominationId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        let message = `Delete nomination failed (${response.status})`
        try {
          const payload = await response.json()
          if (payload?.message) message = payload.message
        } catch {
          // ignore JSON parse errors and keep generic status message
        }
        throw new Error(message)
      }
      setVotes((prev) => prev.filter((v) => v.nomination_id !== nominationId))
      setNominations((prev) => prev.filter((n) => n.nomination_id !== nominationId))
      if (manageEditing.nomination === nominationId) cancelManageEdit('nomination')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to delete nomination right now.')
    }
  }

  // function for voters to pick their choice
  const castVoteForNomination = async (nominationId) => {
    if (!canVote || !session.userId || !nominationId) return
    const nomination = nominationById[nominationId]
    if (!nomination) return
    try {
      const response = await fetch('/api/votes/cast-safe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jury_id: Number(session.userId),
          nomination_id: Number(nominationId),
          award_category_id: Number(nomination.award_category_id),
        }),
      })
      if (!response.ok) {
        let message = `Vote request failed (${response.status})`
        try {
          const payload = await response.json()
          if (payload?.message) message = payload.message
        } catch {
          // ignore JSON parse errors and keep generic status message
        }
        throw new Error(message)
      }
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const body = await response.text()
        const preview = body.slice(0, 120).replace(/\s+/g, ' ').trim()
        throw new Error(`Vote API returned non-JSON response. ${preview}`)
      }
      const payload = await response.json()
      const latestVote = payload?.result
      if (latestVote && latestVote.id != null) {
        const nextVote = {
          vote_id: Number(latestVote.id),
          user_id: Number(latestVote.jury_id),
          nomination_id: Number(latestVote.nomination_id),
          award_category_id: Number(latestVote.award_category_id),
          cast_at: latestVote.cast_at || new Date().toISOString(),
        }
        setVotes((prev) => {
          if (prev.some((vote) => vote.vote_id === nextVote.vote_id)) return prev
          return [...prev, nextVote]
        })
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to cast vote right now.')
    }
  }

  const revokeVote = async (voteId) => {
    if (!session.userId || !voteId) return
    try {
      const response = await fetch('/api/votes/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jury_id: Number(session.userId),
          vote_id: Number(voteId),
        }),
      })
      if (!response.ok) {
        let message = `Vote revoke failed (${response.status})`
        try {
          const payload = await response.json()
          if (payload?.message) message = payload.message
        } catch {
          // ignore JSON parse errors and keep generic status message
        }
        throw new Error(message)
      }
      setVotes((prev) => prev.filter((vote) => vote.vote_id !== voteId))
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to revoke vote right now.')
    }
  }

  const updateAuthForm = (key, value) => {
    setAuthForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleLogin = (e) => {
    // simple check for login
    e.preventDefault()
    const matched = users.find(
      (user) =>
        user.email.toLowerCase() === authForm.email.trim().toLowerCase() &&
        user.password === authForm.password,
    )

    if (!matched) {
      setAuthError('Invalid email/password. Please try again.')
      return
    }

    setSession({ userId: matched.user_id, guest: false })
    setAuthError('')
    setAuthForm({ name: '', email: '', password: '' })
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!authForm.name || !authForm.email || !authForm.password) {
      setAuthError('Please fill all sign up fields.')
      return
    }

    if (users.some((user) => user.email.toLowerCase() === authForm.email.trim().toLowerCase())) {
      setAuthError('User with this email already exists.')
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authForm.name.trim(),
          email: authForm.email.trim(),
          password: authForm.password,
          role: 'voter',
        }),
      })

      if (!response.ok) throw new Error(`Sign up failed (${response.status})`)
      const payload = await response.json()
      const newUser = payload?.result

      setUsers((prev) => [...prev, newUser])
      setSession({ userId: newUser.user_id, guest: false })
      setAuthError('')
      setAuthForm({ name: '', email: '', password: '' })
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign up.')
    }
  }

  const continueAsGuest = () => {
    setSession({ userId: null, guest: true })
    setAuthError('')
    setAuthForm({ name: '', email: '', password: '' })
    setActiveSection('results')
  }

  const logout = () => {
    setSession({ userId: null, guest: false })
    setActiveSection('dashboard')
    setAuthMode('login')
  }

  if (bootstrapLoading) {
    return (
      <div className="app auth-layout">
        <section className="panel auth-panel">
          <h2>Loading database data...</h2>
          <p className="hint">Please wait while the app syncs with MySQL.</p>
        </section>
      </div>
    )
  }

  if (bootstrapError) {
    return (
      <div className="app auth-layout">
        <section className="panel auth-panel">
          <h2>Could not load database data</h2>
          <p className="hint">{bootstrapError}</p>
          <button
            type="button"
            className="switch-auth"
            onClick={() => {
              setBootstrapError('')
              setBootstrapLoading(true)
              loadBootstrapData()
                .catch((error) => {
                  setBootstrapError(error instanceof Error ? error.message : 'Unable to load data from backend.')
                })
                .finally(() => setBootstrapLoading(false))
            }}
          >
            Retry
          </button>
        </section>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="app auth-layout">
        <header className="header">
          <div>
            <h1>VoteFlix</h1>
            <p>Welcome to VoteFlix.</p>
          </div>
        </header>
        <section className="panel auth-panel">
          {/* login or signup title */}
          <h2>{authMode === 'login' ? 'Login' : 'Create Account'}</h2>
          <form className="form" onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
            {authMode === 'signup' && (
              <input
                placeholder="Full name"
                value={authForm.name}
                onChange={(e) => updateAuthForm('name', e.target.value)}
              />
            )}
            <input
              type="email"
              placeholder="Email ID"
              value={authForm.email}
              onChange={(e) => updateAuthForm('email', e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => updateAuthForm('password', e.target.value)}
            />
            <button type="submit">{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
          </form>
          {authError && <p className="hint">{authError}</p>}
          <button
            type="button"
            className="switch-auth"
            onClick={() => {
              setAuthMode((prev) => (prev === 'login' ? 'signup' : 'login'))
              setAuthError('')
            }}
          >
            {authMode === 'login' ? 'New user? Create account' : 'Already registered? Login'}
          </button>
          <div className="auth-divider" aria-hidden="true" />
          <button type="button" className="guest-btn" onClick={continueAsGuest}>
            Continue as guest
          </button>
        </section>
      </div>
    )
  }

  const resultsNow = Date.now()
  const { active: resultsActiveGroups, past: resultsPastGroups } = partitionLeaderboardGroups(liveGroups, resultsNow)

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>VoteFlix</h1>
          <p>Golden stage for the biggest movie-night votes.</p>
        </div>
        <div className="user-strip">
          <span>
            {isGuestSession ? (
              <>Viewing as <strong className="guest-badge">Guest</strong></>
            ) : (
              <>Signed in as {currentUser.name} ({currentUser.role})</>
            )}
          </span>
          <button type="button" className="logout-btn" onClick={logout}>
            {isGuestSession ? 'Leave' : 'Logout'}
          </button>
        </div>
      </header>

      <section className="hero-banner">
        <h2>Lights. Camera. Vote.</h2>
        <p>
          {isGuestSession
            ? 'Explore nominations and standings.'
            : 'Vote for your favorite stars and movies in this fan-powered Oscars ballot.'}
        </p>
      </section>

      {/* navigation menu at the top */}
      <nav className="tabs">
        <button className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}>Dashboard</button>
        <button className={activeSection === 'nominations' ? 'active' : ''} onClick={() => setActiveSection('nominations')}>Nominations</button>
        {!isGuestSession && !isAdmin && (
          <button className={activeSection === 'vote' ? 'active' : ''} onClick={() => setActiveSection('vote')}>Cast Vote</button>
        )}
        {!isGuestSession && !isAdmin && (
          <button className={activeSection === 'myVotes' ? 'active' : ''} onClick={() => setActiveSection('myVotes')}>My Votes</button>
        )}
        {isAdmin && (
          <button className={activeSection === 'manage' ? 'active' : ''} onClick={() => setActiveSection('manage')}>Manage Data</button>
        )}
        <button className={activeSection === 'results' ? 'active' : ''} onClick={() => setActiveSection('results')}>Results</button>
      </nav>

      {activeSection === 'dashboard' && (
        <section className="panel">
          <h2>Overview</h2>
          <div className="stats-grid">
            <StatCard label="Nominees" value={nominations.length} />
            <StatCard label="Movies In Race" value={movies.length} />
            <StatCard
              label="Your votes"
              value={isGuestSession ? '—' : userVoteCount}
              hint={undefined}
            />
            <StatCard label="Total Votes" value={votes.length} />
          </div>
          <h3>Latest Public Votes</h3>
          <ul className="compact-list">
            {votes.slice(-5).reverse().map((vote) => (
              <li key={vote.vote_id}>
                <span>#{vote.vote_id}</span>
                <span>{users.find((u) => u.user_id === vote.user_id)?.name || 'Unknown User'}</span>
                <span>{nominationLabelById[vote.nomination_id] || 'Unknown Nomination'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeSection === 'nominations' && (
        <section className="panel">
          <h2>Nominations</h2>
          <p className="hint" style={{ marginTop: 4 }}>
            Browse who got nominated in each voting slot, plus current place and vote count.
          </p>
          <div className="admin-filter-bar admin-filter-bar-wrap" style={{ marginTop: 12 }}>
            <label className="admin-filter-field">
              <span className="admin-filter-label">Award</span>
              <select
                value={nominationsFilter.awardId}
                onChange={(e) => setNominationsFilter((prev) => ({ ...prev, awardId: e.target.value, categoryId: '' }))}
              >
                <option value="">Any</option>
                {voteAwardOptions.map((award) => (
                  <option key={award.award_id} value={String(award.award_id)}>
                    {award.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-filter-field">
              <span className="admin-filter-label">Category</span>
              <select
                value={nominationsFilter.categoryId}
                disabled={!nominationsFilter.awardId}
                onChange={(e) => setNominationsFilter((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">{nominationsFilter.awardId ? 'Any linked' : 'Pick award first'}</option>
                {nominationCategoryOptionsForFilter.map((c) => (
                  <option key={c.category_id} value={String(c.category_id)}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-filter-field admin-filter-grow">
              <span className="admin-filter-label">Search</span>
              <input
                type="search"
                placeholder="Nominee, movie, award, or category"
                value={nominationsFilter.query}
                onChange={(e) => setNominationsFilter((prev) => ({ ...prev, query: e.target.value }))}
              />
            </label>
            <button
              type="button"
              className="btn-filter-reset"
              disabled={nominationsFilter.awardId === '' && nominationsFilter.categoryId === '' && nominationsFilter.query.trim() === ''}
              onClick={() => setNominationsFilter({ awardId: '', categoryId: '', query: '' })}
            >
              Reset
            </button>
          </div>
          {filteredNominationStandings.length === 0 ? (
            <p className="hint">No nominations to show yet.</p>
          ) : (
            <div className="admin-table-wrap" style={{ marginTop: 12 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nominee</th>
                    <th>Award · Category</th>
                    <th>Place</th>
                    <th>Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNominationStandings.map((row) => (
                    <tr key={`${row.nomination_id}-${row.place}`}>
                      <td>{row.person ? `${row.person} as ${row.movie}` : row.movie}</td>
                      <td>{row.awardCategory}</td>
                      <td>#{row.place}</td>
                      <td>{row.votes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeSection === 'vote' && !isAdmin && (
        <section className="panel">
          <h2>Cast Vote</h2>
          <p className="hint" style={{ marginTop: 4 }}>
            Choose an award and category, then pick a nominee. You can switch either dropdown anytime.
          </p>
          {liveGroups.length === 0 ? (
            <p className="hint">No voting categories are open yet.</p>
          ) : (
            <>
              <div className="category-vote-toolbar category-vote-toolbar-split">
                <div className="category-vote-field">
                  <label className="field-label" htmlFor="vote-award">
                    Award
                  </label>
                  <select
                    id="vote-award"
                    className="category-vote-select"
                    value={votePickerAwardId}
                    onChange={(e) => {
                      const v = e.target.value
                      setVotePickerAwardId(v)
                      const aid = Number(v)
                      const first = awardCategories.find((ac) => ac.award_id === aid)
                      setVotePickerCategoryId(first ? String(first.category_id) : '')
                    }}
                  >
                    {voteAwardOptions.map((award) => (
                      <option key={award.award_id} value={String(award.award_id)}>
                        {award.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="category-vote-field">
                  <label className="field-label" htmlFor="vote-category">
                    Category
                  </label>
                  <select
                    id="vote-category"
                    className="category-vote-select"
                    value={votePickerCategoryId}
                    disabled={!votePickerAwardId}
                    onChange={(e) => setVotePickerCategoryId(e.target.value)}
                  >
                    <option value="">
                      {votePickerAwardId ? 'Select category' : 'Choose an award first'}
                    </option>
                    {voteCategoriesForAward.map((c) => (
                      <option key={c.category_id} value={String(c.category_id)}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {!votePickerAwardId ? (
                <p className="hint">Pick an award to load categories open for voting.</p>
              ) : voteCategoriesForAward.length === 0 ? (
                <p className="hint">No categories are linked to this award yet.</p>
              ) : voteSlotAwardCategoryId == null ? (
                <p className="hint">Select a category to see nominees.</p>
              ) : (
                liveGroups
                  .filter((g) => g.award_category_id === voteSlotAwardCategoryId)
                  .map((group) => {
                    const awardTitle = awardNameById[Number(votePickerAwardId)] || 'Award'
                    const categoryTitle = categoryNameById[Number(votePickerCategoryId)] || 'Category'
                    const votedNominationId = myVoteByAwardCategory[group.award_category_id]
                    return (
                      <article className="category-vote-card category-vote-single" key={group.award_category_id}>
                        <div className="category-vote-card-head">
                          <h3>{awardTitle}</h3>
                          <p className="category-vote-category-name">{categoryTitle}</p>
                        </div>
                        {group.rows.length === 0 ? (
                          <p className="hint">No nominations available in this category yet.</p>
                        ) : (
                          group.rows.map((row) => (
                            <div className="category-vote-option" key={row.nomination_id}>
                              <span>{row.label}</span>
                              <button
                                type="button"
                                className={
                                  votedNominationId === row.nomination_id
                                    ? 'vote-btn vote-btn--selected'
                                    : votedNominationId
                                      ? 'vote-btn vote-btn--disabled'
                                      : 'vote-btn'
                                }
                                disabled={Boolean(votedNominationId)}
                                onClick={() => castVoteForNomination(row.nomination_id)}
                              >
                                {votedNominationId === row.nomination_id ? 'Voted' : votedNominationId ? 'Locked' : 'Vote'}
                              </button>
                            </div>
                          ))
                        )}
                      </article>
                    )
                  })
              )}
            </>
          )}
        </section>
      )}

      {activeSection === 'myVotes' && !isGuestSession && !isAdmin && (
        <section className="panel">
          <h2>My Votes</h2>
          <p className="hint" style={{ marginTop: 4 }}>
            Review your votes and revoke them while the related voting slot is still active.
          </p>
          <div className="admin-filter-bar admin-filter-bar-wrap" style={{ marginTop: 12 }}>
            <label className="admin-filter-field admin-filter-grow">
              <span className="admin-filter-label">Search</span>
              <input
                type="search"
                placeholder="Nominee, movie, award, or category"
                value={myVotesQuery}
                onChange={(e) => setMyVotesQuery(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn-filter-reset"
              disabled={myVotesQuery.trim() === ''}
              onClick={() => setMyVotesQuery('')}
            >
              Reset
            </button>
          </div>
          {filteredUserVotesDetailed.length === 0 ? (
            <p className="hint">
              {userVotesDetailed.length === 0 ? 'You have not voted yet.' : 'No votes match your current search.'}
            </p>
          ) : (
            <div className="admin-table-wrap" style={{ marginTop: 12 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nominee</th>
                    <th>Award · Category</th>
                    <th>Cast At</th>
                    <th>Status</th>
                    <th className="admin-table-actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUserVotesDetailed.map((vote) => (
                    <tr key={vote.vote_id}>
                      <td>{vote.nominationLabel}</td>
                      <td>{vote.awardCategoryLabel}</td>
                      <td>{new Date(vote.cast_at).toLocaleString()}</td>
                      <td>{vote.canRevoke ? 'Active' : 'Closed'}</td>
                      <td className="admin-table-actions">
                        <button
                          type="button"
                          className="btn-small btn-danger"
                          disabled={!vote.canRevoke}
                          onClick={() => revokeVote(vote.vote_id)}
                        >
                          Revoke vote
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeSection === 'manage' && isAdmin && (
        <section className="panel panel-manage">
          <h2 className="manage-heading">Manage data</h2>
          <div className="manage-subtabs" role="tablist" aria-label="Data management sections">
            <button
              type="button"
              role="tab"
              aria-selected={manageSubTab === 'accounts'}
              className={manageSubTab === 'accounts' ? 'active' : ''}
              onClick={() => setManageSubTab('accounts')}
            >
              Accounts
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={manageSubTab === 'movies'}
              className={manageSubTab === 'movies' ? 'active' : ''}
              onClick={() => setManageSubTab('movies')}
            >
              Movies &amp; crew
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={manageSubTab === 'awards'}
              className={manageSubTab === 'awards' ? 'active' : ''}
              onClick={() => setManageSubTab('awards')}
            >
              Awards &amp; categories
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={manageSubTab === 'awardCategories'}
              className={manageSubTab === 'awardCategories' ? 'active' : ''}
              onClick={() => setManageSubTab('awardCategories')}
            >
              Voting slots
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={manageSubTab === 'nominations'}
              className={manageSubTab === 'nominations' ? 'active' : ''}
              onClick={() => setManageSubTab('nominations')}
            >
              Nominations
            </button>
          </div>
          <div className="forms-grid manage-forms-grid">
            {manageSubTab === 'accounts' && (
              <>
                <div className="manage-stack">
                  <AdminBlock title="Users" meta={adminRecordMeta(filteredAdminUsers.length, users.length)}>
                    <div className="admin-filter-bar">
                      <label className="admin-filter-field">
                        <span className="admin-filter-label">Role</span>
                        <select
                          value={adminFilters.userRole}
                          onChange={(e) => mergeAdminFilters({ userRole: e.target.value })}
                          aria-label="Filter users by role"
                        >
                          <option value="">Any</option>
                          <option value="voter">Voter</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>
                      <label className="admin-filter-field admin-filter-grow">
                        <span className="admin-filter-label">Search</span>
                        <input
                          type="search"
                          placeholder="Name or email"
                          value={adminFilters.userQuery}
                          onChange={(e) => mergeAdminFilters({ userQuery: e.target.value })}
                          aria-label="Search users"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn-filter-reset"
                        disabled={!adminFilters.userRole && adminFilters.userQuery.trim() === ''}
                        onClick={() => mergeAdminFilters({ userRole: '', userQuery: '' })}
                      >
                        Reset
                      </button>
                    </div>
                    <AdminTable
                      columns={[
                        { key: 'id', header: 'ID', cell: (u) => u.user_id },
                        { key: 'name', header: 'Name', cell: (u) => u.name },
                        { key: 'email', header: 'Email', cell: (u) => u.email },
                        { key: 'role', header: 'Role', cell: (u) => u.role },
                      ]}
                      rows={filteredAdminUsers}
                      totalCount={users.length}
                      rowKey={(u) => u.user_id}
                      renderActions={(u) => (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn-small btn-ghost"
                            onClick={() => {
                              setForms((prev) => ({
                                ...prev,
                                user: {
                                  name: u.name,
                                  email: u.email,
                                  password: '',
                                  role: u.role,
                                },
                              }))
                              setManageEditing((prev) => ({ ...prev, user: u.user_id }))
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn-small btn-danger" onClick={() => deleteUser(u.user_id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    />
                  </AdminBlock>
                  <EntityCard
                    title="User"
                    onSubmit={submitUser}
                    submitLabel={manageEditing.user != null ? 'Save changes' : 'Add user'}
                    footerExtra={
                      manageEditing.user != null ? (
                        <button type="button" className="btn-small btn-ghost" onClick={() => cancelManageEdit('user')}>
                          Cancel
                        </button>
                      ) : null
                    }
                  >
                    <input placeholder="Name" value={forms.user.name} onChange={(e) => updateForm('user', 'name', e.target.value)} />
                    <input placeholder="Email" value={forms.user.email} onChange={(e) => updateForm('user', 'email', e.target.value)} />
                    <input
                      type="password"
                      placeholder={manageEditing.user != null ? 'New password (optional)' : 'Password'}
                      value={forms.user.password}
                      onChange={(e) => updateForm('user', 'password', e.target.value)}
                    />
                    <select value={forms.user.role} onChange={(e) => updateForm('user', 'role', e.target.value)}>
                      <option value="voter">voter</option>
                      <option value="admin">admin</option>
                    </select>
                  </EntityCard>
                </div>

              </>
            )}
            {manageSubTab === 'movies' && (
              <>
                <div className="manage-stack">
                  <AdminBlock title="Movies" meta={adminRecordMeta(filteredAdminMovies.length, movies.length)}>
                    <div className="admin-filter-bar">
                      <label className="admin-filter-field admin-filter-grow">
                        <span className="admin-filter-label">Title</span>
                        <input
                          type="search"
                          placeholder="Search titles"
                          value={adminFilters.movieQuery}
                          onChange={(e) => mergeAdminFilters({ movieQuery: e.target.value })}
                          aria-label="Filter movies by title"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn-filter-reset"
                        disabled={adminFilters.movieQuery.trim() === ''}
                        onClick={() => mergeAdminFilters({ movieQuery: '' })}
                      >
                        Reset
                      </button>
                    </div>
                    <AdminTable
                      columns={[
                        { key: 'id', header: 'ID', cell: (m) => m.movie_id },
                        { key: 'title', header: 'Title', cell: (m) => m.title },
                        { key: 'year', header: 'Year', cell: (m) => m.release_year },
                        { key: 'dur', header: 'Min', cell: (m) => m.duration },
                      ]}
                      rows={filteredAdminMovies}
                      totalCount={movies.length}
                      rowKey={(m) => m.movie_id}
                      renderActions={(m) => (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn-small btn-ghost"
                            onClick={() => {
                              setForms((prev) => ({
                                ...prev,
                                movie: {
                                  title: m.title,
                                  release_year: String(m.release_year ?? ''),
                                  duration: String(m.duration ?? ''),
                                  description: m.description ?? '',
                                },
                              }))
                              setManageEditing((prev) => ({ ...prev, movie: m.movie_id }))
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn-small btn-danger" onClick={() => deleteMovie(m.movie_id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    />
                  </AdminBlock>
                  <EntityCard
                    title="Movie"
                    onSubmit={submitMovie}
                    submitLabel={manageEditing.movie != null ? 'Save changes' : 'Add movie'}
                    footerExtra={
                      manageEditing.movie != null ? (
                        <button type="button" className="btn-small btn-ghost" onClick={() => cancelManageEdit('movie')}>
                          Cancel
                        </button>
                      ) : null
                    }
                  >
                    <input placeholder="Title" value={forms.movie.title} onChange={(e) => updateForm('movie', 'title', e.target.value)} />
                    <input type="number" placeholder="Release year" value={forms.movie.release_year} onChange={(e) => updateForm('movie', 'release_year', e.target.value)} />
                    <input type="number" placeholder="Duration (min)" value={forms.movie.duration} onChange={(e) => updateForm('movie', 'duration', e.target.value)} />
                    <textarea placeholder="Description" value={forms.movie.description} onChange={(e) => updateForm('movie', 'description', e.target.value)} />
                  </EntityCard>
                </div>

                <div className="manage-stack">
                  <AdminBlock title="People" meta={adminRecordMeta(filteredAdminPeople.length, people.length)}>
                    <div className="admin-filter-bar">
                      <label className="admin-filter-field admin-filter-grow">
                        <span className="admin-filter-label">Search</span>
                        <input
                          type="search"
                          placeholder="First or last name"
                          value={adminFilters.personQuery}
                          onChange={(e) => mergeAdminFilters({ personQuery: e.target.value })}
                          aria-label="Search people by name"
                        />
                      </label>
                      <label className="admin-filter-field admin-filter-grow">
                        <span className="admin-filter-label">Nationality</span>
                        <input
                          type="search"
                          placeholder="Contains…"
                          value={adminFilters.personNation}
                          onChange={(e) => mergeAdminFilters({ personNation: e.target.value })}
                          aria-label="Filter by nationality"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn-filter-reset"
                        disabled={adminFilters.personQuery.trim() === '' && adminFilters.personNation.trim() === ''}
                        onClick={() => mergeAdminFilters({ personQuery: '', personNation: '' })}
                      >
                        Reset
                      </button>
                    </div>
                    <AdminTable
                      columns={[
                        { key: 'id', header: 'ID', cell: (p) => p.person_id },
                        {
                          key: 'name',
                          header: 'Name',
                          cell: (p) => `${p.first_name} ${p.last_name}`,
                        },
                        { key: 'dob', header: 'Birth', cell: (p) => p.birth_date || '—' },
                        { key: 'nat', header: 'Nationality', cell: (p) => p.nationality || '—' },
                      ]}
                      rows={filteredAdminPeople}
                      totalCount={people.length}
                      rowKey={(p) => p.person_id}
                      renderActions={(p) => (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn-small btn-ghost"
                            onClick={() => {
                              setForms((prev) => ({ ...prev, person: { ...p } }))
                              setManageEditing((prev) => ({ ...prev, person: p.person_id }))
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn-small btn-danger" onClick={() => deletePerson(p.person_id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    />
                  </AdminBlock>
                  <EntityCard
                    title="Person"
                    onSubmit={submitPerson}
                    submitLabel={manageEditing.person != null ? 'Save changes' : 'Add person'}
                    footerExtra={
                      manageEditing.person != null ? (
                        <button type="button" className="btn-small btn-ghost" onClick={() => cancelManageEdit('person')}>
                          Cancel
                        </button>
                      ) : null
                    }
                  >
                    <input placeholder="First name" value={forms.person.first_name} onChange={(e) => updateForm('person', 'first_name', e.target.value)} />
                    <input placeholder="Last name" value={forms.person.last_name} onChange={(e) => updateForm('person', 'last_name', e.target.value)} />
                    <input type="date" value={forms.person.birth_date} onChange={(e) => updateForm('person', 'birth_date', e.target.value)} />
                    <input placeholder="Nationality" value={forms.person.nationality} onChange={(e) => updateForm('person', 'nationality', e.target.value)} />
                  </EntityCard>
                </div>

                <div className="manage-stack">
                  <AdminBlock title="Movie crew" meta={adminRecordMeta(filteredAdminCrew.length, movieCrew.length)}>
                    <div className="admin-filter-bar">
                      <label className="admin-filter-field">
                        <span className="admin-filter-label">Movie</span>
                        <select
                          value={adminFilters.crewMovieId}
                          onChange={(e) => mergeAdminFilters({ crewMovieId: e.target.value })}
                          aria-label="Filter crew by movie"
                        >
                          <option value="">Any</option>
                          {movies.map((m) => (
                            <option key={m.movie_id} value={String(m.movie_id)}>
                              {m.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="admin-filter-field">
                        <span className="admin-filter-label">Role</span>
                        <select
                          value={adminFilters.crewRole}
                          onChange={(e) => mergeAdminFilters({ crewRole: e.target.value })}
                          aria-label="Filter crew by role type"
                        >
                          <option value="">Any</option>
                          {crewRoleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="admin-filter-field admin-filter-grow">
                        <span className="admin-filter-label">Person</span>
                        <input
                          type="search"
                          placeholder="Search cast & crew names"
                          value={adminFilters.crewPersonQuery}
                          onChange={(e) => mergeAdminFilters({ crewPersonQuery: e.target.value })}
                          aria-label="Filter crew by person name"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn-filter-reset"
                        disabled={
                          adminFilters.crewMovieId === '' &&
                          adminFilters.crewRole === '' &&
                          adminFilters.crewPersonQuery.trim() === ''
                        }
                        onClick={() =>
                          mergeAdminFilters({ crewMovieId: '', crewRole: '', crewPersonQuery: '' })
                        }
                      >
                        Reset
                      </button>
                    </div>
                    <AdminTable
                      columns={[
                        { key: 'id', header: 'ID', cell: (r) => r.crew_id },
                        { key: 'movie', header: 'Movie', cell: (r) => movieTitleById[r.movie_id] || r.movie_id },
                        { key: 'person', header: 'Person', cell: (r) => personNameById[r.person_id] || r.person_id },
                        { key: 'role', header: 'Role', cell: (r) => r.role },
                        { key: 'char', header: 'Character', cell: (r) => r.character_name || '—' },
                      ]}
                      rows={filteredAdminCrew}
                      totalCount={movieCrew.length}
                      rowKey={(r) => r.crew_id}
                      renderActions={(r) => (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn-small btn-ghost"
                            onClick={() => {
                              setForms((prev) => ({
                                ...prev,
                                movieCrew: {
                                  movie_id: String(r.movie_id),
                                  person_id: String(r.person_id),
                                  role: r.role,
                                  character_name: r.character_name || '',
                                },
                              }))
                              setManageEditing((prev) => ({ ...prev, movieCrew: r.crew_id }))
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn-small btn-danger" onClick={() => deleteMovieCrew(r.crew_id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    />
                  </AdminBlock>
                  <EntityCard
                    title="Movie Crew"
                    onSubmit={submitMovieCrew}
                    submitLabel={manageEditing.movieCrew != null ? 'Save changes' : 'Add credit'}
                    footerExtra={
                      manageEditing.movieCrew != null ? (
                        <button type="button" className="btn-small btn-ghost" onClick={() => cancelManageEdit('movieCrew')}>
                          Cancel
                        </button>
                      ) : null
                    }
                  >
                    <select value={forms.movieCrew.movie_id} onChange={(e) => updateForm('movieCrew', 'movie_id', e.target.value)}>
                      <option value="">Movie</option>
                      {movies.map((movie) => (
                        <option key={movie.movie_id} value={movie.movie_id}>
                          {movie.title}
                        </option>
                      ))}
                    </select>
                    <select value={forms.movieCrew.person_id} onChange={(e) => updateForm('movieCrew', 'person_id', e.target.value)}>
                      <option value="">Person</option>
                      {people.map((person) => (
                        <option key={person.person_id} value={person.person_id}>
                          {personNameById[person.person_id]}
                        </option>
                      ))}
                    </select>
                    <select value={forms.movieCrew.role} onChange={(e) => updateForm('movieCrew', 'role', e.target.value)}>
                      {crewRoleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <input placeholder="Character name" value={forms.movieCrew.character_name} onChange={(e) => updateForm('movieCrew', 'character_name', e.target.value)} />
                  </EntityCard>
                </div>
              </>
            )}
            {manageSubTab === 'awards' && (
              <div className="manage-tab-awards">
                <div className="manage-stack">
                  <AdminBlock title="Awards" meta={adminRecordMeta(filteredAdminAwards.length, awards.length)}>
                    <div className="admin-filter-bar">
                      <label className="admin-filter-field admin-filter-grow">
                        <span className="admin-filter-label">Name</span>
                        <input
                          type="search"
                          placeholder="Contains…"
                          value={adminFilters.awardSearch}
                          onChange={(e) => mergeAdminFilters({ awardSearch: e.target.value })}
                          aria-label="Search awards by name"
                        />
                      </label>
                      <label className="admin-filter-field">
                        <span className="admin-filter-label">Year</span>
                        <input
                          type="number"
                          placeholder="Any"
                          value={adminFilters.awardYear}
                          onChange={(e) => mergeAdminFilters({ awardYear: e.target.value })}
                          aria-label="Filter awards by year"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn-filter-reset"
                        disabled={adminFilters.awardSearch.trim() === '' && adminFilters.awardYear.trim() === ''}
                        onClick={() => mergeAdminFilters({ awardSearch: '', awardYear: '' })}
                      >
                        Reset
                      </button>
                    </div>
                    <AdminTable
                      columns={[
                        { key: 'id', header: 'ID', cell: (a) => a.award_id },
                        { key: 'name', header: 'Name', cell: (a) => a.name },
                        { key: 'year', header: 'Year', cell: (a) => a.year },
                      ]}
                      rows={filteredAdminAwards}
                      totalCount={awards.length}
                      rowKey={(a) => a.award_id}
                      renderActions={(a) => (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn-small btn-ghost"
                            onClick={() => {
                              setForms((prev) => ({
                                ...prev,
                                award: {
                                  name: a.name,
                                  year: String(a.year ?? ''),
                                  description: a.description ?? '',
                                },
                              }))
                              setManageEditing((prev) => ({ ...prev, award: a.award_id }))
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn-small btn-danger" onClick={() => deleteAward(a.award_id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    />
                  </AdminBlock>
                  <EntityCard
                    title="Award"
                    onSubmit={submitAward}
                    submitLabel={manageEditing.award != null ? 'Save changes' : 'Add award'}
                    footerExtra={
                      manageEditing.award != null ? (
                        <button type="button" className="btn-small btn-ghost" onClick={() => cancelManageEdit('award')}>
                          Cancel
                        </button>
                      ) : null
                    }
                  >
                    <input placeholder="Award name" value={forms.award.name} onChange={(e) => updateForm('award', 'name', e.target.value)} />
                    <input type="number" placeholder="Year" value={forms.award.year} onChange={(e) => updateForm('award', 'year', e.target.value)} />
                    <textarea placeholder="Description" value={forms.award.description} onChange={(e) => updateForm('award', 'description', e.target.value)} />
                  </EntityCard>
                </div>

                <div className="manage-stack">
                  <AdminBlock title="Categories" meta={adminRecordMeta(filteredAdminCategories.length, categories.length)}>
                    <div className="admin-filter-bar">
                      <label className="admin-filter-field admin-filter-grow">
                        <span className="admin-filter-label">Search</span>
                        <input
                          type="search"
                          placeholder="Category name"
                          value={adminFilters.categorySearch}
                          onChange={(e) => mergeAdminFilters({ categorySearch: e.target.value })}
                          aria-label="Search categories"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn-filter-reset"
                        disabled={adminFilters.categorySearch.trim() === ''}
                        onClick={() => mergeAdminFilters({ categorySearch: '' })}
                      >
                        Reset
                      </button>
                    </div>
                    <AdminTable
                      columns={[
                        { key: 'id', header: 'ID', cell: (c) => c.category_id },
                        { key: 'name', header: 'Name', cell: (c) => c.name },
                        { key: 'type', header: 'Nominee type', cell: (c) => c.nominee_type || 'ANY_CREW' },
                      ]}
                      rows={filteredAdminCategories}
                      totalCount={categories.length}
                      rowKey={(c) => c.category_id}
                      renderActions={(c) => (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn-small btn-ghost"
                            onClick={() => {
                              setForms((prev) => ({
                                ...prev,
                                category: { name: c.name, nominee_type: c.nominee_type || 'ANY_CREW' },
                              }))
                              setManageEditing((prev) => ({ ...prev, category: c.category_id }))
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn-small btn-danger" onClick={() => deleteCategory(c.category_id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    />
                  </AdminBlock>
                  <EntityCard
                    title="Category"
                    onSubmit={submitCategory}
                    submitLabel={manageEditing.category != null ? 'Save changes' : 'Add category'}
                    footerExtra={
                      manageEditing.category != null ? (
                        <button type="button" className="btn-small btn-ghost" onClick={() => cancelManageEdit('category')}>
                          Cancel
                        </button>
                      ) : null
                    }
                  >
                    <input placeholder="Category name" value={forms.category.name} onChange={(e) => updateForm('category', 'name', e.target.value)} />
                    <label className="field-label" htmlFor="category-nominee-type">
                      Nominee type
                    </label>
                    <select
                      id="category-nominee-type"
                      value={forms.category.nominee_type || 'ANY_CREW'}
                      onChange={(e) => updateForm('category', 'nominee_type', e.target.value)}
                    >
                      {nomineeTypeOptions.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </EntityCard>
                </div>
              </div>
            )}
            {manageSubTab === 'awardCategories' && (
              <div className="manage-stack manage-stack-wide manage-tab-slots">
                <AdminBlock
                  title="Voting slots"
                  meta={adminRecordMeta(filteredAdminAwardCats.length, awardCategories.length)}
                >
                  <div className="admin-filter-bar admin-filter-bar-wrap">
                    <label className="admin-filter-field">
                      <span className="admin-filter-label">Award</span>
                      <select
                        value={adminFilters.acAwardId}
                        onChange={(e) =>
                          mergeAdminFilters({ acAwardId: e.target.value, acCategoryId: '' })
                        }
                        aria-label="Filter slots by award"
                      >
                        <option value="">Any</option>
                        {awards.map((award) => (
                          <option key={award.award_id} value={String(award.award_id)}>
                            {award.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-filter-field">
                      <span className="admin-filter-label">Category</span>
                      <select
                        value={adminFilters.acCategoryId}
                        disabled={!adminFilters.acAwardId}
                        onChange={(e) => mergeAdminFilters({ acCategoryId: e.target.value })}
                        aria-label="Filter slots by category"
                      >
                        <option value="">
                          {adminFilters.acAwardId ? 'Any linked' : 'Pick award first'}
                        </option>
                        {adminAcCatsForAwardFilter.map((c) => (
                          <option key={c.category_id} value={String(c.category_id)}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="btn-filter-reset"
                      disabled={adminFilters.acAwardId === '' && adminFilters.acCategoryId === ''}
                      onClick={() => mergeAdminFilters({ acAwardId: '', acCategoryId: '' })}
                    >
                      Reset
                    </button>
                  </div>
                  <AdminTable
                    columns={[
                      { key: 'id', header: 'ID', cell: (ac) => ac.award_category_id },
                      { key: 'award', header: 'Award', cell: (ac) => awardNameById[ac.award_id] || ac.award_id },
                      { key: 'cat', header: 'Category', cell: (ac) => categoryNameById[ac.category_id] || ac.category_id },
                      {
                        key: 'window',
                        header: 'Window',
                        cell: (ac) => (
                          <span className="admin-cell-muted">
                            {ac.start_time || '—'} → {ac.end_time || '—'}
                          </span>
                        ),
                      },
                    ]}
                    rows={filteredAdminAwardCats}
                    totalCount={awardCategories.length}
                    rowKey={(ac) => ac.award_category_id}
                    renderActions={(ac) => (
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="btn-small btn-ghost"
                          onClick={() => {
                            setForms((prev) => ({
                              ...prev,
                              awardCategory: {
                                award_id: String(ac.award_id),
                                category_id: String(ac.category_id),
                                start_time: ac.start_time,
                                end_time: ac.end_time,
                              },
                            }))
                            setManageEditing((prev) => ({ ...prev, awardCategory: ac.award_category_id }))
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" className="btn-small btn-danger" onClick={() => deleteAwardCategoryRow(ac.award_category_id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  />
                </AdminBlock>
                <EntityCard
                  title="Voting slot"
                  onSubmit={submitAwardCategory}
                  submitLabel={manageEditing.awardCategory != null ? 'Save changes' : 'Add slot'}
                  footerExtra={
                    manageEditing.awardCategory != null ? (
                      <button type="button" className="btn-small btn-ghost" onClick={() => cancelManageEdit('awardCategory')}>
                        Cancel
                      </button>
                    ) : null
                  }
                >
                  <label className="field-label" htmlFor="ac-tab-award">
                    Award
                  </label>
                  <select
                    id="ac-tab-award"
                    value={forms.awardCategory.award_id}
                    onChange={(e) =>
                      setForms((prev) => ({
                        ...prev,
                        awardCategory: { ...prev.awardCategory, award_id: e.target.value, category_id: '' },
                      }))
                    }
                  >
                    <option value="">Select award</option>
                    {awards.map((award) => (
                      <option key={award.award_id} value={award.award_id}>
                        {award.name}
                      </option>
                    ))}
                  </select>
                  <label className="field-label" htmlFor="ac-tab-category">
                    Category
                  </label>
                  <select
                    id="ac-tab-category"
                    value={forms.awardCategory.category_id}
                    disabled={!forms.awardCategory.award_id}
                    onChange={(e) => updateForm('awardCategory', 'category_id', e.target.value)}
                  >
                    <option value="">
                      {forms.awardCategory.award_id ? 'Select category' : 'Choose an award first'}
                    </option>
                    {categoriesAvailableForAwardCategory.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {!forms.awardCategory.award_id ? (
                    <p className="hint" style={{ margin: 0 }}>
                      Pick an award to see categories you can still attach.
                    </p>
                  ) : categoriesAvailableForAwardCategory.length === 0 ? (
                    <p className="hint" style={{ margin: 0 }}>
                      Every category is already linked to this award.
                    </p>
                  ) : null}
                  <label className="field-label" htmlFor="ac-tab-start">
                    Voting window
                  </label>
                  <input
                    id="ac-tab-start"
                    type="datetime-local"
                    value={forms.awardCategory.start_time}
                    onChange={(e) => updateForm('awardCategory', 'start_time', e.target.value)}
                  />
                  <input
                    id="ac-tab-end"
                    type="datetime-local"
                    aria-label="Voting end"
                    value={forms.awardCategory.end_time}
                    onChange={(e) => updateForm('awardCategory', 'end_time', e.target.value)}
                  />
                </EntityCard>
              </div>
            )}
            {manageSubTab === 'nominations' && (
              <div className="manage-stack manage-stack-wide">
                <AdminBlock
                  title="Nominations"
                  meta={adminRecordMeta(filteredAdminNominations.length, nominations.length)}
                >
                  <div className="admin-filter-bar admin-filter-bar-wrap">
                    <label className="admin-filter-field">
                      <span className="admin-filter-label">Award</span>
                      <select
                        value={adminFilters.nomAwardId}
                        onChange={(e) =>
                          mergeAdminFilters({ nomAwardId: e.target.value, nomCategoryId: '' })
                        }
                        aria-label="Filter nominations by award"
                      >
                        <option value="">Any</option>
                        {awards.map((award) => (
                          <option key={award.award_id} value={String(award.award_id)}>
                            {award.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-filter-field">
                      <span className="admin-filter-label">Category</span>
                      <select
                        value={adminFilters.nomCategoryId}
                        disabled={!adminFilters.nomAwardId}
                        onChange={(e) => mergeAdminFilters({ nomCategoryId: e.target.value })}
                        aria-label="Filter nominations by category"
                      >
                        <option value="">
                          {adminFilters.nomAwardId ? 'Any' : 'Pick award'}
                        </option>
                        {adminNomCatsForAwardFilter.map((c) => (
                          <option key={c.category_id} value={String(c.category_id)}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-filter-field">
                      <span className="admin-filter-label">Movie</span>
                      <select
                        value={adminFilters.nomMovieId}
                        onChange={(e) => mergeAdminFilters({ nomMovieId: e.target.value })}
                        aria-label="Filter nominations by movie"
                      >
                        <option value="">Any</option>
                        {movies.map((m) => (
                          <option key={m.movie_id} value={String(m.movie_id)}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-filter-field admin-filter-grow">
                      <span className="admin-filter-label">Person</span>
                      <input
                        type="search"
                        placeholder="Nominee name"
                        value={adminFilters.nomPersonQuery}
                        onChange={(e) => mergeAdminFilters({ nomPersonQuery: e.target.value })}
                        aria-label="Filter nominations by person"
                      />
                    </label>
                    <button
                      type="button"
                      className="btn-filter-reset"
                      disabled={
                        adminFilters.nomAwardId === '' &&
                        adminFilters.nomCategoryId === '' &&
                        adminFilters.nomMovieId === '' &&
                        adminFilters.nomPersonQuery.trim() === ''
                      }
                      onClick={() =>
                        mergeAdminFilters({
                          nomAwardId: '',
                          nomCategoryId: '',
                          nomMovieId: '',
                          nomPersonQuery: '',
                        })
                      }
                    >
                      Reset
                    </button>
                  </div>
                  <AdminTable
                    columns={[
                      { key: 'id', header: 'ID', cell: (n) => n.nomination_id },
                      {
                        key: 'slot',
                        header: 'Voting slot',
                        cell: (n) => awardCategoryLabelById[n.award_category_id] || n.award_category_id,
                      },
                      { key: 'movie', header: 'Movie', cell: (n) => movieTitleById[n.movie_id] || n.movie_id },
                      {
                        key: 'person',
                        header: 'Person',
                        cell: (n) => (n.person_id == null ? 'Movie only' : personNameById[n.person_id] || n.person_id),
                      },
                    ]}
                    rows={filteredAdminNominations}
                    totalCount={nominations.length}
                    rowKey={(n) => n.nomination_id}
                    renderActions={(n) => {
                      const slot = awardCategories.find((ac) => ac.award_category_id === n.award_category_id)
                      return (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn-small btn-ghost"
                            onClick={() => {
                              setForms((prev) => ({
                                ...prev,
                                nomination: {
                                  award_id: slot ? String(slot.award_id) : '',
                                  category_id: slot ? String(slot.category_id) : '',
                                  movie_id: String(n.movie_id),
                                  person_id: n.person_id == null ? '' : String(n.person_id),
                                },
                              }))
                              setManageEditing((prev) => ({ ...prev, nomination: n.nomination_id }))
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn-small btn-danger" onClick={() => deleteNomination(n.nomination_id)}>
                            Delete
                          </button>
                        </div>
                      )
                    }}
                  />
                </AdminBlock>
                <EntityCard
                  title="Nomination"
                  onSubmit={submitNomination}
                  submitLabel={manageEditing.nomination != null ? 'Save changes' : 'Add nomination'}
                  footerExtra={
                    manageEditing.nomination != null ? (
                      <button type="button" className="btn-small btn-ghost" onClick={() => cancelManageEdit('nomination')}>
                        Cancel
                      </button>
                    ) : null
                  }
                >
                  <label className="field-label" htmlFor="nom-award">
                    Award
                  </label>
                  <select
                    id="nom-award"
                    value={forms.nomination.award_id}
                    onChange={(e) =>
                      setForms((prev) => ({
                        ...prev,
                        nomination: { ...prev.nomination, award_id: e.target.value, category_id: '' },
                      }))
                    }
                  >
                    <option value="">Select award</option>
                    {awards.map((award) => (
                      <option key={award.award_id} value={award.award_id}>
                        {award.name}
                      </option>
                    ))}
                  </select>
                  <label className="field-label" htmlFor="nom-category">
                    Category
                  </label>
                  <select
                    id="nom-category"
                    value={forms.nomination.category_id}
                    disabled={!forms.nomination.award_id}
                    onChange={(e) => updateForm('nomination', 'category_id', e.target.value)}
                  >
                    <option value="">
                      {forms.nomination.award_id ? 'Select category' : 'Choose an award first'}
                    </option>
                    {nominationCategoriesForAward.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {!forms.nomination.award_id ? (
                    <p className="hint" style={{ margin: 0 }}>
                      Choose an award to load categories that are open for that show.
                    </p>
                  ) : nominationCategoriesForAward.length === 0 ? (
                    <p className="hint" style={{ margin: 0 }}>
                      No voting slots for this award yet. Add one under Voting slots first.
                    </p>
                  ) : null}
                  <label className="field-label" htmlFor="nom-movie">
                    Movie
                  </label>
                  <select id="nom-movie" value={forms.nomination.movie_id} onChange={(e) => updateForm('nomination', 'movie_id', e.target.value)}>
                    <option value="">Movie</option>
                    {movies.map((movie) => (
                      <option key={movie.movie_id} value={movie.movie_id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                  <label className="field-label" htmlFor="nom-person">
                    Person (from selected movie crew)
                  </label>
                  <select
                    id="nom-person"
                    value={forms.nomination.person_id}
                    disabled={!forms.nomination.movie_id || selectedNominationCategoryType === 'MOVIE'}
                    onChange={(e) => updateForm('nomination', 'person_id', e.target.value)}
                  >
                    <option value="">
                      {!forms.nomination.movie_id
                        ? 'Choose a movie first'
                        : selectedNominationCategoryType === 'MOVIE'
                          ? 'Movie-only category'
                          : 'Select crew member'}
                    </option>
                    {nominationPeopleForSelectedMovie.map((person) => (
                      <option key={person.person_id} value={person.person_id}>
                        {personNameById[person.person_id]}
                      </option>
                    ))}
                  </select>
                </EntityCard>
              </div>
            )}
          </div>
        </section>
      )}

      {activeSection === 'manage' && !isAdmin && (
        <section className="panel">
          <h2>Manage data</h2>
          <p className="hint">This section is unavailable.</p>
        </section>
      )}

      {activeSection === 'results' && (
        <section className="panel results-surface">
          <div className="results-top">
            <div className="results-title-block">
              <h2 className="results-title">Fan ballot leaderboard</h2>
            </div>
          </div>
          <div className="results-list">
            <div className="results-section">
              <h3 className="results-section-title">Open · upcoming</h3>
              {resultsActiveGroups.length === 0 ? (
                <p className="hint results-empty">No active or upcoming slots right now.</p>
              ) : (
                resultsActiveGroups.map((group) => (
                  <LeaderboardGroupCard
                    key={group.award_category_id}
                    group={group}
                    isOpen={openResultCategoryId === group.award_category_id}
                    onToggle={() =>
                      setOpenResultCategoryId((prev) =>
                        prev === group.award_category_id ? null : group.award_category_id,
                      )
                    }
                  />
                ))
              )}
            </div>
            <div className="results-section">
              <h3 className="results-section-title">Past</h3>
              {resultsPastGroups.length === 0 ? (
                <p className="hint results-empty">No past slots yet.</p>
              ) : (
                resultsPastGroups.map((group) => (
                  <LeaderboardGroupCard
                    key={group.award_category_id}
                    group={group}
                    isOpen={openResultCategoryId === group.award_category_id}
                    onToggle={() =>
                      setOpenResultCategoryId((prev) =>
                        prev === group.award_category_id ? null : group.award_category_id,
                      )
                    }
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function LeaderboardGroupCard({ group, isOpen, onToggle }) {
  const leaderVotes = group.rows[0]?.votes ?? 0
  const phaseChip =
    group.phase === 'ongoing'
      ? 'Open for voting'
      : group.phase === 'upcoming'
        ? `Opens ${group.start_time ? new Date(group.start_time).toLocaleString() : '—'}`
        : 'Voting closed'

  return (
    <article className={`result-card ${isOpen ? 'is-open' : ''}`}>
      <button type="button" className="result-card-header" onClick={onToggle} aria-expanded={isOpen}>
        <div className="result-card-header-main">
          <h3>{group.title}</h3>
          <div className="result-card-meta">
            <span className={`result-phase-chip phase-${group.phase}`}>{phaseChip}</span>
            <span>{group.totalVotes} votes</span>
            {group.rows.length > 0 && leaderVotes > 0 && (
              <span className="result-card-leader">
                Leading: {group.rows[0].votes} ({group.totalVotes ? Math.round((group.rows[0].votes / group.totalVotes) * 100) : 0}%)
              </span>
            )}
          </div>
        </div>
        <span className={`result-card-chevron ${isOpen ? 'open' : ''}`} aria-hidden />
      </button>
      {isOpen && (
        <div className="result-card-body">
          {group.rows.length === 0 ? (
            <p className="hint results-empty">No nominations in this category yet.</p>
          ) : (
            <ol className="result-leaderboard">
              {group.rows.map((row, index) => {
                const rank = index + 1
                const pct = group.totalVotes ? Math.round((row.votes / group.totalVotes) * 100) : 0
                const tier = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : ''
                return (
                  <li className={`result-leader-row ${tier}`} key={row.nomination_id}>
                    <span className="result-rank">{rank}</span>
                    <div className="result-leader-copy">
                      <span className="result-leader-label">{row.label}</span>
                      <div className="result-bar-row">
                        <div className="bar result-bar-track" role="presentation">
                          <div className="fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="result-bar-stats">
                          <strong>{pct}%</strong>
                          <span>
                            {row.votes} {row.votes === 1 ? 'vote' : 'votes'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}
    </article>
  )
}

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <span className="stat-card-hint">{hint}</span> : null}
    </div>
  )
}

function adminRecordMeta(shown, total) {
  if (total <= 0) return 'Nothing stored yet'
  if (shown === total) return `${total} record${total === 1 ? '' : 's'}`
  return `Showing ${shown} of ${total}`
}

function AdminBlock({ title, meta, children }) {
  return (
    <div className="admin-block admin-catalog">
      <div className="admin-block-head">
        <h4 className="admin-block-title">{title}</h4>
        {meta ? <span className="admin-block-meta">{meta}</span> : null}
      </div>
      {children}
    </div>
  )
}

function AdminTable({ columns, rows, rowKey, renderActions, totalCount }) {
  const baseTotal = totalCount != null ? totalCount : rows.length
  const emptyMessage =
    rows.length !== 0
      ? null
      : baseTotal > 0
        ? 'No rows match the current filters.'
        : 'No records yet.'
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
            <th className="admin-table-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="admin-table-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td key={c.key}>{c.cell(row)}</td>
                ))}
                <td className="admin-table-actions">{renderActions(row)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function EntityCard({ title, children, onSubmit, submitLabel, footerExtra }) {
  return (
    <form className="entity-card" onSubmit={onSubmit}>
      <h3>{title}</h3>
      {children}
      <div className="entity-card-footer">
        <button type="submit">{submitLabel || `Add ${title}`}</button>
        {footerExtra}
      </div>
    </form>
  )
}

export default App
