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
        <>
          <div className="space-y-1">
            <span className="text-[11px] text-[#75706b] font-sans tracking-wide">
              pregunta {paso + 1} de {preguntas.length}
            </span>
            <h2 className="font-babydoll text-3xl font-bold text-[#23211e] leading-tight">
              {preguntas[paso].titulo}
            </h2>
            <p className="text-xs text-[#75706b] font-sans leading-relaxed">
              {preguntas[paso].subtitulo}
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {preguntas[paso].opciones.map((op, idx) => (
              <button
                key={idx}
                onClick={() => seleccionarRespuesta(preguntas[paso].id, op.valor)}
                className="w-full text-left p-3.5 rounded-xl bg-[#ffffee] border border-[#e8e4d9] hover:border-[#23211e] transition-all text-xs font-sans text-[#23211e] leading-relaxed interactive-lift"
              >
                {op.texto}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#e8e4d9] flex justify-between items-center text-xs text-[#75706b]">
            {paso > 0 ? (
              <button
                onClick={() => setPaso(paso - 1)}
                className="hover:text-[#23211e] transition-colors"
              >
                ← Anterior
              </button>
            ) : (
              <span>crea tu propia gilda</span>
            )}
            <button
              onClick={enIrALogin}
              className="hover:text-[#23211e] transition-colors"
            >
              ya soy gilda
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-5 page-transition">
          <div className="space-y-1">
            <span className="text-[11px] text-[#75706b] uppercase tracking-wider font-sans font-medium">
              tu modalidad sugerida
            </span>
            <div className="flex justify-between items-baseline pt-1">
              <h2 className="font-babydoll text-3xl font-bold text-[#23211e]">
                {modalidadRecomendada.nombre}
              </h2>
              <span className="text-xs font-medium bg-[#23211e] text-[#ffffee] px-2.5 py-1 rounded-full font-sans">
                {modalidadRecomendada.precio}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#ffffee] border border-[#e8e4d9]">
            <p className="text-xs text-[#75706b] font-sans leading-relaxed">
              {modalidadRecomendada.descripcion}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={confirmarModalidad}
              className="w-full editorial-btn py-3 text-xs font-medium text-center block"
            >
              {modalidadRecomendada.esGratis
                ? 'Entrar gratis al club'
                : `Elegir ${modalidadRecomendada.nombre} en Stripe`}
            </button>

            <button
              onClick={() => {
                setModalidadRecomendada(null);
                setPaso(0);
                setRespuestas({});
              }}
              className="block w-full text-center text-xs text-[#75706b] hover:text-[#23211e] font-sans transition-colors pt-1"
            >
              Volver a responder el test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}