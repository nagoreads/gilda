import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// Inicializar Supabase adaptado a Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      alert('Error al iniciar sesión: ' + error.message);
    } else {
      alert('¡Correo enviado! Revisa tu bandeja de entrada para acceder.');
    }
    setLoading(false);
  };

  // Si la usuaria NO ha iniciado sesión
  if (!session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#ffffee' }}>
        <div style={{ padding: '30px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e6e4dc', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h1 style={{ fontFamily: 'serif', fontSize: '36px', marginBottom: '8px', color: '#1c1c1a' }}>gilda</h1>
          <p style={{ color: '#595750', fontSize: '13px', marginBottom: '20px' }}>
            Introduce tu correo electrónico para iniciar sesión de forma segura.
          </p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              placeholder="tu-correo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: '12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #e6e4dc', outline: 'none' }}
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '12px', fontSize: '13px', background: '#3d4220', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {loading ? 'Enviando enlace...' : 'Enviar enlace mágico'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Si la usuaria SÍ ha iniciado sesión
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', background: '#ffffee', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'serif', fontSize: '40px', color: '#1c1c1a' }}>gilda</h1>
      <p style={{ color: '#444', margin: '20px 0', fontSize: '14px' }}>
        Sesión iniciada como: <strong>{session.user.email}</strong>
      </p>
      
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e6e4dc', display: 'inline-block', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <p style={{ color: '#3d4220', fontSize: '13px', fontWeight: '500' }}>✨ Tu cuenta está conectada de forma segura a Supabase.</p>
      </div>

      <div>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ padding: '10px 20px', fontSize: '13px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}