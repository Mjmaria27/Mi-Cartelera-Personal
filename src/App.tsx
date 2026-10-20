
import { useMemo, useState } from 'react'
import './App.css'

type Movie = {
  id: number
  title: string
  year: number
  category: 'Película' | 'Serie'
  genre: string
  rating: string
  poster: string
  status: 'Por ver' | 'Viendo' | 'Vista'
}

const initialMovies: Movie[] = [
  {
    id: 1,
    title: 'Dune: Part Two',
    year: 2024,
    category: 'Película',
    genre: 'Ciencia ficción',
    rating: '8.5',
    poster:
      'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    status: 'Por ver',
  },
  {
    id: 2,
    title: 'Wednesday',
    year: 2022,
    category: 'Serie',
    genre: 'Fantasía',
    rating: '8.0',
    poster:
      'https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg',
    status: 'Viendo',
  },
  {
    id: 3,
    title: 'Interstellar',
    year: 2014,
    category: 'Película',
    genre: 'Ciencia ficción',
    rating: '8.7',
    poster:
      'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    status: 'Vista',
  },
  {
    id: 4,
    title: 'The Batman',
    year: 2022,
    category: 'Película',
    genre: 'Acción',
    rating: '7.8',
    poster:
      'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    status: 'Por ver',
  },
  {
    id: 5,
    title: 'Stranger Things',
    year: 2016,
    category: 'Serie',
    genre: 'Misterio',
    rating: '8.7',
    poster:
      'https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg',
    status: 'Viendo',
  },
  {
    id: 6,
    title: 'Poor Things',
    year: 2023,
    category: 'Película',
    genre: 'Drama',
    rating: '7.8',
    poster:
      'https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg',
    status: 'Vista',
  },
]

const filters = ['Todo', 'Por ver', 'Viendo', 'Vista'] as const
type Filter = (typeof filters)[number]

function App() {
  const [movies, setMovies] = useState(initialMovies)
  const [activeFilter, setActiveFilter] = useState<Filter>('Todo')
  const [search, setSearch] = useState('')
  const [activeNav, setActiveNav] = useState('Mi colección')
  const [notice, setNotice] = useState('')

  const visibleMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesFilter =
        activeFilter === 'Todo' || movie.status === activeFilter
      const matchesSearch = movie.title
        .toLowerCase()
        .includes(search.toLowerCase().trim())

      return matchesFilter && matchesSearch
    })
  }, [movies, activeFilter, search])

  const counts = {
    total: movies.length,
    pending: movies.filter((movie) => movie.status === 'Por ver').length,
    watching: movies.filter((movie) => movie.status === 'Viendo').length,
    watched: movies.filter((movie) => movie.status === 'Vista').length,
  }

  function cycleStatus(id: number) {
    const statuses: Movie['status'][] = ['Por ver', 'Viendo', 'Vista']

    setMovies((current) =>
      current.map((movie) => {
        if (movie.id !== id) return movie

        const nextIndex =
          (statuses.indexOf(movie.status) + 1) % statuses.length

        return { ...movie, status: statuses[nextIndex] }
      }),
    )

    setNotice('Estado actualizado en esta vista de demostración.')
    window.setTimeout(() => setNotice(''), 2500)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="Mi Cartelera Personal">
          <span className="brand-mark">M<span>C</span></span>
          <span className="brand-copy">
            <strong>mi cartelera</strong>
            <small>PERSONAL</small>
          </span>
        </a>

        <div className="side-label">MENÚ PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegación principal">
          <button
            className={activeNav === 'Mi colección' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveNav('Mi colección')}
          >
            <span className="nav-icon">▦</span> Mi colección
          </button>
          <button
            className={activeNav === 'Descubrir' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveNav('Descubrir')}
          >
            <span className="nav-icon">⌕</span> Descubrir
            <span className="nav-tag">PRONTO</span>
          </button>
          <button
            className={activeNav === 'Mis favoritas' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveNav('Mis favoritas')}
          >
            <span className="nav-icon">♡</span> Mis favoritas
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-sparkle">✦</span>
            <p>Tu próxima historia favorita está por comenzar.</p>
            <span className="note-caption">TU MUNDO, TU CARTELERA.</span>
          </div>
          <div className="profile">
            <div className="avatar">MC</div>
            <div className="profile-copy">
              <strong>Cinéfila</strong>
              <span>Mi espacio personal</span>
            </div>
            <span className="profile-dots">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="inicio">
        <header className="topbar">
          <div className="breadcrumb">
            <span>MI ESPACIO</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{activeNav.toUpperCase()}</strong>
          </div>
          <div className="topbar-right">
            <span className="status-dot" />
            <span className="demo-label">VISTA DE DEMOSTRACIÓN</span>
            <div className="top-avatar">MC</div>
          </div>
        </header>

        <section className="welcome-section">
          <div className="welcome-copy">
            <div className="eyebrow"><span /> TU UNIVERSO CINEMATOGRÁFICO</div>
            <h1>Historias que<br />viven <span>contigo.</span></h1>
            <p>
              Todo lo que quieres ver, lo que estás viendo y lo que
              siempre recordarás. En un solo lugar.
            </p>
            <a className="primary-button" href="#coleccion">
              Explorar mi colección <span>↗</span>
            </a>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-glow" />
            <div className="art-star star-one">✦</div>
            <div className="art-star star-two">✧</div>
            <div className="art-monogram">M<span>C</span></div>
            <div className="art-caption">YOUR PERSONAL<br />MOVIE UNIVERSE</div>
          </div>
        </section>

        <section className="stats-grid" aria-label="Resumen de mi colección">
          <div className="stat-card">
            <div className="stat-top"><span>Total en mi colección</span><span className="stat-icon">▦</span></div>
            <div className="stat-number">{counts.total.toString().padStart(2, '0')}</div>
            <div className="stat-foot"><span className="stat-dot purple" /> Títulos guardados</div>
          </div>
          <div className="stat-card">
            <div className="stat-top"><span>Por descubrir</span><span className="stat-icon">◷</span></div>
            <div className="stat-number">{counts.pending.toString().padStart(2, '0')}</div>
            <div className="stat-foot"><span className="stat-dot lilac" /> En tu lista de pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-top"><span>En progreso</span><span className="stat-icon">▷</span></div>
            <div className="stat-number">{counts.watching.toString().padStart(2, '0')}</div>
            <div className="stat-foot"><span className="stat-dot blue" /> Historias en curso</div>
          </div>
          <div className="stat-card">
            <div className="stat-top"><span>Ya disfrutadas</span><span className="stat-icon">✓</span></div>
            <div className="stat-number">{counts.watched.toString().padStart(2, '0')}</div>
            <div className="stat-foot"><span className="stat-dot pink" /> Vistas por ti</div>
          </div>
        </section>

        <section className="collection-section" id="coleccion">
          <div className="section-heading">
            <div>
              <div className="eyebrow section-eyebrow">TU ARCHIVO PERSONAL</div>
              <h2>{activeNav === 'Mi colección' ? 'Mi colección' : activeNav}</h2>
              <p>Un pequeño universo de historias elegidas por ti.</p>
            </div>
            <span className="collection-count">{visibleMovies.length} TÍTULOS</span>
          </div>

          <div className="collection-toolbar">
            <div className="filter-tabs" role="group" aria-label="Filtrar por estado">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={activeFilter === filter ? 'filter-tab selected' : 'filter-tab'}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                  {filter === 'Todo' && <span>{counts.total}</span>}
                </button>
              ))}
            </div>
            <label className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Buscar en mi colección..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar en mi colección"
              />
              <kbd>/</kbd>
            </label>
          </div>

          {visibleMovies.length > 0 ? (
            <div className="movie-grid">
              {visibleMovies.map((movie) => (
                <article className="movie-card" key={movie.id}>
                  <div className="poster-wrap">
                    <img
                      className="movie-poster"
                      src={movie.poster}
                      alt={`Póster de ${movie.title}`}
                      loading="lazy"
                    />
                    <span className={`status-badge ${movie.status.toLowerCase().replace(' ', '-')}`}>
                      <span /> {movie.status}
                    </span>
                    <button
                      className="favorite-button"
                      aria-label={`Cambiar estado de ${movie.title}`}
                      title="Cambiar estado"
                      onClick={() => cycleStatus(movie.id)}
                    >
                      ↻
                    </button>
                  </div>
                  <div className="movie-info">
                    <div className="movie-meta">{movie.category} <span>·</span> {movie.year}</div>
                    <h3>{movie.title}</h3>
                    <div className="movie-bottom">
                      <span className="movie-genre">{movie.genre}</span>
                      <span className="movie-rating"><span>★</span> {movie.rating}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>⌕</span>
              <h3>No encontramos esa historia</h3>
              <p>Prueba con otro título o cambia el filtro seleccionado.</p>
              <button onClick={() => { setSearch(''); setActiveFilter('Todo') }}>
                Limpiar búsqueda
              </button>
            </div>
          )}
          <p className="demo-disclaimer">
            <span>✦</span> Contenido de demostración · Los cambios de estado aún no se guardan en una base de datos.
          </p>
        </section>

        <footer className="footer">
          <span>MI CARTELERA PERSONAL <span className="footer-heart">✦</span></span>
          <span>HECHO PARA QUIENES AMAN LAS HISTORIAS.</span>
        </footer>

        {notice && <div className="toast" role="status">{notice}</div>}
      </main>
    </div>
  )
}

export default App
