const fs = require('fs');

// 1. Actualizar CreaTuGilda.jsx con formato de lista orgánica (a., b., c.)
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
    id: 'papel',
    nombre: 'gilda de papel',
    precio: '10 €/mes',
    esGratis: false,
    descripcion: 'recibe por correo postal (sí, llega hasta el buzón de tu casa porque solo soy una chica que adora escribir cartas a mano) la carta sorpresa de gilda, con distintas actividades creativas, pasatiempos, pegatinas, anti - guía de lectura de autora (esto lo recibirás a través de un qr monísimo porque algunas guías son demasiado largas como para meterlas en un sobre), marcapáginas, y muchas sorpresas más.',
    enlaceStripe: 'https://buy.stripe.com/bJe8wJ7Yt50l1wIbBz6Ri04'
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
    id: 'absoluta',
    nombre: 'gilda absoluta',
    precio: '12 €/mes',
    esGratis: false,
    descripcion: 'la experiencia completa: recibe todo el contenido en papel en tu buzón de casa y acceso total a la app, al chat y a los cafecitos del club.',
    enlaceStripe: 'https://buy.stripe.com/14A5kxemReAV2AMcFD6Ri08'
  }
];

const preguntas = [
  {
    id: 'interaccion',
    titulo: "¿Cómo te apetece estar por aquí?",
    subtitulo: "Elige la forma de acompañarnos que mejor encaje contigo.",
    opciones: [
      { texto: "Asomarme de vez en cuando, leer comentarios y seguir mi propio ritmo.", valor: 'sombra' },
      { texto: "Comentar capítulo a capítulo y compartir impresiones como en una lectura conjunta.", valor: 'lectura' },
      { texto: "Estar en todo: la rutina de lectura, el chat de la comunidad y los cafecitos virtuales.", valor: 'completo' }
    ]
  },
  {
    id: 'correo',
    titulo: "¿Te apetece recibir correspondencia?",
    subtitulo: "Cartas, actividades y detalles pensados para cada mes.",
    opciones: [
      { texto: "Prefiero enfocarme en la app y no recibir nada por correo.", valor: 'ninguno' },
      { texto: "Me hace ilusión recibir la carta mensual por correo electrónico (con guías y descargables).", valor: 'email' },
      { texto: "Quiero recibir la carta física escrita a mano en el buzón de mi casa.", valor: 'papel' }
    ]
  },
  {
    id: 'presupuesto',
    titulo: "¿Qué opción se adapta a tu momento?",
    subtitulo: "Puedes cambiar o cancelar cuando quieras.",
    opciones: [
      { texto: "Entrar de forma gratuita para probar.", valor: 'gratis' },
      { texto: "Una contribución tranquila (entre 1 € y 5 € al mes).", valor: 'suave' },
      { texto: "La experiencia completa con cartas o acceso total (entre 8 € y 12 € al mes).", valor: 'completo' }
    ]
  }
];

const letras = ['a.', 'b.', 'c.'];

export default function CreaTuGilda({ enEntrarGratis, enIrALogin }) {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [modalidadRecomendada, setModalidadRecomendada] = useState(null);

  const seleccionarRespuesta = (clave, valor) => {
    const nuevasRespuestas = { ...respuestas, [clave]: valor };
    setRespuestas(nuevasRespuestas);

    if (paso < preguntas.length - 1) {
      setPaso(paso + 1);
    } else {
      calcularMatch(nuevasRespuestas);
    }
  };

  const calcularMatch = (res) => {
    if (res.presupuesto === 'gratis') {
      setModalidadRecomendada(MODALIDADES_GILDA.find(m => m.id === 'cotilla'));
      return;
    }

    if (res.correo === 'papel' && (res.interaccion === 'completo' || res.presupuesto === 'completo')) {
      setModalidadRecomendada(MODALIDADES_GILDA.find(m => m.id === 'absoluta'));
      return;
    }

    if (res.correo === 'papel') {
      setModalidadRecomendada(MODALIDADES_GILDA.find(m => m.id === 'papel'));
      return;
    }

    if (res.correo === 'email' && (res.interaccion === 'completo' || res.presupuesto === 'completo')) {
      setModalidadRecomendada(MODALIDADES_GILDA.find(m => m.id === 'virtual'));
      return;
    }

    if (res.correo === 'email') {
      setModalidadRecomendada(MODALIDADES_GILDA.find(m => m.id === 'nube'));
      return;
    }

    if (res.interaccion === 'completo') {
      setModalidadRecomendada(MODALIDADES_GILDA.find(m => m.id === 'cafe'));
      return;
    }

    setModalidadRecomendada(MODALIDADES_GILDA.find(m => m.id === 'satelite'));
  };

  const confirmarModalidad = () => {
    if (!modalidadRecomendada) return;

    if (modalidadRecomendada.esGratis) {
      enEntrarGratis();
    } else if (modalidadRecomendada.enlaceStripe) {
      window.location.href = modalidadRecomendada.enlaceStripe;
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {!modalidadRecomendada ? (
        <div key={paso} className="animate-fade-in space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[#75706b] uppercase tracking-widest font-sans font-medium">
              <span>✦ test de afición — {paso + 1}/{preguntas.length}</span>
              <div className="flex gap-1.5">
                {preguntas.map((_, i) => (
                  <span
                    key={i}
                    className={\`h-1.5 rounded-full transition-all duration-300 \${
                      i === paso ? 'w-5 bg-[#23211e]' : 'w-1.5 bg-[#e8e4d9]'
                    }\`}
                  />
                ))}
              </div>
            </div>

            <h2 className="font-babydoll text-2xl font-bold text-[#23211e] leading-tight pt-1">
              {preguntas[paso].titulo}
            </h2>
            <p className="text-xs text-[#75706b] font-sans leading-relaxed">
              {preguntas[paso].subtitulo}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            {preguntas[paso].opciones.map((op, idx) => (
              <div
                key={idx}
                onClick={() => seleccionarRespuesta(preguntas[paso].id, op.valor)}
                className="group cursor-pointer p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-[#e8e4d9] hover:border-[#23211e] transition-all duration-200 flex items-start gap-3 active:scale-[0.99]"
              >
                <span className="font-babydoll font-bold text-sm text-[#75706b] group-hover:text-[#23211e] transition-colors shrink-0 pt-0.5">
                  {letras[idx]}
                </span>
                <span className="text-xs font-sans text-[#23211e] leading-relaxed flex-grow">
                  {op.texto}
                </span>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-[#23211e] shrink-0 self-center">
                  →
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#e8e4d9]/60 flex justify-between items-center text-xs text-[#75706b]">
            {paso > 0 ? (
              <button
                onClick={() => setPaso(paso - 1)}
                className="hover:text-[#23211e] transition-colors flex items-center gap-1 font-medium"
              >
                ← Volver
              </button>
            ) : (
              <span className="text-[11px] italic text-[#75706b]">responde sin prisa</span>
            )}
            <button
              onClick={enIrALogin}
              className="hover:text-[#23211e] transition-colors text-[11px] border-b border-transparent hover:border-[#23211e]"
            >
              ¿ya tienes la llave? entra aquí →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-[10px] text-[#75706b] uppercase tracking-widest font-sans font-medium">
              ✦ tu rincón ideal en gilda
            </span>
            <div className="flex justify-between items-baseline pt-1">
              <h2 className="font-babydoll text-3xl font-bold text-[#23211e]">
                {modalidadRecomendada.nombre}
              </h2>
              <span className="text-xs font-medium bg-[#23211e] text-[#ffffee] px-3 py-1 rounded-full font-sans shadow-xs">
                {modalidadRecomendada.precio}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-[#e8e4d9]">
            <p className="text-xs text-[#75706b] font-sans leading-relaxed">
              {modalidadRecomendada.descripcion}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={confirmarModalidad}
              className="w-full editorial-btn py-3 text-xs font-medium text-center block hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-sm"
            >
              {modalidadRecomendada.esGratis
                ? 'Entrar gratis al club'
                : \`Elegir \${modalidadRecomendada.nombre} en Stripe\`}
            </button>

            <button
              onClick={() => {
                setModalidadRecomendada(null);
                setPaso(0);
                setRespuestas({});
              }}
              className="block w-full text-center text-xs text-[#75706b] hover:text-[#23211e] font-sans transition-colors pt-1"
            >
              Repetir el test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(gildaComponentPath, gildaCode, 'utf8');
console.log("✅ src/components/CreaTuGilda.jsx actualizado!");

// 2. Actualizar App.jsx eliminando la caja contenedora
const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  const startMarker = 'if (!supabaseSession) {';
  const endMarker = 'return (\n    <div className="min-h-screen flex flex-col items-center';

  const startIndex = code.indexOf(startMarker);
  const endIndex = code.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    const nuevoBloqueAcceso = `if (!supabaseSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-12 bg-[#ffffee] page-transition">
        {vistaAcceso === 'crea-tu-gilda' ? (
          <div className="w-full max-w-md animate-fade-in">
            <div className="text-center mb-2 flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-widest text-[#75706b] font-sans font-medium hover:text-[#23211e] transition-colors cursor-default">club de lectura, mailclub y comunidad</p>
              <div className="flex justify-center my-0">
                <img 
                  src="/icon-192.png" 
                  alt="Gilda" 
                  className="w-56 h-56 object-contain hover:scale-105 hover:rotate-3 transition-all duration-300 ease-out cursor-pointer active:scale-95" 
                  title="¡Hola!"
                />
              </div>
              <h1 className="font-babydoll text-6xl text-[#23211e] font-bold -mt-4 hover:scale-105 transition-transform duration-200 cursor-default">gilda</h1>
            </div>
            <div className="pt-2">
              <CreaTuGilda
                enEntrarGratis={() => setVistaAcceso('menu')}
                enIrALogin={() => setVistaAcceso('menu')}
              />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="text-center mb-2 flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-widest text-[#75706b] font-sans font-medium hover:text-[#23211e] transition-colors cursor-default">club de lectura, mailclub y comunidad</p>
              <div className="flex justify-center my-0">
                <img 
                  src="/icon-192.png" 
                  alt="Gilda" 
                  className="w-56 h-56 object-contain hover:scale-105 hover:rotate-3 transition-all duration-300 ease-out cursor-pointer active:scale-95" 
                  title="¡Hola!"
                />
              </div>
              <h1 className="font-babydoll text-6xl text-[#23211e] font-bold -mt-4 hover:scale-105 transition-transform duration-200 cursor-default">gilda</h1>
            </div>

            {vistaAcceso === 'menu' && (
              <form onSubmit={handleMagicLinkLogin} className="space-y-4 font-sans text-left pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#23211e] mb-1">Correo electrónico</label>
                  <input 
                    type="email" 
                    placeholder="tuemail@ejemplo.com" 
                    value={emailLogin} 
                    onChange={e => setEmailLogin(e.target.value)} 
                    disabled={esperandoToken} 
                    required 
                    className="w-full editorial-input px-3.5 py-2.5 text-xs disabled:opacity-50 focus:scale-[1.01] transition-transform duration-200" 
                  />
                </div>
                
                {esperandoToken && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-medium text-[#23211e] mt-3 mb-1">Código de 6 dígitos recibido</label>
                    <input 
                      type="text" 
                      placeholder="123456" 
                      value={tokenLogin} 
                      onChange={e => setTokenLogin(e.target.value)} 
                      required 
                      className="w-full editorial-input px-3.5 py-2.5 text-xs text-center tracking-[0.5em] font-bold focus:scale-[1.01] transition-transform duration-200" 
                      maxLength={6} 
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loadingAuth} 
                  className="w-full editorial-btn py-3 text-xs font-medium hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow"
                >
                  {loadingAuth ? "procesando..." : (esperandoToken ? "entrar al club" : "enviadme la llave por correo")}
                </button>
                
                {!esperandoToken && (
                  <div className="pt-3 flex justify-between items-center text-xs text-[#75706b] border-t border-[#e8e4d9]/60">
                    <button 
                      type="button" 
                      onClick={() => setVistaAcceso("crea-tu-gilda")} 
                      className="hover:text-[#23211e] transition-colors border-b border-transparent hover:border-[#23211e]"
                    >
                      ← Volver al test
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setVistaAcceso("modalidades")} 
                      className="hover:text-[#23211e] transition-colors border-b border-transparent hover:border-[#23211e]"
                    >
                      Ver membresías
                    </button>
                  </div>
                )}
              </form>
            )}

            {vistaAcceso === 'modalidades' && (
              <div className="space-y-4 text-left page-transition">
                <button onClick={() => setVistaAcceso('crea-tu-gilda')} className="text-xs font-medium text-[#75706b] hover:text-[#23211e] flex items-center transition-colors">← Volver al test</button>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {modalidades.map(m => (
                    <div key={m.id} className="editorial-card p-4 space-y-2 bg-white border border-[#e8e4d9] hover:-translate-y-0.5 transition-transform duration-200">
                      <div className="flex justify-between items-center"><h3 className="font-babydoll font-bold text-lg">{m.nombre}</h3><span className="text-xs font-medium bg-[#23211e] text-[#ffffee] px-2.5 py-1 rounded-full">{m.precio}</span></div>
                      <p className="text-xs text-[#75706b] font-sans">{m.descripcion}</p>
                      <a href={m.esGratis ? '#' : m.enlaceStripe} onClick={e => { if (m.esGratis) setVistaAcceso('menu'); }} className="block w-full mt-2 py-2 text-center text-xs editorial-btn font-medium hover:-translate-y-0.5 active:scale-[0.98] transition-all">{m.esGratis ? 'Probar gratis' : 'Elegir esta modalidad'}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }\n\n  `;

    code = code.substring(0, startIndex) + nuevoBloqueAcceso + code.substring(endIndex);
    fs.writeFileSync(appPath, code, 'utf8');
    console.log("✅ src/App.jsx actualizado!");
  }
}
