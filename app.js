const express = require('express')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')

const dbPath = path.join(__dirname, 'moviesData.db')

const app = express()

app.use(express.json())

let db = null

const convrtMovieDBObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

const convrtDirectorDBObjectToResponseObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server Running at http://localhost:3000')
    })
  } catch (e) {
    console.error(`DB Error : ${e.message}`)

    process.exit(1)
  }
}
intializeDBAndServer()

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
  SELECT movie_name FROM movie;`

  const moviesList = await db.all(getMoviesQuery)

  response.send(
    moviesList.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
    SELECT 
      *
      FROM movie
      WHERE movie_id = ${movieId};
    `
  const movie = await db.get(getMovieQuery)
  response.send(convrtMovieDBObjectToResponseObject(movie))
})

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const addMovieQuery = `
    INSERT INTO movie (director_id, movie_name, lead_actor)
    VALUES (${directorId}, '${movieName}', '${leadActor}');`
  await db.run(addMovieQuery)
  response.send('Movie Successfully Added')
})

app.put('/movie/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = request.body
  const updateMovieQuery = `
      UPDATE movie 
      SET
        directer_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
      WHERE 
        movie_id = ${movieId};
      `

  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE FROM movie WHERE movie_id = ${movieId};
  `
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getDirectorsQuery = `
  SELECT 
    *
   FROM director ;`
  const directors = await db.all(getDirectorsQuery)
  response.send(
    directors.map(eachDirector =>
      convrtDirectorDBObjectToResponseObject(eachDirector),
    ),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getMovieDirectorsQuery = `
    SELECT movie_name
    FROM movie 
    WHERE director_id = ${directorId};
  `
  const dmovies = await db.all(getMovieDirectorsQuery)
  response.send(dmovies.map(eachMovie => ({movieName: eachMovie.movie_name})))
})

module.exports = app
