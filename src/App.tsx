
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Home from './components/Home'
import './App.css'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Error al comprobar la sesión:', error.message)
      }

      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error al cerrar sesión:', error.message)
    }
  }

  if (loading) {
    return <main className="auth-container">Cargando...</main>
  }

  if (!user) {
    return <Auth />
  }

  return (
    <>
      <Home />
      <button
        type="button"
        className="home-signout"
        onClick={handleSignOut}
      >
        Cerrar sesión
      </button>
    </>
  )
}

export default App
