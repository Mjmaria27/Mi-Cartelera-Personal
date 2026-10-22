
import { useEffect, useState } from 'react'
import '../App.css'

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
  tagline: string
  genres: {
    id: number
    name: string
  }[]
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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // CONSULTAR DETALLES EN TMDB
  useEffect(() => {
    let cancelled = false

    async function fetchDetails() {
      setLoading(true)
      setError('')
      setDetails(null)

      const apiKey = import.meta.env.VITE_TMDB_API_KEY

      if (!apiKey) {
        setError('No se encontró la API Key de TMDB.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=es-ES`
        )

        if (!response.ok) {
          throw new Error(
            'No se pudieron cargar los detalles de la película.'
          )
        }

        const data: MovieDetailsData =
          await response.json()

        if (!cancelled) {
          setDetails(data)
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

  const movieTitle = details?.title || title

  const year = details?.release_date
    ? details.release_date.slice(0, 4)
    : 'Sin fecha'

  const imagePath =
    details?.poster_path ?? posterPath

  const rating = Number(details?.vote_average ?? 0)

  const runtime = details?.runtime

  const duration =
    runtime != null && runtime > 0
      ? `${Math.floor(runtime / 60)}h ${runtime % 60}min`
      : 'No disponible'

  return (
    <main className="editorial-details-page">

      {/* NAVEGACIÓN */}
      <header className="details-navbar">
        <span className="details-brand">
          MI CARTELERA<span>.</span>
        </span>

        <button
          type="button"
          className="details-back-button"
          onClick={onBack}
        >
          ← Volver a mi colección
        </button>
      </header>

      {/* CARGA */}
      {loading && (
        <div
          className="details-loading"
          role="status"
        >
          <span className="editorial-eyebrow">
            MI CARTELERA / ARCHIVO DE CINE
          </span>

          <h1>Preparando tu próxima escena...</h1>

          <p>
            Cargando información de la película.
          </p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="details-loading">
          <h1>No pudimos cargar la película.</h1>

          <p role="alert">{error}</p>

          <button
            type="button"
            className="details-return-button"
            onClick={onBack}
          >
            Volver a mi colección
          </button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {!loading && !error && details && (
        <>

          {/* PORTADA CINEMATOGRÁFICA */}
          <section className="details-hero">

            {details.backdrop_path && (
              <img
                className="details-hero-image"
                src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
                alt=""
              />
            )}

            <div className="details-hero-content">
              <span className="editorial-eyebrow">
                MI ARCHIVO CINEMATOGRÁFICO / {year}
              </span>

              <h1>{movieTitle}</h1>

              {details.tagline && (
                <p className="details-tagline">
                  {details.tagline}
                </p>
              )}

              <div className="details-hero-meta">
                <span>{year}</span>

                {duration !== 'No disponible' && (
                  <span>{duration}</span>
                )}

                <span>
                  ★ {rating.toFixed(1)} / 10 TMDB
                </span>
              </div>
            </div>
          </section>

          {/* FICHA CINEMATOGRÁFICA */}
          <section className="details-overview-section">

            <div className="details-poster-column">

              {imagePath ? (
                <img
                  className="details-main-poster"
                  src={`https://image.tmdb.org/t/p/w500${imagePath}`}
                  alt={`Póster de ${movieTitle}`}
                />
              ) : (
                <div className="details-no-poster">
                  Póster no disponible
                </div>
              )}

              <span className="details-poster-caption">
                FICHA CINEMATOGRÁFICA / TMDB
              </span>
            </div>

            <div className="details-overview-content">

              <span className="editorial-eyebrow">
                01 / SOBRE LA PELÍCULA
              </span>

              <h2>
                Una historia que
                <br />
                <em>merece ser contada.</em>
              </h2>

              <div className="details-genres">
                {details.genres?.map((genre) => (
                  <span key={genre.id}>
                    {genre.name}
                  </span>
                ))}
              </div>

              <div className="details-divider" />

              <h3>Sinopsis</h3>

              <p className="details-synopsis">
                {details.overview ||
                  'No hay una sinopsis disponible para esta película.'}
              </p>

              <div className="details-film-data">

                <div>
                  <span>AÑO DE ESTRENO</span>
                  <strong>{year}</strong>
                </div>

                <div>
                  <span>DURACIÓN</span>
                  <strong>{duration}</strong>
                </div>

                <div>
                  <span>VALORACIÓN TMDB</span>
                  <strong>
                    ★ {rating.toFixed(1)} / 10
                  </strong>
                </div>

              </div>
            </div>
          </section>

          {/* RESEÑA PERSONAL */}
          <section className="details-review-section">

            <div className="details-review-heading">

              <span className="editorial-eyebrow">
                02 / MI EXPERIENCIA
              </span>

              <h2>
                Mi mirada
                <br />
                <em>sobre esta historia.</em>
              </h2>

              <p>
                Cada película deja una impresión.
                Esta es la tuya.
              </p>

            </div>

            <div className="details-review-card">

              <span className="editorial-eyebrow">
                MI CALIFICACIÓN PERSONAL
              </span>

              <div
                className="details-rating-stars"
                aria-label={`Tu calificación: ${personalRating ?? 0} de 5 estrellas`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      star <= (personalRating ?? 0)
                        ? 'active'
                        : ''
                    }
                  >
                    ★
                  </span>
                ))}
              </div>

              <p className="details-rating-label">
                {personalRating
                  ? `${personalRating} de 5 estrellas`
                  : 'Todavía no has calificado esta película.'}
              </p>

              <div className="details-divider" />

              <span className="editorial-eyebrow">
                MI RESEÑA
              </span>

              <p className="details-personal-comment">
                {personalComment?.trim()
                  ? personalComment
                  : 'Aún no has escrito un comentario para esta película. Puedes hacerlo desde el editor de tu colección.'}
              </p>

              <span className="details-review-signature">
                — MI CARTELERA PERSONAL
              </span>

            </div>
          </section>

          {/* CIERRE EDITORIAL */}
          <section className="details-closing">

            <span className="editorial-eyebrow">
              FIN DE LA FUNCIÓN
            </span>

            <h2>
              Cada historia
              <br />
              <em>deja una huella.</em>
            </h2>

            <p>
              Sigue descubriendo películas y construyendo
              tu propia colección cinematográfica.
            </p>

            <button
              type="button"
              onClick={onBack}
            >
              ← Regresar a mi colección
            </button>

          </section>

          {/* FOOTER */}
          <footer className="details-footer">

            <span className="details-footer-logo">
              MI CARTELERA<span>.</span>
            </span>

            <p>
              Datos e imágenes proporcionados por TMDB.
              Esta aplicación no está avalada ni certificada
              por TMDB.
            </p>

          </footer>

        </>
      )}
    </main>
  )
}
