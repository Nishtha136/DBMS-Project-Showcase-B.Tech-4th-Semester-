import { appPool } from '../db/connection.js'

// helper function to change DB user role to what frontend expects
function mapUsers(rows) {
  return rows.map((row) => ({
    user_id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role === 'ADMIN' ? 'admin' : 'voter',
  }))
}

// generic helper to map rows and add an ID key
function mapRows(rows, idKey, fromKey = 'id') {
  return rows.map((row) => ({ ...row, [idKey]: row[fromKey] }))
}

// helper to format nomination data for the frontend
function toNominationDto(row) {
  return {
    nomination_id: row.id,
    award_category_id: row.award_category_id,
    movie_id: row.movie_id,
    person_id: row.person_id,
    is_winner: 0,
  }
}

export async function getBootstrapData() {
  // getting users from the Users table
  const [users] = await appPool.query('SELECT id, name, email, password, role FROM Users ORDER BY id')
  // getting people from the People table
  const [people] = await appPool.query('SELECT id, first_name, last_name, birth_date, nationality FROM People ORDER BY id')
  // getting movies from the Movies table
  const [movies] = await appPool.query('SELECT id, title, release_year, duration, description FROM Movies ORDER BY id')
  // getting crew info
  const [movieCrew] = await appPool.query('SELECT movie_id, person_id, role, character_name FROM Movie_Crew ORDER BY movie_id, person_id')
  // getting awards info
  const [awards] = await appPool.query('SELECT id, name, year, description FROM Awards ORDER BY id')
  // getting categories like Best Picture
  const [categories] = await appPool.query('SELECT id, name, nominee_type FROM Categories ORDER BY id')
  // getting voting slots
  const [awardCategories] = await appPool.query('SELECT id, award_id, category_id, start_time, end_time FROM Award_Category ORDER BY id')
  // getting nominations
  const [nominations] = await appPool.query('SELECT id, award_category_id, movie_id, person_id FROM Nominations ORDER BY id')
  // getting all the votes
  const [votes] = await appPool.query('SELECT id, jury_id, nomination_id, award_category_id, cast_at FROM Votes ORDER BY id')

  return {
    users: mapUsers(users),
    people: mapRows(people, 'person_id'),
    movies: mapRows(movies, 'movie_id'),
    movieCrew: movieCrew.map((row, index) => ({
      crew_id: index + 1,
      movie_id: row.movie_id,
      person_id: row.person_id,
      role: (row.role || '').toLowerCase(),
      character_name: row.character_name,
    })),
    awards: mapRows(awards, 'award_id'),
    categories: mapRows(categories, 'category_id'),
    awardCategories: mapRows(awardCategories, 'award_category_id'),
    nominations: mapRows(nominations, 'nomination_id').map((row) => ({ ...row, is_winner: 0 })),
    votes: votes.map((row) => ({
      vote_id: row.id,
      user_id: row.jury_id,
      nomination_id: row.nomination_id,
      award_category_id: row.award_category_id,
      cast_at: row.cast_at,
    })),
  }
}

export async function castVoteSafe(juryId, nominationId, categoryId) {
  // first check if the voting slot actually exists
  const [slot] = await appPool.query(
    'SELECT start_time, end_time FROM Award_Category WHERE id = ? LIMIT 1',
    [categoryId],
  )

  if (!slot.length) {
    const err = new Error('Voting slot not found')
    err.status = 404
    throw err
  }

  // checking if the current time is within the allowed window
  const now = Date.now()
  const start = slot[0].start_time ? new Date(slot[0].start_time).getTime() : -Infinity
  const end = slot[0].end_time ? new Date(slot[0].end_time).getTime() : Infinity

  if (now < start || now > end) {
    const err = new Error('Voting not active')
    err.status = 403
    throw err
  }

  try {
    await appPool.query(
      'CALL CastVote(?, ?, ?)',
      [juryId, nominationId, categoryId],
    )
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const e = new Error('You already voted in this category')
      e.status = 409
      throw e
    }
    throw err
  }

  // Fetch inserted vote
  const [rows] = await appPool.query(
    `SELECT id, jury_id, nomination_id, award_category_id, cast_at
     FROM Votes
     WHERE jury_id = ? AND award_category_id = ?
     LIMIT 1`,
    [juryId, categoryId],
  )

  return rows[0]
}

// voters can change their mind and take back their vote
export async function revokeVoteSafe(juryId, voteId) {
  const [voteRows] = await appPool.query(
    `SELECT v.id, ac.start_time, ac.end_time
     FROM Votes v
     JOIN Award_Category ac ON ac.id = v.award_category_id
     WHERE v.id = ? AND v.jury_id = ?
     LIMIT 1`,
    [voteId, juryId],
  )
  if (voteRows.length === 0) {
    const error = new Error('Vote not found or already removed.')
    error.status = 404
    throw error
  }

  const slot = voteRows[0]
  const now = Date.now()
  const startMs = slot.start_time ? new Date(slot.start_time).getTime() : Number.NEGATIVE_INFINITY
  const endMs = slot.end_time ? new Date(slot.end_time).getTime() : Number.POSITIVE_INFINITY
  if (now < startMs || now > endMs) {
    const error = new Error('Vote can only be revoked while the voting window is active.')
    error.status = 403
    throw error
  }

  const [result] = await appPool.query('DELETE FROM Votes WHERE id = ? AND jury_id = ? LIMIT 1', [voteId, juryId])
  if (!result?.affectedRows) {
    const error = new Error('Vote not found or already removed.')
    error.status = 404
    throw error
  }
  return { vote_id: voteId }
}

// getting the vote summary from our database view
export async function getVoteSummary() {
  const [rows] = await appPool.query('SELECT * FROM Vote_Summary ORDER BY category, total_votes DESC')
  return rows
}

// finding who won each category
export async function getWinners() {
  const [rows] = await appPool.query('SELECT * FROM Winners ORDER BY category')
  return rows
}

// getting more details about nominations from a view
export async function getNominationDetails() {
  const [rows] = await appPool.query('SELECT * FROM Nomination_Details ORDER BY year DESC, category, movie')
  return rows
}

// stats for our dashboard about categories
export async function getCategoryStats() {
  const [resultSets] = await appPool.query('CALL CategoryStats()')
  return resultSets[0] || []
}

// a complex query with join and group by to count votes per movie
export async function getComplexMovieVoteQuery() {
  const [rows] = await appPool.query(`
    SELECT 
      m.title,
      COUNT(v.id) AS vote_count
    FROM Votes v
    JOIN Nominations n ON v.nomination_id = n.id
    JOIN Movies m ON n.movie_id = m.id
    GROUP BY m.title
    HAVING vote_count > 0
  `)
  return rows
}

export async function getTopNominationsViaSubquery() {
  const [rows] = await appPool.query(`
    SELECT nomination_id
    FROM Votes
    GROUP BY nomination_id
    HAVING COUNT(*) = (
      SELECT MAX(cnt)
      FROM (
        SELECT COUNT(*) AS cnt
        FROM Votes
        GROUP BY nomination_id
      ) t
    )
  `)
  return rows
}

// using a simple count to get votes for a nomination
export async function getVotesByFunction(nominationId) {
  const [rows] = await appPool.query('SELECT COUNT(*) AS total_votes FROM Votes WHERE nomination_id = ?', [nominationId])
  return rows[0]?.total_votes ?? 0
}

export async function createNomination(awardCategoryId, movieId, personId) {
  try {
    await appPool.query(
      'CALL CreateNomination(?, ?, ?)',
      [awardCategoryId, movieId, personId],
    )
    const [rows] = await appPool.query(
      'SELECT id, award_category_id, movie_id, person_id FROM Nominations WHERE award_category_id = ? AND movie_id = ? AND (person_id <=> ?) ORDER BY id DESC LIMIT 1',
      [awardCategoryId, movieId, personId],
    )
    return rows[0] ? toNominationDto(rows[0]) : null
  } catch (dbError) {
    if (dbError?.code === 'ER_DUP_ENTRY') {
      const error = new Error('Nomination already exists.')
      error.status = 409
      throw error
    }
    throw dbError
  }
}

// updating an existing nomination with new values
export async function updateNomination(nominationId, awardCategoryId, movieId, personId) {
  try {
    await appPool.query(
      'CALL UpdateNomination(?, ?, ?, ?)',
      [nominationId, awardCategoryId, movieId, personId],
    )
  } catch (dbError) {
    if (dbError?.code === 'ER_DUP_ENTRY') {
      const error = new Error('This nomination already exists.')
      error.status = 409
      throw error
    }
    if (dbError?.code === 'ER_SIGNAL_EXCEPTION') {
      const error = new Error(dbError?.sqlMessage || 'Nomination violates category constraints.')
      error.status = /duplicate/i.test(error.message) ? 409 : /not found/i.test(error.message) ? 404 : 400
      throw error
    }
    throw dbError
  }

  const [rows] = await appPool.query('SELECT id, award_category_id, movie_id, person_id FROM Nominations WHERE id = ? LIMIT 1', [nominationId])
  if (!rows[0]) {
    const error = new Error('Nomination not found.')
    error.status = 404
    throw error
  }
  return rows[0] ? toNominationDto(rows[0]) : null
}

// deleting a nomination if needed
export async function deleteNomination(nominationId) {
  const [result] = await appPool.query('DELETE FROM Nominations WHERE id = ? LIMIT 1', [nominationId])
  if (!result?.affectedRows) {
    const error = new Error('Nomination not found or already deleted.')
    error.status = 404
    throw error
  }
  return { nomination_id: nominationId }
}

// adding a new category to the Categories table
export async function createCategory(name, nomineeType = 'ANY_CREW') {
  const [result] = await appPool.query('INSERT INTO Categories (name, nominee_type) VALUES (?, ?)', [name, nomineeType])
  const [rows] = await appPool.query('SELECT id, name, nominee_type FROM Categories WHERE id = ? LIMIT 1', [result.insertId])
  return rows[0] ? { category_id: rows[0].id, name: rows[0].name, nominee_type: rows[0].nominee_type } : null
}

// updating a category and also cleaning up nominations that don't fit anymore
export async function updateCategory(categoryId, name, nomineeType = 'ANY_CREW') {
  // getting a connection for transaction
  const conn = await appPool.getConnection()
  try {
    // starting a transaction to make sure all updates happen together
    await conn.beginTransaction()

    const [result] = await conn.query('UPDATE Categories SET name = ?, nominee_type = ? WHERE id = ?', [name, nomineeType, categoryId])
    if (!result?.affectedRows) {
      const error = new Error('Category not found.')
      error.status = 404
      throw error
    }

    // if type is now MOVIE, we need to clear person_id
    if (nomineeType === 'MOVIE') {
      // delete nominations that would become duplicates after setting person_id to NULL
      await conn.query(
        `DELETE n
         FROM Nominations n
         JOIN Award_Category ac ON ac.id = n.award_category_id
         WHERE ac.category_id = ?
           AND EXISTS (
             SELECT 1
             FROM Nominations n2
             WHERE n2.award_category_id = n.award_category_id
               AND n2.movie_id = n.movie_id
               AND n2.person_id IS NULL
           )`,
        [categoryId],
      )
      // now set all person_id to NULL for this category
      await conn.query(
        `UPDATE Nominations n
         JOIN Award_Category ac ON ac.id = n.award_category_id
         SET n.person_id = NULL
         WHERE ac.category_id = ?`,
        [categoryId],
      )
    } else {
      // if type is a crew role, delete nominations where the person doesn't have that role
      const roleFilter = nomineeType === 'ANY_CREW' ? '' : 'AND mc.role = ?'
      const params = nomineeType === 'ANY_CREW' ? [categoryId] : [nomineeType, categoryId]
      await conn.query(
        `DELETE n
         FROM Nominations n
         JOIN Award_Category ac ON ac.id = n.award_category_id
         LEFT JOIN Movie_Crew mc
           ON mc.movie_id = n.movie_id
          AND mc.person_id = n.person_id
          ${roleFilter}
         WHERE ac.category_id = ?
           AND (n.person_id IS NULL OR mc.person_id IS NULL)`,
        params,
      )
    }

    await conn.commit()
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
  return { category_id: categoryId, name, nominee_type: nomineeType }
}

// removing a category from the system
export async function deleteCategory(categoryId) {
  const [result] = await appPool.query('DELETE FROM Categories WHERE id = ? LIMIT 1', [categoryId])
  if (!result?.affectedRows) {
    const error = new Error('Category not found or already deleted.')
    error.status = 404
    throw error
  }
  return { category_id: categoryId }
}

// function to add a new user to the system
export async function createUser(name, email, password, role) {
  const dbRole = role === 'admin' ? 'ADMIN' : 'VOTER'
  const [result] = await appPool.query(
    'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, dbRole],
  )
  return { user_id: result.insertId, name, email, password, role }
}

// updating user details like name or role
export async function updateUser(userId, name, email, password, role) {
  const dbRole = role === 'admin' ? 'ADMIN' : 'VOTER'
  await appPool.query(
    'UPDATE Users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
    [name, email, password, dbRole, userId],
  )
  return { user_id: userId, name, email, password, role }
}

// deleting a user from the system
export async function deleteUser(userId) {
  await appPool.query('DELETE FROM Users WHERE id = ?', [userId])
  return { user_id: userId }
}

// adding a new person to the People table
export async function createPerson(firstName, lastName, birthDate, nationality) {
  const [result] = await appPool.query(
    'INSERT INTO People (first_name, last_name, birth_date, nationality) VALUES (?, ?, ?, ?)',
    [firstName, lastName, birthDate || null, nationality || null],
  )
  return { person_id: result.insertId, first_name: firstName, last_name: lastName, birth_date: birthDate, nationality }
}

// updating person details
export async function updatePerson(personId, firstName, lastName, birthDate, nationality) {
  await appPool.query(
    'UPDATE People SET first_name = ?, last_name = ?, birth_date = ?, nationality = ? WHERE id = ?',
    [firstName, lastName, birthDate || null, nationality || null, personId],
  )
  return { person_id: personId, first_name: firstName, last_name: lastName, birth_date: birthDate, nationality }
}

// deleting a person from the db
export async function deletePerson(personId) {
  await appPool.query('DELETE FROM People WHERE id = ?', [personId])
  return { person_id: personId }
}

// adding a new movie to the system
export async function createMovie(title, releaseYear, duration, description) {
  const [result] = await appPool.query(
    'INSERT INTO Movies (title, release_year, duration, description) VALUES (?, ?, ?, ?)',
    [title, releaseYear, duration, description],
  )
  return { movie_id: result.insertId, title, release_year: releaseYear, duration, description }
}

// updating movie details
export async function updateMovie(movieId, title, releaseYear, duration, description) {
  await appPool.query(
    'UPDATE Movies SET title = ?, release_year = ?, duration = ?, description = ? WHERE id = ?',
    [title, releaseYear, duration, description, movieId],
  )
  return { movie_id: movieId, title, release_year: releaseYear, duration, description }
}

// deleting a movie from the db
export async function deleteMovie(movieId) {
  await appPool.query('DELETE FROM Movies WHERE id = ?', [movieId])
  return { movie_id: movieId }
}

// adding or updating a crew member for a movie
export async function upsertMovieCrew(movieId, personId, role, characterName) {
  // Movie_Crew has composite PK, (movie_id, person_id, role)
  // We'll check if exists, then update or insert.
  const [rows] = await appPool.query(
    'SELECT * FROM Movie_Crew WHERE movie_id = ? AND person_id = ? AND role = ?',
    [movieId, personId, role],
  )
  if (rows.length > 0) {
    await appPool.query(
      'UPDATE Movie_Crew SET character_name = ? WHERE movie_id = ? AND person_id = ? AND role = ?',
      [characterName, movieId, personId, role],
    )
  } else {
    await appPool.query(
      'INSERT INTO Movie_Crew (movie_id, person_id, role, character_name) VALUES (?, ?, ?, ?)',
      [movieId, personId, role, characterName],
    )
  }
  return { movie_id: movieId, person_id: personId, role, character_name: characterName }
}

// removing a crew member from a movie
export async function deleteMovieCrew(movieId, personId, role) {
  await appPool.query(
    'DELETE FROM Movie_Crew WHERE movie_id = ? AND person_id = ? AND role = ?',
    [movieId, personId, role],
  )
  return { movie_id: movieId, person_id: personId, role }
}

// creating a new award year
export async function createAward(name, year, description) {
  const [result] = await appPool.query(
    'INSERT INTO Awards (name, year, description) VALUES (?, ?, ?)',
    [name, year, description],
  )
  return { award_id: result.insertId, name, year, description }
}

// updating award details
export async function updateAward(awardId, name, year, description) {
  await appPool.query(
    'UPDATE Awards SET name = ?, year = ?, description = ? WHERE id = ?',
    [name, year, description, awardId],
  )
  return { award_id: awardId, name, year, description }
}

// deleting an award
export async function deleteAward(awardId) {
  await appPool.query('DELETE FROM Awards WHERE id = ?', [awardId])
  return { award_id: awardId }
}

// creating a new voting slot (award + category)
export async function createAwardCategory(awardId, categoryId, startTime, endTime) {
  const [result] = await appPool.query(
    'INSERT INTO Award_Category (award_id, category_id, start_time, end_time) VALUES (?, ?, ?, ?)',
    [awardId, categoryId, startTime || null, endTime || null],
  )
  return {
    award_category_id: result.insertId,
    award_id: awardId,
    category_id: categoryId,
    start_time: startTime,
    end_time: endTime,
  }
}

// updating a voting slot window
export async function updateAwardCategory(acId, awardId, categoryId, startTime, endTime) {
  await appPool.query(
    'UPDATE Award_Category SET award_id = ?, category_id = ?, start_time = ?, end_time = ? WHERE id = ?',
    [awardId, categoryId, startTime || null, endTime || null, acId],
  )
  return {
    award_category_id: acId,
    award_id: awardId,
    category_id: categoryId,
    start_time: startTime,
    end_time: endTime,
  }
}

// removing a voting slot
export async function deleteAwardCategory(acId) {
  await appPool.query('DELETE FROM Award_Category WHERE id = ?', [acId])
  return { award_category_id: acId }
}
