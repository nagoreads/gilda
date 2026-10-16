import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function SeccionNotificacionesClub() {
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    const cargarNotificaciones = async () => {
      const { data, error } = await supabase
        .from('notificaciones_club')
        .select('*')
        .eq('activa', true)
        .order('created_at', { ascending: false });

      if (data) {
        setNotificaciones(data);
      }
    };

    cargarNotificaciones();
  }, []);

  if (notificaciones.length === 0) return null;

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <h3 style={{ fontFamily: 'serif', color: '#23211e', marginBottom: '12px' }}>
        ✦ Notificaciones del Club
      </h3>
      
      {notificaciones.map((notif) => (
        <div key={notif.id} style={{
          backgroundColor: '#fdfbf7',
          border: '1px solid #e8e4d9',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          color: '#23211e'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ 
              fontSize: '11px', 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              fontWeight: 'bold',
              color: '#8c6d46' 
            }}>
              {notif.tipo}
            </span>
            <span style={{ fontSize: '11px', color: '#75706b' }}>
              {new Date(notif.created_at).toLocaleDateString()}
            </span>
          </div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontFamily: 'serif' }}>{notif.titulo}</h4>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4', color: '#555' }}>{notif.mensaje}</p>
        </div>
      ))}
    </div>
  );
}