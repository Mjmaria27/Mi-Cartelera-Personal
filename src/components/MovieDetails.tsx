
import { useEffect, useState } from 'react'

type MovieDetailsProps = {
  movieId: number
  title: string
  posterPath: string | null
  personalRating?: number | null
  personalComment?: string | null
  onBack: () => void
}

type MovieDetailsData = {
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  runtime: number | null
  genres: { id: number; name: string }[]
}

type CastMember = {
  id: number
  name: string
  character: string
  profile_path: string | null
}

type CreditsResponse = {
  cast: CastMember[]
}

export default function MovieDetails({
  movieId,
  title,
  posterPath,
  personalRating,
  personalComment,
  onBack,
}: MovieDetailsProps) {
  const [details, setDetails] =
    useState<MovieDetailsData | null>(null)

  const [cast, setCast] = useState<CastMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchDetails() {
      setLoading(true)
      setError('')

      const apiKey = import.meta.env.VITE_TMDB_API_KEY

      if (!apiKey) {
        setError('No se encontró la API Key de TMDB.')
        setLoading(false)
        return
      }

      try {
        const [detailsResponse, creditsResponse] =
          await Promise.all([
            fetch(
              `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=es-ES`
            ),
            fetch(
              `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}&language=es-ES`
            ),
          ])

        if (!detailsResponse.ok || !creditsResponse.ok) {
          throw new Error(
            'No se pudieron cargar los detalles de la película.'
          )
        }

        const detailsData: MovieDetailsData =
          await detailsResponse.json()

        const creditsData: CreditsResponse =
          await creditsResponse.json()

        if (!cancelled) {
          setDetails(detailsData)
          setCast(creditsData.cast ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Ocurrió un error al cargar la película.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchDetails()

    return () => {
      cancelled = true
    }
  }, [movieId])

  return (
    <main className="movie-details-page">
      <button
        type="button"
        className="movie-details-back"
        onClick={onBack}
      >
        ← Volver a mi cartelera
      </button>

      {loading && (
        <p>Cargando detalles de la película...</p>
      )}

      {error && (
        <p role="alert">{error}</p>
      )}

      {!loading && !error && details && (
        <>
          <section className="movie-details-header">
            {details.backdrop_path && (
              <img
                className="movie-details-backdrop"
                src={`https://image.tmdb.org/t/p/w1280${details.backdrop_path}`}
                alt=""
              />
            )}

            <div className="movie-details-main">
              {details.poster_path || posterPath ? (
                <img
                  className="movie-details-poster"
                  src={`https://image.tmdb.org/t/p/w500${details.poster_path ?? posterPath}`}
                  alt={`Póster de ${details.title || title}`}
                />
              ) : (
                <div className="movie-no-poster">
                  Póster no disponible
                </div>
              )}

              <div className="movie-details-info">
                <h1>{details.title || title}</h1>

                {details.release_date && (
                  <p>
                    Año: {details.release_date.slice(0, 4)}
                  </p>
                )}

                {details.runtime != null &&
                  details.runtime > 0 && (
                    <p>
                      Duración: {details.runtime} minutos
                    </p>
                  )}

                {details.genres?.length > 0 && (
                  <p>
                    Géneros:{' '}
                    {details.genres
                      .map((genre) => genre.name)
                      .join(', ')}
                  </p>
                )}

                <p>
                  ⭐ {Number(
                    details.vote_average ?? 0
                  ).toFixed(1)}{' '}
                  / 10 en TMDB
                </p>

                <h2>Sinopsis</h2>

                <p className="movie-details-overview">
                  {details.overview ||
                    'Sin sinopsis disponible.'}
                </p>
              </div>
            </div>
          </section>

          <section className="movie-details-personal">
            <h2>Mi valoración personal</h2>

            <div
              className="star-rating"
              aria-label={`Tu calificación: ${personalRating ?? 0} de 5 estrellas`}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={
                    star <= (personalRating ?? 0)
                      ? 'star-button selected'
                      : 'star-button'
                  }
                >
                  ★
                </span>
              ))}
            </div>

            <h3>Mi comentario</h3>

            <p>
              {personalComment?.trim()
                ? personalComment
                : 'Todavía no has escrito un comentario para esta película.'}
            </p>
          </section>

          <section className="movie-details-cast">
            <h2>Elenco principal</h2>

            {cast.length > 0 ? (
              <div className="movie-cast-grid">
                {cast.slice(0, 12).map((actor) => (
                  <article
                    className="movie-cast-card"
                    key={actor.id}
                  >
                    {actor.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={`Foto de ${actor.name}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="movie-cast-no-photo">
                        Foto no disponible
                      </div>
                    )}

                    <h3>{actor.name}</h3>

                    <p>
                      {actor.character ||
                        'Personaje no disponible'}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p>
                No hay información del elenco disponible.
              </p>
            )}
          </section>
        </>
      )}

      <footer className="home-footer">
        Datos e imágenes proporcionados por TMDB.
      </footer>
    </main>
  )
}
