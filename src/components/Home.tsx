
import { useEffect, useState } from 'react'
import '../App.css'

type Movie = {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  overview: string
  vote_average: number
  release_date?: string
  first_air_date?: string
}

type TMDBResponse = {
  results: Movie[]
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

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
          throw new Error('No se pudieron cargar las películas populares.')
        }

        const data: TMDBResponse = await response.json()
        setMovies(data.results ?? [])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al cargar el catálogo.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const query = search.trim()

    if (!query) {
      setSearchError('Escribe el nombre de una película.')
      setHasSearched(false)
      return
    }

    const apiKey = import.meta.env.VITE_TMDB_API_KEY

    if (!apiKey) {
      setSearchError('No se encontró la API Key de TMDB.')
      setHasSearched(false)
      return
    }

    setSearching(true)
    setSearchError('')
    setHasSearched(true)

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=es-ES&page=1&include_adult=false`
      )

      if (!response.ok) {
        throw new Error('No se pudo realizar la búsqueda. Inténtalo de nuevo.')
      }

      const data: TMDBResponse = await response.json()
      setSearchResults(data.results ?? [])
    } catch (err) {
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
  }

  function renderMovie(movie: Movie) {
    const title = movie.title ?? movie.name ?? 'Título no disponible'
    const releaseDate = movie.release_date ?? movie.first_air_date
    const year = releaseDate ? releaseDate.slice(0, 4) : 'Año desconocido'

    return (
      <article className="movie-card" key={movie.id}>
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={`Póster de ${title}`}
            loading="lazy"
          />
        ) : (
          <div className="movie-no-poster">Póster no disponible</div>
        )}

        <div className="movie-info">
          <h3>{title}</h3>
          <p>📅 {year}</p>
          <p>⭐ {Number(movie.vote_average ?? 0).toFixed(1)} / 10</p>
          <p className="movie-overview">
            {movie.overview || 'Sin sinopsis disponible.'}
          </p>
        </div>
      </article>
    )
  }

  return (
    <main className="home-container">
      <header className="home-header">
        <h1>Mi Cartelera <span>Personal</span></h1>
        <p>Descubre tu próxima película favorita.</p>
      </header>

      <section className="movie-search-section">
        <h2>Buscar películas 🔎</h2>

        <form className="movie-search-form" onSubmit={handleSearch}>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Escribe el nombre de una película..."
            aria-label="Buscar películas"
          />
          <button type="submit" disabled={searching}>
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
          {hasSearched && (
            <button type="button" onClick={clearSearch}>
              Limpiar
            </button>
          )}
        </form>

        {searchError && <p role="alert">{searchError}</p>}
        {searching && <p>Buscando películas...</p>}

        {hasSearched && !searching && !searchError && (
          <div className="search-results">
            <h3>Resultados de búsqueda</h3>

            {searchResults.length > 0 ? (
              <div className="movies-grid">
                {searchResults.map(renderMovie)}
              </div>
            ) : (
              <p>No encontramos películas con ese nombre.</p>
            )}
          </div>
        )}
      </section>

      {!hasSearched && (
        <section className="movies-section">
          <h2>Películas populares 🍿</h2>

          {loading && <p>Cargando películas...</p>}
          {error && <p role="alert">{error}</p>}

          {!loading && !error && (
            <div className="movies-grid">
              {movies.map(renderMovie)}
            </div>
          )}
        </section>
      )}

      <footer className="home-footer">
        Datos e imágenes proporcionados por TMDB.
      </footer>
    </main>
  )
}
