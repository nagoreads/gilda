import React, { useState } from 'react';

export const MODALIDADES_GILDA = [
  {
    id: 'cotilla',
    nombre: 'gilda cotilla',
    precio: 'Gratis',
    esGratis: true,
    descripcion: 'asómate, lee los comentarios de las demás y forma parte de la comunidad de forma libre y gratuita.',
    enlaceStripe: ''
  },
  {
    id: 'satelite',
    nombre: 'gilda satélite',
    precio: '1 €/mes',
    esGratis: false,
    descripcion: 'forma parte de la comunidad y lee a tu ritmo mientras vas comentando y leyendo a las demás. para que te hagas una idea, es como una lectura conjunta, pero a través de una app diseñada específicamente para eso.',
    enlaceStripe: 'https://buy.stripe.com/cNi4gtfqV8cxeju0WV6Ri01'
  },
  {
    id: 'cafe',
    nombre: 'gilda de café',
    precio: '5 €/mes',
    esGratis: false,
    descripcion: 'forma parte de la comunidad al completo, chat y cafecitos virtuales.',
    enlaceStripe: 'https://buy.stripe.com/3cI5kx0w1gJ3fny4976Ri02'
  },
  {
    id: 'nube',
    nombre: 'gilda de nube',
    precio: '5 €/mes',
    esGratis: false,
    descripcion: 'recibe por correo electrónico la carta sorpresa de gilda, con distintas actividades creativas, pasatiempos, pegatinas, anti - guía de lectura de autora, marcapáginas, plantillas para stories... y muchas sorpresas más.',
    enlaceStripe: 'https://buy.stripe.com/cNi5kx92xcsNb7i3536Ri03'
  },
  {
    id: 'virtual',
    nombre: 'gilda virtual',
    precio: '8 €/mes',
    esGratis: false,
    descripcion: 'recibe todo el contenido digital en tu correo electrónico más acceso total a la app.',
    enlaceStripe: 'https://buy.stripe.com/bJe9ANguZ9gB6R27lj6Ri05'
  },
  {
    id: 'papel',
    nombre: 'gilda de papel',
    precio: '10 €/mes',
    esGratis: false,
    descripcion: 'recibe por correo postal (sí, llega hasta el buzón de tu casa porque solo soy una chica que adora escribir cartas a mano) la carta sorpresa de gilda, con distintas actividades creativas, pasatiempos, pegatinas, anti - guía de lectura de autora, marcapáginas, y muchas sorpresas más.',
    enlaceStripe: 'https://buy.stripe.com/bJe8wJ7Yt50l1wIbBz6Ri04'
  },
  {
    id: 'absoluta',
    nombre: 'gilda absoluta',
    precio: '12 €/mes',
    esGratis: false,
    descripcion: 'la experiencia completa: recibe todo el contenido en papel en tu buzón de casa y acceso total a la app, al chat y a los cafecitos del club.',
    enlaceStripe: 'https://buy.stripe.com/14A5kxemReAV2AMcFD6Ri08'
  }
];

const detallesModalidades = [
  { id: 'cotilla', resumen: 'para curiosear y leer comentarios sin compromiso' },
  { id: 'satelite', resumen: 'comunidad en la app y lectura conjunta' },
  { id: 'cafe', resumen: 'comunidad completa, chat y cafecitos virtuales' },
  { id: 'nube', resumen: 'carta sorpresa digital mensual en tu correo' },
  { id: 'virtual', resumen: 'carta digital + acceso total a la app' },
  { id: 'papel', resumen: 'carta física escrita a mano en tu buzón' },
  { id: 'absoluta', resumen: 'experiencia completa (papel + app + cafecitos)' }
];

export default function CreaTuGilda({ enEntrarGratis, enIrALogin }) {
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState(null);

  const seleccionarOpcion = (modalidadId) => {
    const encontrada = MODALIDADES_GILDA.find(m => m.id === modalidadId) || MODALIDADES_GILDA[0];
    setModalidadSeleccionada(encontrada);
  };

  const confirmarModalidad = () => {
    if (!modalidadSeleccionada) return;

    if (modalidadSeleccionada.esGratis) {
      enEntrarGratis();
    } else if (modalidadSeleccionada.enlaceStripe) {
      window.location.href = modalidadSeleccionada.enlaceStripe;
    }
  };

  return (
    <div className="space-y-5 text-left font-sans">
      {!modalidadSeleccionada ? (
        <div className="animate-fade-in space-y-4">
          <div className="text-center space-y-1">
            <h2 className="font-babydoll text-3xl font-bold text-[#23211e] leading-tight">
              formas de estar en gilda
            </h2>
            <p className="text-[11px] text-[#75706b] font-sans">
              puedes cambiar o cancelar tu suscripción cuando quieras
            </p>
          </div>

          <div className="py-1 space-y-2">
            {MODALIDADES_GILDA.map((item) => {
              const info = detallesModalidades.find(d => d.id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => seleccionarOpcion(item.id)}
                  className="group cursor-pointer p-3.5 rounded-xl bg-white/70 hover:bg-white border border-[#e8e4d9] hover:border-[#23211e] transition-all duration-200"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-babydoll font-bold text-base text-[#23211e]">
                      {item.nombre}
                    </span>
                    <span className="text-xs font-medium text-[#75706b] group-hover:text-[#23211e] font-sans">
                      {item.precio}
                    </span>
                  </div>
                  {info && (
                    <p className="text-[11px] text-[#75706b] font-sans pt-0.5 leading-snug">
                      {info.resumen}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center border-t border-[#e8e4d9]/60">
            <button
              onClick={enIrALogin}
              className="text-xs text-[#75706b] hover:text-[#23211e] transition-colors"
            >
              ya tengo cuenta (entrar al club)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-[10px] text-[#75706b] uppercase tracking-widest font-sans font-medium">
              modalidad seleccionada
            </span>
            <div className="flex justify-between items-baseline pt-1">
              <h2 className="font-babydoll text-3xl font-bold text-[#23211e]">
                {modalidadSeleccionada.nombre}
              </h2>
              <span className="text-xs font-medium bg-[#23211e] text-[#ffffee] px-3 py-1 rounded-full font-sans">
                {modalidadSeleccionada.precio}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-[#e8e4d9]">
            <p className="text-xs text-[#75706b] font-sans leading-relaxed">
              {modalidadSeleccionada.descripcion}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={confirmarModalidad}
              className="w-full editorial-btn py-3 text-xs font-medium text-center block hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              {modalidadSeleccionada.esGratis
                ? 'Entrar gratis al club'
                : `Elegir ${modalidadSeleccionada.nombre} en Stripe`}
            </button>

            <button
              onClick={() => setModalidadSeleccionada(null)}
              className="block w-full text-center text-xs text-[#75706b] hover:text-[#23211e] font-sans transition-colors pt-1"
            >
              volver a las modalidades
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
