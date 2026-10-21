
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../supabase'
import '../App.css'
import MovieDetails from './MovieDetails'

type WatchStatus = 'por ver' | 'viendo' | 'vista'

type Movie = {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  backdrop_path?: string | null
  overview: string
  vote_average: number
  release_date?: string
  first_air_date?: string
}

type SavedMovie = {
  id: number
  movie_id: number
  title: string
  poster_path: string | null
  media_type: string
  watch_status: WatchStatus
  personal_rating: number | null
  personal_comment: string | null
}

type TMDBResponse = {
  results: Movie[]
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [myList, setMyList] = useState<SavedMovie[]>([])
  const [selectedMovie, setSelectedMovie] =
    useState<SavedMovie | null>(null)

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [listError, setListError] = useState('')

  const [hasSearched, setHasSearched] = useState(false)
  const [savingMovieId, setSavingMovieId] =
    useState<number | null>(null)
  const [removingMovieId, setRemovingMovieId] =
    useState<number | null>(null)
  const [updatingMovieId, setUpdatingMovieId] =
    useState<number | null>(null)

  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  const [editStatus, setEditStatus] =
    useState<Record<number, WatchStatus>>({})
  const [editRating, setEditRating] =
    useState<Record<number, string>>({})
  const [editComment, setEditComment] =
    useState<Record<number, string>>({})

  // Películas guardadas por el usuario
  const savedMovieIds = myList.map(
    (movie) => movie.movie_id
  )

  // Película protagonista del Home
  const featuredMovie = movies.find(
    (movie) => movie.backdrop_path && movie.overview
  )

  // ====================================
  // CARGAR MI COLECCIÓN DESDE SUPABASE
  // ====================================

  async function fetchMyList() {
    setLoadingList(true)
    setListError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'Inicia sesión para consultar tu lista.'
        )
      }

      const { data, error } = await supabase
        .from('movies')
        .select(
          'id, movie_id, title, poster_path, media_type, watch_status, personal_rating, personal_comment'
        )
        .eq('user_id', user.id)
        .eq('media_type', 'movie')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(
          'No se pudo cargar tu lista personal.'
        )
      }

      const savedMovies = (data ?? []) as SavedMovie[]

      setMyList(savedMovies)

      setEditStatus(
        Object.fromEntries(
          savedMovies.map((movie) => [
            movie.id,
            movie.watch_status,
          ])
        )
      )

      setEditRating(
        Object.fromEntries(
          savedMovies.map((movie) => [
            movie.id,
            movie.personal_rating == null
              ? '0'
              : String(movie.personal_rating),
          ])
        )
      )

      setEditComment(
        Object.fromEntries(
          savedMovies.map((movie) => [
            movie.id,
            movie.personal_comment ?? '',
          ])
        )
      )
    } catch (err: unknown) {
      setListError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al cargar tu lista.'
      )
    } finally {
      setLoadingList(false)
    }
  }

  // ====================================
  // CARGAR PELÍCULAS POPULARES DE TMDB
  // ====================================

  useEffect(() => {
    async function fetchMovies() {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY

      if (!apiKey) {
        setError('No se encontró la API Key de TMDB.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=es-ES&page=1`
        )

        if (!response.ok) {
          throw new Error(
            'No se pudieron cargar las películas populares.'
          )
        }

        const data: TMDBResponse = await response.json()

        setMovies(data.results ?? [])
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al cargar el catálogo.'
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchMovies()
    void fetchMyList()
  }, [])

  // ====================================
  // AGREGAR PELÍCULA A MI COLECCIÓN
  // ====================================

  async function handleSaveMovie(movie: Movie) {
    setSaveMessage('')
    setSaveError('')
    setSavingMovieId(movie.id)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'Inicia sesión para guardar películas.'
        )
      }

      const title =
        movie.title ??
        movie.name ??
        'Título no disponible'

      const { error } = await supabase
        .from('movies')
        .insert({
          user_id: user.id,
          movie_id: movie.id,
          title,
          poster_path: movie.poster_path,
          media_type: 'movie',
          watch_status: 'por ver',
        })

      if (error) {
        if (error.code === '23505') {
          await fetchMyList()

          setSaveMessage(
            'Esta película ya está en tu lista.'
          )
          return
        }

        throw new Error(
          'No se pudo guardar la película. Inténtalo de nuevo.'
        )
      }

      await fetchMyList()

      setSaveMessage(
        `¡${title} se añadió a tu lista!`
      )
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar la película.'
      )
    } finally {
      setSavingMovieId(null)
    }
  }

  // ====================================
  // ACTUALIZAR UNA PELÍCULA GUARDADA
  // ====================================

  async function handleUpdateMovie(movie: SavedMovie) {
    setSaveMessage('')
    setSaveError('')
    setUpdatingMovieId(movie.id)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'Inicia sesión para editar tu lista.'
        )
      }

      const ratingText =
        editRating[movie.id] ?? '0'

      const ratingNumber = Number(ratingText)

      const rating =
        ratingNumber === 0
          ? null
          : ratingNumber

      if (
        rating !== null &&
        (
          !Number.isInteger(rating) ||
          rating < 1 ||
          rating > 5
        )
      ) {
        throw new Error(
          'La calificación debe estar entre 1 y 5 estrellas.'
        )
      }

      const status =
        editStatus[movie.id] ?? 'por ver'

      const { data, error } = await supabase
        .from('movies')
        .update({
          watch_status: status,
          personal_rating: rating,
          personal_comment:
            editComment[movie.id] ?? '',
        })
        .eq('id', movie.id)
        .eq('user_id', user.id)
        .select('id')

      if (error) {
        throw new Error(
          'No se pudieron guardar los cambios.'
        )
      }

      if (!data || data.length === 0) {
        throw new Error(
          'No se pudo actualizar la película. Revisa tus permisos.'
        )
      }

      await fetchMyList()

      setSaveMessage(
        `Cambios guardados para «${movie.title}».`
      )
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al actualizar la película.'
      )
    } finally {
      setUpdatingMovieId(null)
    }
  }

  // ====================================
  // ELIMINAR PELÍCULA DE MI COLECCIÓN
  // ====================================

  async function handleRemoveMovie(movie: SavedMovie) {
    setSaveMessage('')
    setSaveError('')
    setRemovingMovieId(movie.movie_id)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'Inicia sesión para modificar tu lista.'
        )
      }

      const { data, error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movie.id)
        .eq('user_id', user.id)
        .select('id')

      if (error) {
        throw new Error(
          'No se pudo quitar la película de tu lista.'
        )
      }

      if (!data || data.length === 0) {
        throw new Error(
          'No se pudo eliminar la película. Revisa tus permisos.'
        )
      }

      setMyList((previous) =>
        previous.filter(
          (saved) => saved.id !== movie.id
        )
      )

      if (selectedMovie?.id === movie.id) {
        setSelectedMovie(null)
      }

      setSaveMessage(
        `«${movie.title}» se quitó de tu lista.`
      )
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al quitar la película.'
      )
    } finally {
      setRemovingMovieId(null)
    }
  }

  // ====================================
  // BUSCAR PELÍCULAS EN TMDB
  // ====================================

  async function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const query = search.trim()

    if (!query) {
      setSearchError(
        'Escribe el nombre de una película.'
      )
      setHasSearched(false)
      return
    }

    const apiKey =
      import.meta.env.VITE_TMDB_API_KEY

    if (!apiKey) {
      setSearchError(
        'No se encontró la API Key de TMDB.'
      )
      setHasSearched(false)
      return
    }

    setSearching(true)
    setSearchError('')
    setHasSearched(true)
    setSaveMessage('')
    setSaveError('')

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=es-ES&page=1&include_adult=false`
      )

      if (!response.ok) {
        throw new Error(
          'No se pudo realizar la búsqueda.'
        )
      }

      const data: TMDBResponse =
        await response.json()

      setSearchResults(data.results ?? [])
    } catch (err: unknown) {
      setSearchResults([])

      setSearchError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al buscar películas.'
      )
    } finally {
      setSearching(false)
    }
  }

  function clearSearch() {
    setSearch('')
    setSearchResults([])
    setSearchError('')
    setHasSearched(false)
    setSaveMessage('')
    setSaveError('')
  }

  // ====================================
  // TARJETAS DE PELÍCULAS
  // ====================================

  function renderMovie(movie: Movie) {
    const title =
      movie.title ??
      movie.name ??
      'Título no disponible'

    const releaseDate =
      movie.release_date ??
      movie.first_air_date

    const year = releaseDate
      ? releaseDate.slice(0, 4)
      : 'Año desconocido'

    const isSaved =
      savedMovieIds.includes(movie.id)

    return (
      <article
        className="movie-card"
        key={movie.id}
      >
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={`Póster de ${title}`}
            loading="lazy"
          />
        ) : (
          <div className="movie-no-poster">
            Póster no disponible
          </div>
        )}

        <div className="movie-info">
          <h3>{title}</h3>

          <p>📅 {year}</p>

          <p>
            ⭐ {Number(
              movie.vote_average ?? 0
            ).toFixed(1)} / 10 (TMDB)
          </p>

          <p className="movie-overview">
            {movie.overview ||
              'Sin sinopsis disponible.'}
          </p>

          <button
            type="button"
            onClick={() =>
              handleSaveMovie(movie)
            }
            disabled={
              isSaved ||
              savingMovieId === movie.id
            }
          >
            {savingMovieId === movie.id
              ? 'Guardando...'
              : isSaved
                ? '✓ En mi lista'
                : '＋ Añadir a mi lista'}
          </button>
        </div>
      </article>
    )
  }

  // ====================================
  // PÁGINA DE DETALLES
  // ====================================

  if (selectedMovie) {
    return (
      <MovieDetails
        movieId={selectedMovie.movie_id}
        title={selectedMovie.title}
        posterPath={selectedMovie.poster_path}
        personalRating={
          Number(
            editRating[selectedMovie.id] ?? '0'
          ) || null
        }
        personalComment={
          editComment[selectedMovie.id] ?? ''
        }
        onBack={() =>
          setSelectedMovie(null)
        }
      />
    )
  }

  // ====================================
  // HOME EDITORIAL
  // ====================================

  return (
    <main className="home-container">

      {/* NAVEGACIÓN */}
      <header className="home-header">
        <a
          href="#inicio"
          className="home-logo"
        >
          MI CARTELERA<span>.</span>
        </a>

        <nav
          className="home-nav"
          aria-label="Navegación principal"
        >
          <a href="#explorar">
            Explorar
          </a>

          <a href="#mi-coleccion">
            Mi colección
          </a>
        </nav>
      </header>

      {/* INTRODUCCIÓN */}
      <section
        className="editorial-intro"
        id="inicio"
      >
        <span className="editorial-eyebrow">
          TU UNIVERSO CINEMATOGRÁFICO / 2026
        </span>

        <h1>
          El cine se vive.
          <br />
          <em>
            Las historias permanecen.
          </em>
        </h1>

        <p>
          Descubre nuevas películas,
          guarda tus favoritas y construye
          una colección que cuente tu historia.
        </p>
      </section>

      {/* PELÍCULA DESTACADA */}
      {featuredMovie && (
        <section
          className="featured-movie"
          aria-label="Película destacada"
          style={{
            backgroundImage: `
              linear-gradient(
                90deg,
                rgba(10, 8, 9, 0.96) 0%,
                rgba(10, 8, 9, 0.73) 45%,
                rgba(10, 8, 9, 0.18) 100%
              ),
              url(https://image.tmdb.org/t/p/w1280${featuredMovie.backdrop_path})
            `,
          }}
        >
          <div className="featured-content">

            <span className="editorial-eyebrow">
              SELECCIÓN DESTACADA
            </span>

            <h2>
              {featuredMovie.title ??
                featuredMovie.name}
            </h2>

            <p className="featured-description">
              {featuredMovie.overview}
            </p>

            <div className="featured-meta">
              <span>
                {featuredMovie.release_date?.slice(0, 4)}
              </span>

              <span>
                ★ {featuredMovie.vote_average.toFixed(1)}
                {' '}TMDB
              </span>
            </div>

            <button
              type="button"
              className="featured-button"
              onClick={() =>
                handleSaveMovie(featuredMovie)
              }
              disabled={
                savedMovieIds.includes(featuredMovie.id) ||
                savingMovieId === featuredMovie.id
              }
            >
              {savingMovieId === featuredMovie.id
                ? 'Guardando...'
                : savedMovieIds.includes(featuredMovie.id)
                  ? '✓ En mi colección'
                  : '+ Añadir a mi colección'}
            </button>

          </div>
        </section>
      )}

      {/* BUSCADOR */}
      <section
        className="movie-search-section"
        id="explorar"
      >
        <h2>Explorar películas</h2>

        <form
          className="movie-search-form"
          onSubmit={handleSearch}
        >
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Busca una película por su nombre..."
            aria-label="Buscar películas"
          />

          <button
            type="submit"
            disabled={searching}
          >
            {searching
              ? 'Buscando...'
              : 'Buscar'}
          </button>

          {hasSearched && (
            <button
              type="button"
              onClick={clearSearch}
            >
              Limpiar
            </button>
          )}
        </form>

        {searchError && (
          <p role="alert">
            {searchError}
          </p>
        )}

        {searching && (
          <p>Buscando películas...</p>
        )}

        {saveMessage && (
          <p role="status">
            {saveMessage}
          </p>
        )}

        {saveError && (
          <p role="alert">
            {saveError}
          </p>
        )}

        {hasSearched &&
          !searching &&
          !searchError && (
            <div className="search-results">

              <h3>
                Resultados de búsqueda
              </h3>

              {searchResults.length > 0 ? (
                <div className="movies-grid">
                  {searchResults.map(renderMovie)}
                </div>
              ) : (
                <p>
                  No encontramos películas
                  con ese nombre.
                </p>
              )}

            </div>
          )}
      </section>

      {/* MI COLECCIÓN PERSONAL */}
      <section
        className="my-list-section"
        id="mi-coleccion"
      >
        <h2>Mi colección personal</h2>

        {loadingList && (
          <p>Cargando tu lista...</p>
        )}

        {listError && (
          <p role="alert">
            {listError}
          </p>
        )}

        {!loadingList &&
          !listError &&
          myList.length === 0 && (
            <p>
              Todavía no tienes películas
              guardadas. ¡Busca una película
              y añádela a tu colección!
            </p>
          )}

        {!loadingList &&
          myList.length > 0 && (
            <div className="movies-grid">

              {myList.map((movie) => {
                const currentRating = Number(
                  editRating[movie.id] ?? '0'
                )

                return (
                  <article
                    className="movie-card"
                    key={movie.id}
                  >
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={`Póster de ${movie.title}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="movie-no-poster">
                        Póster no disponible
                      </div>
                    )}

                    <div className="movie-info">

                      <h3>
                        {movie.title}
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedMovie(movie)
                        }
                      >
                        Ver detalles →
                      </button>

                      <label
                        htmlFor={`status-${movie.id}`}
                      >
                        Estado de visualización
                      </label>

                      <select
                        id={`status-${movie.id}`}
                        value={
                          editStatus[movie.id] ??
                          'por ver'
                        }

                        onChange={(event) => {
                          const newStatus = event.target.value as WatchStatus

                          setEditStatus((previous) => ({
                            ...previous,
                            [movie.id]: newStatus,
                          }))
                        }}

                      >
                        <option value="por ver">
                          Por ver
                        </option>
                        <option value="viendo">
                          Viendo
                        </option>
                        <option value="vista">
                          Vista
                        </option>
                      </select>

                      <label
                        htmlFor={`rating-${movie.id}`}
                      >
                        Tu calificación personal
                      </label>

                      <div
                        id={`rating-${movie.id}`}
                        className="star-rating"
                        role="group"
                        aria-label={`Calificación de ${movie.title}`}
                      >
                        {[1, 2, 3, 4, 5].map(
                          (star) => (
                            <button
                              key={star}
                              type="button"
                              className={
                                star <= currentRating
                                  ? 'star-button selected'
                                  : 'star-button'
                              }
                              onClick={() =>
                                setEditRating(
                                  (previous) => ({
                                    ...previous,
                                    [movie.id]:
                                      Number(
                                        previous[movie.id] ??
                                        '0'
                                      ) === star
                                        ? '0'
                                        : String(star),
                                  })
                                )
                              }
                              aria-label={`${star} estrellas`}
                              aria-pressed={
                                star <= currentRating
                              }
                            >
                              ★
                            </button>
                          )
                        )}
                      </div>

                      <label
                        htmlFor={`comment-${movie.id}`}
                      >
                        Tu comentario personal
                      </label>

                      <textarea
                        id={`comment-${movie.id}`}
                        value={
                          editComment[movie.id] ?? ''
                        }
                        onChange={(event) =>
                          setEditComment(
                            (previous) => ({
                              ...previous,
                              [movie.id]:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="¿Qué te pareció esta película?"
                        rows={3}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateMovie(movie)
                        }
                        disabled={
                          updatingMovieId === movie.id
                        }
                      >
                        {updatingMovieId === movie.id
                          ? 'Guardando cambios...'
                          : 'Guardar cambios'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveMovie(movie)
                        }
                        disabled={
                          removingMovieId === movie.movie_id
                        }
                      >
                        {removingMovieId === movie.movie_id
                          ? 'Quitando...'
                          : 'Eliminar de mi lista'}
                      </button>

                    </div>
                  </article>
                )
              })}

            </div>
          )}
      </section>

      {/* PELÍCULAS POPULARES */}
      {!hasSearched && (
        <section className="movies-section">

          <h2>
            Selección popular
          </h2>

          {loading && (
            <p>
              Cargando películas...
            </p>
          )}

          {error && (
            <p role="alert">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="movies-grid">
              {movies.map(renderMovie)}
            </div>
          )}

        </section>
      )}

      {/* FOOTER */}
      <footer className="home-footer">
        Datos e imágenes proporcionados por TMDB.
      </footer>

    </main>
  )
}
