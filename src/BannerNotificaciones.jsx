import { useState, useEffect } from 'react';
import { supabase } from './context/ClubContext.jsx'; // Usamos la misma ruta de importación que App.jsx

export function BannerNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierto, setAbierto] = useState(true);

  useEffect(() => {
    const cargarNotificaciones = async () => {
      const { data, error } = await supabase
        .from('notificaciones_club')
        .select('*')
        .eq('activa', true)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setNotificaciones(data);
      }
    };

    cargarNotificaciones();
  }, []);

  if (notificaciones.length === 0) return null;

  const ultimaNotif = notificaciones[0];

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: '#fdfbf7',
      borderBottom: '1px solid #e8e4d9',
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      fontFamily: 'sans-serif',
      color: '#23211e',
      width: '100%',
      marginBottom: '10px',
      borderRadius: '12px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        backgroundColor: '#f7f3eb',
        cursor: 'pointer',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        borderBottom: abierto ? '1px solid #efeade' : 'none'
      }} onClick={() => setAbierto(!abierto)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px' }}>✦</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8c6d46' }}>
            Aviso del Club: {ultimaNotif.titulo}
          </span>
        </div>
        <button style={{
          background: 'none',
          border: 'none',
          fontSize: '12px',
          color: '#75706b',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          {abierto ? '▲ Ocultar' : '▼ Ver más'}
        </button>
      </div>

      {abierto && (
        <div style={{ padding: '14px 16px', backgroundColor: '#fdfbf7', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', lineHeight: '1.4', color: '#444' }}>
            {ultimaNotif.mensaje}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#888' }}>
            <span>Tipo: <strong>{ultimaNotif.tipo}</strong></span>
            <span>{new Date(ultimaNotif.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}