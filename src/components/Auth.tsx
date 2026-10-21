
import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../supabase'
import '../App.css'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        setMessage(
          data.session
            ? '¡Cuenta creada! Ya puedes entrar.'
            : '¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.'
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        setMessage('¡Inicio de sesión exitoso!')
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error. Inténtalo nuevamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-container">

      {/* PANEL IZQUIERDO */}
      <section className="auth-editorial">

        <div className="auth-brand">
          MI CARTELERA<span>.</span>
        </div>

        <div className="auth-editorial-copy">

          <span className="auth-eyebrow">
            TU ARCHIVO PERSONAL DE CINE — EST. 2026
          </span>

          <h2>
            Las historias
            <br />
            que se quedan
            <br />
            <em>contigo.</em>
          </h2>

          <p>
            Un espacio para descubrir, guardar y recordar
            el cine que te mueve.
          </p>

        </div>

        <span className="auth-edition">
          UNA COLECCIÓN DE HISTORIAS, A TU MANERA.
        </span>

      </section>

      {/* PANEL DERECHO */}
      <section className="auth-panel">

        <form
          className={`auth-card ${isSignUp ? 'signup-mode' : ''}`}
          onSubmit={handleSubmit}
        >

          <span className="auth-eyebrow">
            MI CARTELERA / ACCESO PERSONAL
          </span>

          <h1>
            {isSignUp
              ? 'Tu historia comienza aquí.'
              : 'Bienvenido de nuevo.'}
          </h1>

          <p>
            {isSignUp
              ? 'Crea tu cuenta para comenzar tu colección de cine.'
              : 'Continúa explorando las historias que más te gustan.'}
          </p>

          <label htmlFor="email">
            Correo electrónico
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            autoComplete="email"
          />

          <label htmlFor="password">
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            autoComplete={
              isSignUp ? 'new-password' : 'current-password'
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Cargando...'
              : isSignUp
                ? 'Crear mi cuenta →'
                : 'Entrar a mi cartelera →'}
          </button>

          {message && (
            <p role="status" aria-live="polite">
              {message}
            </p>
          )}

          <button
            type="button"
            className="auth-toggle"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage('')
            }}
          >
            {isSignUp
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿Aún no tienes cuenta? Regístrate'}
          </button>

          <span className="auth-form-footer">
            CADA PELÍCULA TIENE UNA HISTORIA.
            ESTA ES LA TUYA.
          </span>

        </form>

      </section>

    </main>
  )
}
