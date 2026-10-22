
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../supabase'
import MovieDetails from './MovieDetails'
import '../App.css'

type MediaType = 'movie' | 'tv'
type WatchStatus = 'por ver' | 'viendo' | 'vista'
type CollectionFilter = 'todas' | WatchStatus
type DiscoverType = 'all' | MediaType
type DiscoverSort = 'popular' | 'rating' | 'recent'
type Genre = { id: number; name: string; mediaTypes: MediaType[] }

type Movie = {
  id: number
  media_type: MediaType
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
  media_type: MediaType
  watch_status: WatchStatus
  personal_rating: number | null
  personal_comment: string | null
}

type TMDBResponse = {
  results: Movie[]
}

const posterUrl = (path: string) =>
  `https://image.tmdb.org/t/p/w500${path}`

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [expandedMovie, setExpandedMovie] = useState<Movie | null>(null)
  const [expandedSeasons, setExpandedSeasons] = useState<number | null>(null)
  const [loadingSeasons, setLoadingSeasons] = useState(false)
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [genresError, setGenresError] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [discoverType, setDiscoverType] = useState<DiscoverType>('all')
  const [discoverSort, setDiscoverSort] = useState<DiscoverSort>('popular')
  const [discoverPage, setDiscoverPage] = useState(1)
  const [discoverResults, setDiscoverResults] = useState<Movie[]>([])
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverError, setDiscoverError] = useState('')
  const [discoverHasMore, setDiscoverHasMore] = useState(false)
  const [myList, setMyList] = useState<SavedMovie[]>([])

  const [selectedMovie, setSelectedMovie] =
    useState<SavedMovie | null>(null)

  const [editingMovie, setEditingMovie] =
    useState<SavedMovie | null>(null)

  const [collectionFilter, setCollectionFilter] =
    useState<CollectionFilter>('todas')

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [listError, setListError] = useState('')

  const [hasSearched, setHasSearched] = useState(false)
  const [savingMovieId, setSavingMovieId] =
    useState<string | null>(null)
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

  const savedKeys = new Set(
    myList.map((item) => `${item.media_type}:${item.movie_id}`)
  )
  const movieKey = (movie: Movie) => `${movie.media_type}:${movie.id}`

  const featuredMovie = movies.find(
    (movie) => movie.backdrop_path && movie.overview
  )

  // CONTADORES
  const counts = {
    todas: myList.length,
    'por ver': myList.filter(
      (m) => m.watch_status === 'por ver'
    ).length,
    viendo: myList.filter(
      (m) => m.watch_status === 'viendo'
    ).length,
    vista: myList.filter(
      (m) => m.watch_status === 'vista'
    ).length,
  }

  // FILTROS
  const filteredList = myList.filter(
    (movie) =>
      collectionFilter === 'todas' ||
      movie.watch_status === collectionFilter
  )

  // CONSULTAR LAS TEMPORADAS AL ABRIR LA FICHA DE UNA SERIE
  useEffect(() => {
    setExpandedSeasons(null)
    setLoadingSeasons(false)

    if (!expandedMovie || expandedMovie.media_type !== 'tv') return

    const apiKey = import.meta.env.VITE_TMDB_API_KEY
    if (!apiKey) return

    const controller = new AbortController()
    setLoadingSeasons(true)

    async function loadSeasons() {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${expandedMovie!.id}?api_key=${apiKey}&language=es-ES`,
          { signal: controller.signal }
        )
        if (!response.ok) throw new Error('No se pudieron consultar las temporadas.')

        const data: { number_of_seasons?: number } = await response.json()
        if (!controller.signal.aborted) {
          setExpandedSeasons(data.number_of_seasons ?? null)
        }
      } catch {
        if (!controller.signal.aborted) setExpandedSeasons(null)
      } finally {
        if (!controller.signal.aborted) setLoadingSeasons(false)
      }
    }

    void loadSeasons()
    return () => controller.abort()
  }, [expandedMovie])

  // CATEGORÍAS: TMDB proporciona géneros diferentes para películas y series.
  useEffect(() => {
    const key = import.meta.env.VITE_TMDB_API_KEY
    if (!key) {
      setGenresError('Falta la API Key de TMDB.')
      return
    }
    const controller = new AbortController()
    async function loadGenres() {
      try {
        const results = await Promise.all(
          (['movie', 'tv'] as MediaType[]).map(async (type) => {
            const response = await fetch(
              `https://api.themoviedb.org/3/genre/${type}/list?api_key=${key}&language=es-ES`,
              { signal: controller.signal }
            )
            if (!response.ok) throw new Error('No se pudieron cargar las categorías.')
            const data: { genres: { id: number; name: string }[] } = await response.json()
            return { type, list: data.genres ?? [] }
          })
        )
        if (controller.signal.aborted) return
        const combined = new Map<number, Genre>()
        for (const { type, list } of results) {
          for (const { id, name } of list) {
            const previous = combined.get(id)
            if (previous) previous.mediaTypes.push(type)
            else combined.set(id, { id, name, mediaTypes: [type] })
          }
        }
        setGenres([...combined.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')))
        setGenresError('')
      } catch (error) {
        if (!controller.signal.aborted) {
          setGenresError(error instanceof Error ? error.message : 'Error al cargar las categorías.')
        }
      }
    }
    void loadGenres()
    return () => controller.abort()
  }, [])

  // DESCUBRIR POR GÉNERO, TIPO Y ORDEN; cada página agrega resultados.
  useEffect(() => {
    if (selectedGenre === null) return
    const key = import.meta.env.VITE_TMDB_API_KEY
    if (!key) {
      setDiscoverError('Falta la API Key de TMDB.')
      return
    }
    const genre = genres.find((item) => item.id === selectedGenre)
    if (!genre) return
    const types = (discoverType === 'all' ? genre.mediaTypes : [discoverType])
      .filter((type) => genre.mediaTypes.includes(type))
    const controller = new AbortController()
    async function loadDiscover() {
      setDiscoverLoading(true)
      setDiscoverError('')
      try {
        const responses = await Promise.all(types.map(async (type) => {
          const sorting = discoverSort === 'popular'
            ? 'popularity.desc'
            : discoverSort === 'rating'
              ? 'vote_average.desc'
              : type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc'
          const params = new URLSearchParams({
            api_key: key,
            language: 'es-ES',
            with_genres: String(selectedGenre),
            sort_by: sorting,
            page: String(discoverPage),
            include_adult: 'false',
            ...(discoverSort === 'rating' ? { 'vote_count.gte': '100' } : {}),
            ...(discoverSort === 'recent' && type === 'movie'
              ? { 'primary_release_date.lte': new Date().toISOString().slice(0, 10) }
              : {}),
            ...(discoverSort === 'recent' && type === 'tv'
              ? { 'first_air_date.lte': new Date().toISOString().slice(0, 10) }
              : {}),
          })
          const response = await fetch(
            `https://api.themoviedb.org/3/discover/${type}?${params.toString()}`,
            { signal: controller.signal }
          )
          if (!response.ok) throw new Error('No se pudieron cargar los títulos de esta categoría.')
          const data: TMDBResponse & { page: number; total_pages: number } = await response.json()
          return {
            items: (data.results ?? []).map((item) => ({ ...item, media_type: type })),
            hasMore: data.page < data.total_pages && data.page < 500,
          }
        }))
        if (controller.signal.aborted) return
        const merged = responses.flatMap((result) => result.items)
        merged.sort((a, b) => {
          if (discoverSort === 'rating') return b.vote_average - a.vote_average
          if (discoverSort === 'recent') return (
            (b.release_date ?? b.first_air_date ?? '').localeCompare(a.release_date ?? a.first_air_date ?? '')
          )
          return 0
        })
        setDiscoverResults((previous) => {
          const all = discoverPage === 1 ? merged : [...previous, ...merged]
          return [...new Map(all.map((item) => [`${item.media_type}:${item.id}`, item])).values()]
        })
        setDiscoverHasMore(responses.some((result) => result.hasMore))
      } catch (error) {
        if (!controller.signal.aborted) {
          setDiscoverError(error instanceof Error ? error.message : 'Error al explorar categorías.')
        }
      } finally {
        if (!controller.signal.aborted) setDiscoverLoading(false)
      }
    }
    void loadDiscover()
    return () => controller.abort()
  }, [selectedGenre, discoverType, discoverSort, discoverPage, genres])

  // CARGAR COLECCIÓN
  async function fetchMyList() {
    setLoadingList(true)
    setListError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Debes iniciar sesión.')
      }

      const { data, error } = await supabase
        .from('movies')
        .select(
          'id, movie_id, title, poster_path, media_type, watch_status, personal_rating, personal_comment'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

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
            String(movie.personal_rating ?? 0),
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
    } catch (err) {
      setListError(
        err instanceof Error
          ? err.message
          : 'Error al cargar tu colección.'
      )
    } finally {
      setLoadingList(false)
    }
  }

  // CARGAR PELÍCULAS
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
          throw new Error('Error al cargar películas.')
        }

        const data: TMDBResponse = await response.json()
        setMovies((data.results ?? []).map((movie) => ({ ...movie, media_type: 'movie' })))
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Error de conexión.'
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchMovies()
    void fetchMyList()
  }, [])

  // AGREGAR PELÍCULA
  async function handleSaveMovie(movie: Movie) {
    setSaveMessage('')
    setSaveError('')
    setSavingMovieId(movieKey(movie))

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Debes iniciar sesión.')
      }

      const title = movie.title ?? movie.name ??
        'Título no disponible'

      const { error } = await supabase
        .from('movies')
        .insert({
          user_id: user.id,
          movie_id: movie.id,
          title,
          poster_path: movie.poster_path,
          media_type: movie.media_type,
          watch_status: 'por ver',
        })

      if (error) {
        if (error.code === '23505') {
          await fetchMyList()
          setSaveMessage('Ya está en tu colección.')
          return
        }
        throw error
      }

      await fetchMyList()
      setSaveMessage(`¡${title} se añadió a tu colección!`)
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Error al guardar el título.'
      )
    } finally {
      setSavingMovieId(null)
    }
  }

  // ACTUALIZAR PELÍCULA
  async function handleUpdateMovie(movie: SavedMovie) {
    setSaveError('')
    setSaveMessage('')
    setUpdatingMovieId(movie.id)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Debes iniciar sesión.')
      }

      const ratingNumber = Number(
        editRating[movie.id] ?? '0'
      )

      if (
        !Number.isInteger(ratingNumber) ||
        ratingNumber < 0 ||
        ratingNumber > 5
      ) {
        throw new Error('La nota debe estar entre 1 y 5.')
      }

      const { data, error } = await supabase
        .from('movies')
        .update({
          watch_status: editStatus[movie.id] ?? 'por ver',
          personal_rating:
            ratingNumber === 0 ? null : ratingNumber,
          personal_comment: editComment[movie.id] ?? '',
        })
        .eq('id', movie.id)
        .eq('user_id', user.id)
        .select('id')

      if (error) throw error

      if (!data?.length) {
        throw new Error('No tienes permiso para editar.')
      }

      await fetchMyList()
      setEditingMovie(null)
      setSaveMessage(`Cambios guardados en «${movie.title}».`)
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Error al actualizar.'
      )
    } finally {
      setUpdatingMovieId(null)
    }
  }

  // ELIMINAR PELÍCULA
  async function handleRemoveMovie(movie: SavedMovie) {
    setSaveError('')
    setSaveMessage('')
    setRemovingMovieId(movie.id)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Debes iniciar sesión.')
      }

      const { data, error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movie.id)
        .eq('user_id', user.id)
        .select('id')

      if (error) throw error

      if (!data?.length) {
        throw new Error('No tienes permiso para eliminar.')
      }

      setMyList((previous) =>
        previous.filter((item) => item.id !== movie.id)
      )

      setEditingMovie(null)
      setSelectedMovie(null)
      setSaveMessage(`«${movie.title}» se eliminó.`)
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Error al eliminar.'
      )
    } finally {
      setRemovingMovieId(null)
    }
  }

  // BUSCAR EN TMDB
  async function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const query = search.trim()

    if (!query) {
      setSearchError('Escribe una película o serie.')
      setHasSearched(false)
      return
    }

    const apiKey = import.meta.env.VITE_TMDB_API_KEY

    if (!apiKey) {
      setSearchError('No se encontró la API Key.')
      setHasSearched(false)
      return
    }

    setSearching(true)
    setSearchError('')
    setHasSearched(true)
    setSearchResults([])
    setSaveMessage('')
    setSaveError('')

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=es-ES&page=1&include_adult=false`
      )

      if (!response.ok) {
        throw new Error('No se pudo realizar la búsqueda.')
      }

      const data: TMDBResponse = await response.json()
      setSearchResults(
        (data.results ?? []).filter(
          (item) => item.media_type === 'movie' || item.media_type === 'tv'
        )
      )
    } catch (err) {
      setSearchResults([])
      setSearchError(
        err instanceof Error
          ? err.message
          : 'Error al buscar.'
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

  // TARJETAS DEL CATÁLOGO: póster y título; la ficha abre a pantalla completa.
  function renderMovie(movie: Movie) {
    const title = movie.title ?? movie.name ?? 'Título no disponible'

    return (
      <article className="catalog-flip-card" key={movieKey(movie)}>
        <div className="catalog-flip-inner">
          <div className="catalog-flip-front">
            <button
              type="button"
              className="catalog-poster-button"
              onClick={() => {
                setSaveMessage('')
                setSaveError('')
                setExpandedMovie(movie)
              }}
              aria-label={`Ver ficha completa de ${title}`}
            >
              {movie.poster_path ? (
                <img
                  src={posterUrl(movie.poster_path)}
                  alt={`Póster de ${title}`}
                  loading="lazy"
                />
              ) : (
                <div className="catalog-no-poster">Póster no disponible</div>
              )}
              <div className="catalog-front-overlay">
                <h3>{title}</h3>
                <span className="catalog-front-year">
                  {movie.media_type === 'tv' ? 'SERIE' : 'PELÍCULA'}
                </span>
                <span className="catalog-flip-hint">VER DETALLES ↗</span>
              </div>
            </button>
          </div>
        </div>
      </article>
    )
  }

  // DETALLES
  if (selectedMovie) {
    return (
      <MovieDetails
        movieId={selectedMovie.movie_id}
        mediaType={selectedMovie.media_type}
        title={selectedMovie.title}
        posterPath={selectedMovie.poster_path}
        personalRating={selectedMovie.personal_rating}
        personalComment={selectedMovie.personal_comment}
        onBack={() => setSelectedMovie(null)}
      />
    )
  }

  return (
    <main className="home-container">
      {/* NAVBAR */}
      <header className="home-header">
        <a href="#inicio" className="home-logo">
          MI CARTELERA<span>.</span>
        </a>

        <nav className="home-nav">
          <a href="#explorar">Explorar</a>
          <a href="#categorias">Categorías</a>
          <a href="#mi-coleccion">Mi colección</a>
        </nav>
      </header>

      {/* INTRO */}
      <section className="editorial-intro" id="inicio">
        <span className="editorial-eyebrow">
          TU UNIVERSO CINEMATOGRÁFICO / 2026
        </span>

        <h1>
          El cine se vive.
          <br />
          <em>Las historias permanecen.</em>
        </h1>

        <p>
          Descubre películas y series, guarda tus favoritas
          y construye una colección que cuente tu historia.
        </p>
      </section>

      {/* PELÍCULA DESTACADA */}
      {featuredMovie && (
        <section
          className="featured-movie"
          style={{
            backgroundImage: `
              linear-gradient(
                90deg,
                rgba(10,8,9,.96),
                rgba(10,8,9,.72) 45%,
                rgba(10,8,9,.18)
              ),
              url(https://image.tmdb.org/t/p/w1280${featuredMovie.backdrop_path})
            `,
          }}
        >
          <div className="featured-content">
            <span className="editorial-eyebrow">
              SELECCIÓN DESTACADA
            </span>

            <h2>{featuredMovie.title}</h2>

            <p className="featured-description">
              {featuredMovie.overview}
            </p>

            <div className="featured-meta">
              <span>
                {featuredMovie.release_date?.slice(0, 4)}
              </span>
              <span>
                ★ {featuredMovie.vote_average.toFixed(1)} TMDB
              </span>
            </div>

            <button
              type="button"
              className="featured-button"
              disabled={
                savedKeys.has(movieKey(featuredMovie)) ||
                savingMovieId === movieKey(featuredMovie)
              }
              onClick={() => handleSaveMovie(featuredMovie)}
            >
              {savingMovieId === movieKey(featuredMovie)
                ? 'Guardando...'
                : savedKeys.has(movieKey(featuredMovie))
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
        <span className="editorial-eyebrow">
          DESCUBRIR NUEVAS HISTORIAS
        </span>
        <h2>Explorar películas y series</h2>

        <form
          className="movie-search-form"
          onSubmit={handleSearch}
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busca una película o serie por su nombre..."
            aria-label="Buscar películas y series"
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
        {searching && <p>Buscando películas y series...</p>}
        {saveMessage && <p role="status">{saveMessage}</p>}
        {saveError && <p role="alert">{saveError}</p>}

        {hasSearched && !searching && !searchError && (
          <div className="search-results">
            <h3>Resultados de búsqueda</h3>

            {searchResults.length ? (
              <div className="movies-grid">
                {searchResults.map(renderMovie)}
              </div>
            ) : (
              <p>No encontramos películas ni series con ese nombre.</p>
            )}
          </div>
        )}
      </section>

      {/* EXPLORAR POR CATEGORÍAS */}
      <section className="genre-section" id="categorias">
        <span className="editorial-eyebrow">UN UNIVERSO DE HISTORIAS</span>
        <h2>Explorar por <em>categorías.</em></h2>
        <p className="genre-intro">Descubre películas y series de tus géneros favoritos. Elige una categoría y explora tantas opciones como quieras.</p>

        {genresError && <p role="alert">{genresError}</p>}
        {!genresError && genres.length === 0 && <p>Cargando categorías...</p>}

        <div className="genre-chips" aria-label="Géneros cinematográficos">
          {genres.map((genre) => (
            <button
              type="button"
              key={genre.id}
              className={`genre-chip ${selectedGenre === genre.id ? 'active' : ''}`}
              aria-pressed={selectedGenre === genre.id}
              onClick={() => {
                setDiscoverResults([])
                setDiscoverPage(1)
                setDiscoverError('')
                setSelectedGenre(genre.id)
              }}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {selectedGenre !== null && (
          <>
            <div className="genre-toolbar">
              <h3>{genres.find((genre) => genre.id === selectedGenre)?.name}</h3>
              <div className="genre-options">
                <label>
                  <span>TIPO</span>
                  <select
                    value={discoverType}
                    onChange={(event) => {
                      setDiscoverResults([])
                      setDiscoverPage(1)
                      setDiscoverType(event.target.value as DiscoverType)
                    }}
                  >
                    <option value="all">Películas y series</option>
                    <option value="movie">Películas</option>
                    <option value="tv">Series</option>
                  </select>
                </label>
                <label>
                  <span>ORDENAR POR</span>
                  <select
                    value={discoverSort}
                    onChange={(event) => {
                      setDiscoverResults([])
                      setDiscoverPage(1)
                      setDiscoverSort(event.target.value as DiscoverSort)
                    }}
                  >
                    <option value="popular">Popularidad</option>
                    <option value="rating">Mejor valoradas</option>
                    <option value="recent">Más recientes</option>
                  </select>
                </label>
              </div>
            </div>
            {discoverError && <p role="alert">{discoverError}</p>}
            {discoverLoading && <p role="status">Explorando títulos...</p>}
            {discoverResults.length > 0 && (
              <div className="movies-grid">{discoverResults.map(renderMovie)}</div>
            )}
            {!discoverLoading && !discoverError && discoverResults.length === 0 && (
              <p>No encontramos títulos con estos filtros. Prueba otra categoría o tipo.</p>
            )}
            {discoverHasMore && (
              <button
                type="button"
                className="genre-load-more"
                disabled={discoverLoading}
                onClick={() => setDiscoverPage((page) => page + 1)}
              >
                {discoverLoading ? 'Cargando...' : 'Ver más títulos ↓'}
              </button>
            )}
          </>
        )}
      </section>

      {/* NUEVA COLECCIÓN EDITORIAL */}
      <section
        className="my-list-section editorial-collection"
        id="mi-coleccion"
      >
        <div className="collection-heading">
          <div>
            <span className="editorial-eyebrow">
              MI ARCHIVO CINEMATOGRÁFICO
            </span>
            <h2>Mi colección personal<span>.</span></h2>
            <p>
              Cada película y serie es una historia que forma
              parte de tu colección.
            </p>
          </div>

          <div className="collection-total">
            <strong>{counts.todas}</strong>
            <span>TÍTULOS</span>
          </div>
        </div>

        {/* CONTADORES */}
        <div className="collection-summary">
          <div>
            <strong>{counts['por ver']}</strong>
            <span>Por ver</span>
          </div>

          <div>
            <strong>{counts.viendo}</strong>
            <span>Viendo</span>
          </div>

          <div>
            <strong>{counts.vista}</strong>
            <span>Vistas</span>
          </div>
        </div>

        {/* FILTROS */}
        <div className="collection-filters">
          {([
            ['todas', 'Todas'],
            ['por ver', 'Por ver'],
            ['viendo', 'Viendo'],
            ['vista', 'Vistas'],
          ] as [CollectionFilter, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  collectionFilter === value
                    ? 'filter-button active'
                    : 'filter-button'
                }
                onClick={() => setCollectionFilter(value)}
                aria-pressed={collectionFilter === value}
              >
                {label}
                <span>{counts[value]}</span>
              </button>
            )
          )}
        </div>

        {loadingList && <p>Cargando colección...</p>}
        {listError && <p role="alert">{listError}</p>}

        {!loadingList && !listError && (
          <>
            {filteredList.length === 0 ? (
              <div className="collection-empty">
                <span>✦</span>
                <h3>
                  {myList.length === 0
                    ? 'Tu colección comienza aquí.'
                    : 'Todavía no hay títulos en esta categoría.'}
                </h3>
                <p>
                  Explora películas y series y construye
                  tu propio archivo cinematográfico.
                </p>
                <a href="#explorar">Explorar títulos →</a>
              </div>
            ) : (
              <div className="collection-grid">
                {filteredList.map((movie) => (
                  <article
                    className="collection-card"
                    key={movie.id}
                  >
                    <div className="collection-poster">
                      {movie.poster_path ? (
                        <img
                          src={posterUrl(movie.poster_path)}
                          alt={`Póster de ${movie.title}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="movie-no-poster">
                          Póster no disponible
                        </div>
                      )}

                      <span className="collection-status">
                        {movie.watch_status === 'por ver'
                          ? 'POR VER'
                          : movie.watch_status === 'viendo'
                            ? 'VIENDO'
                            : 'VISTA'}
                      </span>
                    </div>

                    <div className="collection-card-info">
                      <h3>{movie.title}</h3>
                      <span className="editorial-eyebrow">
                        {movie.media_type === 'tv' ? 'SERIE' : 'PELÍCULA'}
                      </span>

                      <p className="collection-rating">
                        {movie.personal_rating
                          ? `★ ${movie.personal_rating} / 5`
                          : '☆ Sin calificar'}
                      </p>

                      <div className="collection-actions">
                        <button
                          type="button"
                          onClick={() => setSelectedMovie(movie)}
                        >
                          Ver detalles ↗
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSaveError('')
                            setEditingMovie(movie)
                          }}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* POPULARES */}
      {!hasSearched && (
        <section className="movies-section">
          <span className="editorial-eyebrow">
            DESCUBRE QUÉ VER
          </span>
          <h2>Selección popular</h2>

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
      
{/* FICHA CINEMATOGRÁFICA A PANTALLA COMPLETA */}
{expandedMovie && (
  <div className="cinema-overlay">
    <section
      className="cinema-expanded"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalles de ${expandedMovie.title ?? expandedMovie.name}`}
    >
      <button
        type="button"
        className="cinema-close"
        onClick={() => setExpandedMovie(null)}
        aria-label="Cerrar detalles"
      >
        ×
      </button>

      <div className="cinema-expanded-image">
        {expandedMovie.poster_path ? (
          <img
            src={posterUrl(expandedMovie.poster_path)}
            alt={`Póster de ${expandedMovie.title ?? expandedMovie.name}`}
          />
        ) : (
          <div className="catalog-no-poster">
            Póster no disponible
          </div>
        )}
      </div>

      <div className="cinema-expanded-content">
        <span className="editorial-eyebrow">
          {expandedMovie.media_type === 'tv' ? 'MI CARTELERA / SERIE' : 'MI CARTELERA / PELÍCULA'}
        </span>

        <h2>
          {expandedMovie.title ?? expandedMovie.name}
        </h2>

        <div className="cinema-expanded-meta">
          <span>
            {(
              expandedMovie.release_date ??
              expandedMovie.first_air_date ??
              ''
            ).slice(0, 4)}
          </span>
          <span>
            ★ {Number(expandedMovie.vote_average ?? 0).toFixed(1)} / 10 TMDB
          </span>
          {expandedMovie.media_type === 'tv' && (
            <span>
              {loadingSeasons
                ? 'Consultando temporadas...'
                : expandedSeasons === null
                  ? 'Temporadas no disponibles'
                  : `${expandedSeasons} ${expandedSeasons === 1 ? 'temporada' : 'temporadas'}`}
            </span>
          )}
        </div>

        <div className="cinema-expanded-divider" />

        <span className="editorial-eyebrow">
          SINOPSIS
        </span>

        <p className="cinema-expanded-overview">
          {expandedMovie.overview || 'Sin sinopsis disponible.'}
        </p>

        <button
          type="button"
          className="cinema-expanded-add"
          onClick={() => handleSaveMovie(expandedMovie)}
          disabled={
            savedKeys.has(movieKey(expandedMovie)) ||
            savingMovieId === movieKey(expandedMovie)
          }
        >
          {savingMovieId === movieKey(expandedMovie)
            ? 'Guardando...'
            : savedKeys.has(movieKey(expandedMovie))
              ? '✓ En mi colección'
              : '+ Añadir a mi colección'}
        </button>

        {saveMessage && <p role="status">{saveMessage}</p>}
        {saveError && <p role="alert">{saveError}</p>}
      </div>
    </section>
  </div>
)}


      {/* PANEL DE EDICIÓN */}
      {editingMovie && (
        <div className="editor-overlay">
          <section
            className="editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
          >
            <div className="editor-top">
              <span className="editorial-eyebrow">
                EDITAR MI COLECCIÓN
              </span>

              <button
                type="button"
                className="editor-close"
                onClick={() => setEditingMovie(null)}
                aria-label="Cerrar editor"
                disabled={updatingMovieId !== null}
              >
                ×
              </button>
            </div>

            <h2 id="editor-title">{editingMovie.title}</h2>
            <p className="editor-subtitle">
              Personaliza tu experiencia con este título.
            </p>

            <label htmlFor="editor-status">
              Estado de visualización
            </label>

            <select
              id="editor-status"
              value={
                editStatus[editingMovie.id] ?? 'por ver'
              }
              onChange={(event) => {
                const newStatus =
                  event.target.value as WatchStatus

                setEditStatus((previous) => ({
                  ...previous,
                  [editingMovie.id]: newStatus,
                }))
              }}
            >
              <option value="por ver">Por ver</option>
              <option value="viendo">Viendo</option>
              <option value="vista">Vista</option>
            </select>

            <label>Mi calificación personal</label>

            <div
              className="editor-stars"
              role="group"
              aria-label="Calificación personal"
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const current = Number(
                  editRating[editingMovie.id] ?? '0'
                )

                return (
                  <button
                    key={star}
                    type="button"
                    className={
                      star <= current ? 'selected' : ''
                    }
                    aria-label={`${star} estrellas`}
                    aria-pressed={star <= current}
                    onClick={() => {
                      setEditRating((previous) => ({
                        ...previous,
                        [editingMovie.id]:
                          current === star
                            ? '0'
                            : String(star),
                      }))
                    }}
                  >
                    ★
                  </button>
                )
              })}
            </div>

            <label htmlFor="editor-comment">
              Mi comentario
            </label>

            <textarea
              id="editor-comment"
              rows={4}
              placeholder="¿Qué te hizo sentir esta historia?"
              value={editComment[editingMovie.id] ?? ''}
              onChange={(event) => {
                setEditComment((previous) => ({
                  ...previous,
                  [editingMovie.id]: event.target.value,
                }))
              }}
            />

            {saveError && (
              <p className="editor-error" role="alert">
                {saveError}
              </p>
            )}

            <button
              type="button"
              className="editor-save"
              disabled={updatingMovieId === editingMovie.id}
              onClick={() => handleUpdateMovie(editingMovie)}
            >
              {updatingMovieId === editingMovie.id
                ? 'Guardando...'
                : 'Guardar cambios →'}
            </button>

            <button
              type="button"
              className="editor-delete"
              disabled={removingMovieId === editingMovie.id}
              onClick={() => {
                if (
                  window.confirm(
                    `¿Eliminar «${editingMovie.title}» de tu colección?`
                  )
                ) {
                  void handleRemoveMovie(editingMovie)
                }
              }}
            >
              {removingMovieId === editingMovie.id
                ? 'Eliminando...'
                : 'Eliminar de mi colección'}
            </button>
          </section>
        </div>
      )}
    </main>
  )
}
