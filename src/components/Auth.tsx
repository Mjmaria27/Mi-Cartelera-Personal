
import { useState } from 'react'
import { supabase } from '../supabase'
import '../App.css'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      <form
        className={`auth-card ${isSignUp ? 'signup-mode' : ''}`}
        onSubmit={handleSubmit}
      >
        <h1>Mi Cartelera Personal</h1>

        <p>
          {isSignUp
            ? 'Crea tu cuenta y organiza tus películas favoritas.'
            : 'Inicia sesión para entrar a tu cartelera.'}
        </p>

        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />

        <button type="submit" disabled={loading}>
          {loading
            ? 'Cargando...'
            : isSignUp
              ? 'Crear cuenta'
              : 'Iniciar sesión'}
        </button>

        {message && <p role="status">{message}</p>}

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
            : '¿No tienes cuenta? Regístrate'}
        </button>
      </form>
    </main>
  )
}
