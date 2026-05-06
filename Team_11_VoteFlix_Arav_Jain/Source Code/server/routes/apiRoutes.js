// this file has all the paths for our api
import { Router } from 'express'
import {
  castVoteSafe,
  createCategory,
  createNomination,
  deleteCategory,
  deleteNomination,
  getBootstrapData,
  getCategoryStats,
  getComplexMovieVoteQuery,
  getNominationDetails,
  getTopNominationsViaSubquery,
  getVoteSummary,
  getVotesByFunction,
  getWinners,
  revokeVoteSafe,
  updateNomination,
  updateCategory,
  createUser,
  updateUser,
  deleteUser,
  createPerson,
  updatePerson,
  deletePerson,
  createMovie,
  updateMovie,
  deleteMovie,
  upsertMovieCrew,
  deleteMovieCrew,
  createAward,
  updateAward,
  deleteAward,
  createAwardCategory,
  updateAwardCategory,
  deleteAwardCategory,
} from '../services/awardsService.js'

const router = Router()

// simple health check path
router.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// bootstrap is to get all initial data for the app
router.get('/bootstrap', async (_req, res, next) => {
  try {
    res.json(await getBootstrapData())
  } catch (error) {
    next(error)
  }
})

// --- Users section (create, update, delete) ---
router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    res.json({ ok: true, result: await createUser(name, email, password, role) })
  } catch (error) {
    next(error)
  }
})

router.put('/users/:userId', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    res.json({ ok: true, result: await updateUser(Number(req.params.userId), name, email, password, role) })
  } catch (error) {
    next(error)
  }
})

router.delete('/users/:userId', async (req, res, next) => {
  try {
    res.json({ ok: true, result: await deleteUser(Number(req.params.userId)) })
  } catch (error) {
    next(error)
  }
})

// --- People section ---
router.post('/people', async (req, res, next) => {
  try {
    const { first_name, last_name, birth_date, nationality } = req.body
    res.json({ ok: true, result: await createPerson(first_name, last_name, birth_date, nationality) })
  } catch (error) {
    next(error)
  }
})

router.put('/people/:personId', async (req, res, next) => {
  try {
    const { first_name, last_name, birth_date, nationality } = req.body
    res.json({ ok: true, result: await updatePerson(Number(req.params.personId), first_name, last_name, birth_date, nationality) })
  } catch (error) {
    next(error)
  }
})

router.delete('/people/:personId', async (req, res, next) => {
  try {
    res.json({ ok: true, result: await deletePerson(Number(req.params.personId)) })
  } catch (error) {
    next(error)
  }
})

// --- Movies section ---
router.post('/movies', async (req, res, next) => {
  try {
    const { title, release_year, duration, description } = req.body
    res.json({ ok: true, result: await createMovie(title, release_year, duration, description) })
  } catch (error) {
    next(error)
  }
})

router.put('/movies/:movieId', async (req, res, next) => {
  try {
    const { title, release_year, duration, description } = req.body
    res.json({ ok: true, result: await updateMovie(Number(req.params.movieId), title, release_year, duration, description) })
  } catch (error) {
    next(error)
  }
})

router.delete('/movies/:movieId', async (req, res, next) => {
  try {
    res.json({ ok: true, result: await deleteMovie(Number(req.params.movieId)) })
  } catch (error) {
    next(error)
  }
})

// --- Movie Crew section to link people to movies ---
router.post('/movie-crew', async (req, res, next) => {
  try {
    const { movie_id, person_id, role, character_name } = req.body
    res.json({ ok: true, result: await upsertMovieCrew(movie_id, person_id, role, character_name) })
  } catch (error) {
    next(error)
  }
})

router.delete('/movie-crew', async (req, res, next) => {
  try {
    const { movie_id, person_id, role } = req.body
    res.json({ ok: true, result: await deleteMovieCrew(movie_id, person_id, role) })
  } catch (error) {
    next(error)
  }
})

// --- Awards section ---
router.post('/awards', async (req, res, next) => {
  try {
    const { name, year, description } = req.body
    res.json({ ok: true, result: await createAward(name, year, description) })
  } catch (error) {
    next(error)
  }
})

router.put('/awards/:awardId', async (req, res, next) => {
  try {
    const { name, year, description } = req.body
    res.json({ ok: true, result: await updateAward(Number(req.params.awardId), name, year, description) })
  } catch (error) {
    next(error)
  }
})

router.delete('/awards/:awardId', async (req, res, next) => {
  try {
    res.json({ ok: true, result: await deleteAward(Number(req.params.awardId)) })
  } catch (error) {
    next(error)
  }
})

// --- Award Categories section (voting slots) ---
router.post('/award-categories', async (req, res, next) => {
  try {
    const { award_id, category_id, start_time, end_time } = req.body
    res.json({ ok: true, result: await createAwardCategory(award_id, category_id, start_time, end_time) })
  } catch (error) {
    next(error)
  }
})

router.put('/award-categories/:acId', async (req, res, next) => {
  try {
    const { award_id, category_id, start_time, end_time } = req.body
    res.json({ ok: true, result: await updateAwardCategory(Number(req.params.acId), award_id, category_id, start_time, end_time) })
  } catch (error) {
    next(error)
  }
})

router.delete('/award-categories/:acId', async (req, res, next) => {
  try {
    res.json({ ok: true, result: await deleteAwardCategory(Number(req.params.acId)) })
  } catch (error) {
    next(error)
  }
})

// route to cast a vote safely
router.post('/votes/cast-safe', async (req, res, next) => {
  try {
    const { jury_id, nomination_id, award_category_id } = req.body
    const result = await castVoteSafe(jury_id, nomination_id, award_category_id)
    res.json({ ok: true, result })
  } catch (error) {
    if (error?.status) {
      res.status(error.status).json({ ok: false, message: error.message || 'Vote request failed.' })
      return
    }
    next(error)
  }
})

router.post('/votes/revoke', async (req, res, next) => {
  try {
    const { jury_id, vote_id } = req.body
    const result = await revokeVoteSafe(jury_id, vote_id)
    res.json({ ok: true, result })
  } catch (error) {
    if (error?.status) {
      res.status(error.status).json({ ok: false, message: error.message || 'Vote revoke failed.' })
      return
    }
    next(error)
  }
})

// nominations section to add movies to awards
router.post('/nominations', async (req, res, next) => {
  try {
    const { award_category_id, movie_id, person_id } = req.body
    const result = await createNomination(Number(award_category_id), Number(movie_id), person_id == null ? null : Number(person_id))
    res.json({ ok: true, result })
  } catch (error) {
    if (error?.status) {
      res.status(error.status).json({ ok: false, message: error.message || 'Create nomination failed.' })
      return
    }
    next(error)
  }
})

router.put('/nominations/:nominationId', async (req, res, next) => {
  try {
    const nominationId = Number(req.params.nominationId)
    const { award_category_id, movie_id, person_id } = req.body
    const result = await updateNomination(
      nominationId,
      Number(award_category_id),
      Number(movie_id),
      person_id == null ? null : Number(person_id),
    )
    res.json({ ok: true, result })
  } catch (error) {
    if (error?.status) {
      res.status(error.status).json({ ok: false, message: error.message || 'Update nomination failed.' })
      return
    }
    next(error)
  }
})

router.delete('/nominations/:nominationId', async (req, res, next) => {
  try {
    const nominationId = Number(req.params.nominationId)
    const result = await deleteNomination(nominationId)
    res.json({ ok: true, result })
  } catch (error) {
    if (error?.status) {
      res.status(error.status).json({ ok: false, message: error.message || 'Delete nomination failed.' })
      return
    }
    next(error)
  }
})

router.post('/categories', async (req, res, next) => {
  try {
    const { name, nominee_type } = req.body
    const result = await createCategory(String(name || '').trim(), String(nominee_type || 'ANY_CREW'))
    res.json({ ok: true, result })
  } catch (error) {
    if (error?.status) {
      res.status(error.status).json({ ok: false, message: error.message || 'Create category failed.' })
      return
    }
    next(error)
  }
})

router.put('/categories/:categoryId', async (req, res, next) => {
  try {
    const categoryId = Number(req.params.categoryId)
    const { name, nominee_type } = req.body
    const result = await updateCategory(categoryId, String(name || '').trim(), String(nominee_type || 'ANY_CREW'))
    res.json({ ok: true, result })
  } catch (error) {
    if (error?.status) {
      res.status(error.status).json({ ok: false, message: error.message || 'Update category failed.' })
      return
    }
    next(error)
  }
})

router.delete('/categories/:categoryId', async (req, res, next) => {
  try {
    const categoryId = Number(req.params.categoryId)
    const result = await deleteCategory(categoryId)
    res.json({ ok: true, result })
  } catch (error) {
    if (error?.status) {
      res.status(error.status).json({ ok: false, message: error.message || 'Delete category failed.' })
      return
    }
    next(error)
  }
})

// analytics routes for the dashboard
router.get('/analytics/vote-summary', async (_req, res, next) => {
  try {
    res.json(await getVoteSummary())
  } catch (error) {
    next(error)
  }
})

router.get('/analytics/winners', async (_req, res, next) => {
  try {
    res.json(await getWinners())
  } catch (error) {
    next(error)
  }
})

router.get('/analytics/nomination-details', async (_req, res, next) => {
  try {
    res.json(await getNominationDetails())
  } catch (error) {
    next(error)
  }
})

router.get('/analytics/category-stats', async (_req, res, next) => {
  try {
    res.json(await getCategoryStats())
  } catch (error) {
    next(error)
  }
})

router.get('/analytics/complex-query', async (_req, res, next) => {
  try {
    res.json(await getComplexMovieVoteQuery())
  } catch (error) {
    next(error)
  }
})

router.get('/analytics/subquery-top-nominations', async (_req, res, next) => {
  try {
    res.json(await getTopNominationsViaSubquery())
  } catch (error) {
    next(error)
  }
})

router.get('/analytics/function-votes/:nominationId', async (req, res, next) => {
  try {
    const nominationId = Number(req.params.nominationId)
    const totalVotes = await getVotesByFunction(nominationId)
    res.json({ nominationId, totalVotes })
  } catch (error) {
    next(error)
  }
})

export default router
