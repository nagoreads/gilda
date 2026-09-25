const edificio = document.getElementById('edificio');

const SHEET_ID = "1YTlw2FAtoRzE_Ei-n4UmAGAnZA7Kg0PrRUuLUVPsJAM";
const SHEET_TAB_NAME = "usuarias";
const URL_API_DIRECTA = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_TAB_NAME}`;

const LIBRO_ACTUAL = {
  titulo: "la campana de cristal",
  paginasTotales: 264
};

const listaDeRespaldo = [
  { nombre: "nagore", pagina: 20, leyendo: true },
  { nombre: "urtzi", pagina: 20, leyendo: true },
  { nombre: "ane", pagina: 0, leyendo: false },
  { nombre: "maialen", pagina: 20, leyendo: true },
  { nombre: "lau", pagina: 40, leyendo: true }
];

let usuariasClub = [...listaDeRespaldo];
let usuariaActivaIndice = null;

async function cargarDatosDesdeSheets() {
  try {
    const respuesta = await fetch(URL_API_DIRECTA);
    const textoRaw = await respuesta.text();
    
    const textoLimpio = textoRaw.substring(textoRaw.indexOf('{'), textoRaw.lastIndexOf('}') + 1);
    const objetoJson = JSON.parse(textoLimpio);
    const filas = objetoJson.table.rows;
    
    const usuariasMapeadas = filas.map(fila => {
      if (!fila || !fila.c) return null;
      
      const celdaNombre = fila.c[0]; 
      const celdaPagina = fila.c[1]; 
      
      const nombreVal = celdaNombre && celdaNombre.v ? String(celdaNombre.v).trim() : null;
      const paginaVal = celdaPagina && celdaPagina.v ? parseInt(celdaPagina.v) || 0 : 0;
      
      if (!nombreVal || nombreVal.toLowerCase() === "nombre") return null;
      
      return {
        nombre: nombreVal,
        pagina: paginaVal,
        leyendo: paginaVal > 0
      };
    }).filter(u => u !== null);

    if (usuariasMapeadas.length > 0) {
      usuariasClub = usuariasMapeadas;
    }
    
    construirEdificio();
    
    if (usuariaActivaIndice !== null && usuariasClub[usuariaActivaIndice]) {
      mostrarHabitacionPropia(usuariasClub[usuariaActivaIndice]);
    }
  } catch (error) {
    console.error("Conexión activa mediante respaldo:", error);
    construirEdificio();
  }
}

function construirEdificio() {
  if (!edificio) return;
  edificio.innerHTML = ""; 

  usuariasClub.forEach((usuaria, indice) => {
    const contenedorVentana = document.createElement('div');
    contenedorVentana.classList.add('flex', 'flex-col', 'items-center', 'relative');

    const ventana = document.createElement('div');
    ventana.classList.add('ventana');
    ventana.classList.add(usuaria.leyendo ? 'leyendo' : 'pausa');

    if (usuariaActivaIndice === indice) {
      ventana.classList.add('seleccionada');
    }

    // INTERACTIVO: Al pulsar, conmuta la luz y muestra la habitación propia
    ventana.addEventListener('click', () => {
      document.querySelectorAll('.ventana').forEach(v => v.classList.remove('seleccionada'));
      ventana.classList.add('seleccionada');
      
      usuaria.leyendo = !usuaria.leyendo;
      ventana.className = `ventana ${usuaria.leyendo ? 'leyendo' : 'pausa'} seleccionada`;
      
      usuariaActivaIndice = indice;
      mostrarHabitacionPropia(usuaria);
      
      const textoProgreso = usuaria.pagina > 0 && usuaria.leyendo ? `pág. ${usuaria.pagina}` : "en pausa";
      tooltip.innerHTML = `<b>${usuaria.nombre.toLowerCase()}</b>: ${textoProgreso}`;
    });

    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    const textoProgreso = usuaria.pagina > 0 && usuaria.leyendo ? `pág. ${usuaria.pagina}` : "en pausa";
    tooltip.innerHTML = `<b>${usuaria.nombre.toLowerCase()}</b>: ${textoProgreso}`;

    contenedorVentana.appendChild(ventana);
    contenedorVentana.appendChild(tooltip);
    edificio.appendChild(contenedorVentana);
  });
}

// FORMATO ELÁSTICO DE UN SOLO RENGLÓN CONTINUO
function mostrarHabitacionPropia(usuaria) {
  const contenedorHabitacion = document.getElementById('habitacion-gilda');
  const titulo = document.getElementById('titulo-habitacion');
  const bloqueColor = document.getElementById('bloque-color-libro');
  const textoInfo = document.getElementById('info-progreso');
  const btnCaptura = document.getElementById('btn-modo-captura');
  
  if (!contenedorHabitacion || !titulo || !bloqueColor || !textoInfo) return;

  titulo.innerText = `la habitación propia de ${usuaria.nombre.toLowerCase()}`;
  
  if (!usuaria.leyendo || usuaria.pagina === 0) {
    bloqueColor.className = "libro-bloque en-pausa";
    textoInfo.innerHTML = `esperando en el umbral de <i>${LIBRO_ACTUAL.titulo}</i>.`;
  } 
  else if (usuaria.pagina >= LIBRO_ACTUAL.paginasTotales) {
    bloqueColor.className = "libro-bloque en-pausa"; 
    textoInfo.innerHTML = `ha cerrado las páginas de <i>${LIBRO_ACTUAL.titulo}</i>.`;
  } 
  else {
    bloqueColor.className = "libro-bloque"; 
    textoInfo.innerHTML = `leyendo la página <b>${usuaria.pagina}</b> de <i>${LIBRO_ACTUAL.titulo}</i>.`;
  }
  
  contenedorHabitacion.style.display = "block"; 
  if (btnCaptura) btnCaptura.style.display = "flex"; 
}

document.addEventListener("DOMContentLoaded", () => {
  const btnCaptura = document.getElementById('btn-modo-captura');
  const postal = document.getElementById('habitacion-gilda');

  if (btnCaptura) {
    btnCaptura.addEventListener('click', (e) => {
      e.stopPropagation();
      document.body.classList.toggle('modo-screenshot');
    });
  }

  if (postal) {
    postal.addEventListener('click', () => {
      if (document.body.classList.contains('modo-screenshot')) {
        document.body.classList.remove('modo-screenshot');
      }
    });
  }

  cargarDatosDesdeSheets();
  setInterval(cargarDatosDesdeSheets, 20000);
});
