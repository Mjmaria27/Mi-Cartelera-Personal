
import { useEffect, useState } from 'react'
import '../App.css'

type Movie = {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  overview: string
  vote_average: number
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          throw new Error('No se pudieron cargar las películas.')
        }

        const data = await response.json()
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

  return (
    <main className="home-container">
      <header className="home-header">
        <h1>Mi Cartelera <span>Personal</span></h1>
        <p>Descubre tu próxima película favorita.</p>
      </header>

      <section className="movies-section">
        <h2>Películas populares 🍿</h2>

        {loading && <p>Cargando películas...</p>}
        {error && <p role="alert">{error}</p>}

        {!loading && !error && (
          <div className="movies-grid">
            {movies.map((movie) => (
              <article className="movie-card" key={movie.id}>
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={`Póster de ${movie.title ?? movie.name}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="movie-no-poster">
                    Póster no disponible
                  </div>
                )}

                <div className="movie-info">
                  <h3>{movie.title ?? movie.name}</h3>
                  <p>⭐ {movie.vote_average.toFixed(1)} / 10</p>
                  <p className="movie-overview">
                    {movie.overview || 'Sin sinopsis disponible.'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="home-footer">
        Datos e imágenes proporcionados por TMDB.
      </footer>
    </main>
  )
}
