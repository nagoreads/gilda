import PortadaLibro from '../PortadaLibro';

export default function SeccionAdmin({
  libroActual,
  chatMsgs,
  propuestas,
  supabase,
  cargarDatosSupabase,
  mostrarToast
}) {
  const adminGuardarLecturaActiva = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const lectura = {
      titulo: String(formData.get('titulo') || '').trim(),
      autora: String(formData.get('autora') || '').trim(),
      portada: String(formData.get('portada') || '').trim(),
      paginas_totales: Number(formData.get('paginas_totales')) || 280
    };
    if (libroActual?.id) {
      await supabase.from('club_readings').update(lectura).eq('id', libroActual.id);
    } else {
      await supabase.from('club_readings').insert([lectura]);
    }
    await cargarDatosSupabase();
    mostrarToast('Lectura activa actualizada.');
  };

  const adminEliminarMensajeChat = async (idMsg) => {
    if (!idMsg) return;
    await supabase.from('chat_messages').delete().eq('id', idMsg);
    await cargarDatosSupabase();
    mostrarToast('Mensaje retirado.');
  };

  const adminEliminarPropuesta = async (idProp) => {
    if (!idProp) return;
    await supabase.from('proposals').delete().eq('id', idProp);
    await cargarDatosSupabase();
    mostrarToast('Propuesta retirada.');
  };

  return (
    <div className="space-y-4 fade-in">
      <section className="editorial-card p-5 space-y-4">
        <header className="flex items-center justify-between gap-3 border-b border-[#e8e4d9] pb-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-[#756a58] font-sans">herramientas editoriales</p>
            <h1 className="font-babydoll text-2xl font-bold text-[#232321]">Panel de administración</h1>
          </div>
          <span className="rounded-full bg-[#f3eadb] border border-[#d8cdb8] px-2.5 py-1 text-[9px] font-bold text-[#6c5b42]">ADMIN</span>
        </header>

        <div>
          <h2 className="font-babydoll text-lg font-bold">Lectura activa del club</h2>
          <p className="mb-3 text-[10px] text-[#756a58] font-sans">El relevo de lectura se controla manualmente desde aquí.</p>
          <form key={`${libroActual.titulo}-${libroActual.autora}`} onSubmit={adminGuardarLecturaActiva} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="space-y-1 text-[10px] font-bold text-[#75706b] font-sans">Título
              <input name="titulo" defaultValue={libroActual.titulo} required className="editorial-input w-full p-2.5 text-xs font-normal" />
            </label>
            <label className="space-y-1 text-[10px] font-bold text-[#75706b] font-sans">Autora
              <input name="autora" defaultValue={libroActual.autora} className="editorial-input w-full p-2.5 text-xs font-normal" />
            </label>
            <label className="space-y-1 text-[10px] font-bold text-[#75706b] font-sans">URL de portada
              <input name="portada" type="url" defaultValue={libroActual.portada} className="editorial-input w-full p-2.5 text-xs font-normal" />
            </label>
            <label className="space-y-1 text-[10px] font-bold text-[#75706b] font-sans">Páginas totales
              <input name="paginas_totales" type="number" min="1" defaultValue={libroActual.paginas_totales || 280} className="editorial-input w-full p-2.5 text-xs font-normal" />
            </label>
            <button type="submit" className="sm:col-span-2 editorial-btn py-2.5 text-xs min-h-[44px]">Guardar lectura activa</button>
          </form>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <section className="editorial-card p-4 space-y-3">
          <div className="flex justify-between items-baseline gap-2">
            <h2 className="font-babydoll text-lg font-bold">Moderación del chat</h2>
            <span className="text-[10px] text-[#756a58] font-sans">últimos mensajes</span>
          </div>
          {chatMsgs.length === 0 ? <p className="text-xs text-[#756a58] italic">No hay mensajes cargados.</p> : (
            <div className="divide-y divide-[#e8e4d9]">
              {chatMsgs.slice(-12).reverse().map((mensaje) => (
                <div key={mensaje.id} className="flex items-start gap-3 py-2.5">
                  <div className="min-w-0 flex-grow">
                    <p className="text-[10px] font-bold text-[var(--primary-olive)]">{mensaje.usuario || 'lectora'} · {mensaje.tipo || 'global'}</p>
                    <p className="break-words text-xs text-[#232321]">{mensaje.mensaje}</p>
                  </div>
                  <button type="button" onClick={() => adminEliminarMensajeChat(mensaje.id)} title="Retirar mensaje" className="shrink-0 rounded-lg border border-[#e8e4d9] px-2.5 py-1.5 text-[10px] font-bold text-[#8b4038] hover:bg-[#fff4f1] min-h-[44px]">Retirar</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="editorial-card p-4 space-y-3">
          <div className="flex justify-between items-baseline gap-2">
            <h2 className="font-babydoll text-lg font-bold">Propuestas del club</h2>
            <span className="text-[10px] text-[#756a58] font-sans">{propuestas.length} propuestas</span>
          </div>
          {propuestas.map((propuesta) => (
            <div key={propuesta.id} className="flex items-center gap-3 border-t border-[#e8e4d9] py-2.5">
              <PortadaLibro titulo={propuesta.titulo} autora={propuesta.autora} portada={propuesta.portada} size="thumb" />
              <div className="min-w-0 flex-grow">
                <p className="truncate font-babydoll text-sm font-bold">{propuesta.titulo}</p>
                <p className="truncate text-[10px] text-[#756a58]">{propuesta.autora || 'Autora no indicada'} · {propuesta.votos || 0} votos</p>
              </div>
              <button type="button" onClick={() => adminEliminarPropuesta(propuesta.id)} className="shrink-0 rounded-lg border border-[#e8e4d9] px-2.5 py-1.5 text-[10px] font-bold text-[#8b4038] hover:bg-[#fff4f1] min-h-[44px]">Retirar</button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}