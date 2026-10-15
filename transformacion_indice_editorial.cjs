const fs = require('fs');

const gildaComponentPath = 'src/components/CreaTuGilda.jsx';
const gildaCode = `import React, { useState } from 'react';

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
    descripcion: 'forma parte de la comunidad y lee a tu ritmo mientras vas comentando y leyendo a las demás.',
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
    descripcion: 'recibe por correo electrónico la carta sorpresa de gilda, con distintas actividades creativas, pasatiempos, pegatinas y marcapáginas.',
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
    descripcion: 'recibe por correo postal la carta sorpresa escrita a mano en el buzón de tu casa.',
    enlaceStripe: 'https://buy.stripe.com/bJe8wJ7Yt50l1wIbBz6Ri04'
  },
  {
    id: 'absoluta',
    nombre: 'gilda absoluta',
    precio: '12 €/mes',
    esGratis: false,
    descripcion: 'la experiencia completa: carta en papel en tu buzón, acceso a la app, chat y cafecitos.',
    enlaceStripe: 'https://buy.stripe.com/14A5kxemReAV2AMcFD6Ri08'
  }
];

const caminos = [
  { id: 'cotilla', titulo: 'asomarme a leer en la sombra', precio: 'gratis' },
  { id: 'satelite', titulo: 'comentar capítulo a capítulo en la app', precio: '1 €' },
  { id: 'cafe', titulo: 'charlar en el chat y cafecitos virtuales', precio: '5 €' },
  { id: 'nube', titulo: 'recibir la carta sorpresa digital por email', precio: '5 €' },
  { id: 'virtual', titulo: 'carta digital + app y comunidad completa', precio: '8 €' },
  { id: 'papel', titulo: 'recibir la carta escrita a mano en mi buzón', precio: '10 €' },
  { id: 'absoluta', titulo: 'experiencia completa (carta en papel + app)', precio: '12 €' }
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
              ¿cómo quieres vivir gilda?
            </h2>
            <p className="text-[11px] text-[#75706b] italic font-sans">
              elige el rincón que más encaje contigo esta temporada
            </p>
          </div>

          <div className="py-2 space-y-1 border-t border-b border-dashed border-[#e8e4d9]">
            {caminos.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => seleccionarOpcion(item.id)}
                className="group cursor-pointer px-2 py-2 rounded-xl hover:bg-[#f6f3ea] transition-all flex items-baseline justify-between gap-3 text-xs"
              >
                <div className="flex items-baseline gap-2 overflow-hidden">
                  <span className="text-[10px] text-[#75706b] font-mono shrink-0">0{idx + 1}.</span>
                  <span className="text-[#23211e] font-sans group-hover:underline decoration-[#23211e]/30 underline-offset-4 truncate">
                    {item.titulo}
                  </span>
                </div>
                <span className="text-[11px] font-sans font-medium text-[#75706b] group-hover:text-[#23211e] shrink-0">
                  {item.precio}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={enIrALogin}
              className="text-xs text-[#75706b] hover:text-[#23211e] transition-colors border-b border-transparent hover:border-[#23211e]"
            >
              ¿ya tienes tu llave? entra aquí →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-[10px] text-[#75706b] uppercase tracking-widest font-sans font-medium">
              ✦ tu espacio en el club
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

          <div className="p-4 rounded-2xl bg-[#f6f3ea] border border-[#e8e4d9]">
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
                : \`Elegir \${modalidadSeleccionada.nombre} en Stripe\`}
            </button>

            <button
              onClick={() => setModalidadSeleccionada(null)}
              className="block w-full text-center text-xs text-[#75706b] hover:text-[#23211e] font-sans transition-colors pt-1"
            >
              ← volver al índice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(gildaComponentPath, gildaCode, 'utf8');
console.log("✅ Índice editorial aplicado en src/components/CreaTuGilda.jsx!");
