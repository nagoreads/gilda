import { useState, useRef, useEffect } from 'react';

export default function ModalMomentoGilda({ onClose, sesion, supabase, cargarDatosSupabase, mostrarToast }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [paso, setPaso] = useState('camara'); // 'camara' | 'capturando' | 'vista_previa' | 'subiendo'
  const [streamActivo, setStreamActivo] = useState(null);
  const [imagenFinalComposite, setImagenFinalComposite] = useState(null);

  const detenerCamara = () => {
    if (streamActivo) {
      streamActivo.getTracks().forEach(track => track.stop());
      setStreamActivo(null);
    }
  };

  useEffect(() => {
    iniciarCamaraTrasera();
    return () => detenerCamara();
  }, []);

  // Iniciar la visión en directo con la cámara trasera
  const iniciarCamaraTrasera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false
      });
      setStreamActivo(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      mostrarToast('No se pudo acceder a la cámara.');
    }
  };

  // Captura instantánea en un solo clic (disparo doble en ráfaga automática)
  const tomarCapturaInstantanea = async () => {
    if (!videoRef.current) return;
    setPaso('capturando');

    try {
      // 1. Capturar encuadre de la cámara trasera
      const canvasBack = document.createElement('canvas');
      canvasBack.width = videoRef.current.videoWidth || 1080;
      canvasBack.height = videoRef.current.videoHeight || 1440;
      const ctxBack = canvasBack.getContext('2d');
      ctxBack.drawImage(videoRef.current, 0, 0, canvasBack.width, canvasBack.height);
      const dataBack = canvasBack.toDataURL('image/jpeg', 0.85);

      // Detener flujo trasero
      detenerCamara();

      // 2. Cambiar inmediatamente a la cámara frontal (selfie)
      const streamFront = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false
      });
      setStreamActivo(streamFront);

      if (videoRef.current) {
        videoRef.current.srcObject = streamFront;
        // Esperar brevemente a que el sensor frontal renderice el primer fotograma
        await new Promise(resolve => setTimeout(resolve, 300));

        const canvasFront = document.createElement('canvas');
        canvasFront.width = videoRef.current.videoWidth || 720;
        canvasFront.height = videoRef.current.videoHeight || 960;
        const ctxFront = canvasFront.getContext('2d');
        ctxFront.drawImage(videoRef.current, 0, 0, canvasFront.width, canvasFront.height);
        const dataFront = canvasFront.toDataURL('image/jpeg', 0.85);

        detenerCamara();

        // 3. Fusionar ambas fotos en el estilo doble BeReal
        componerImagenDoble(dataBack, dataFront);
      }
    } catch (err) {
      console.error(err);
      mostrarToast('Error al tomar la instantánea doble.');
      detenerCamara();
      iniciarCamaraTrasera();
      setPaso('camara');
    }
  };

  // Componer foto doble (Fondo principal + Selfie en recuadro)
  const componerImagenDoble = (backSrc, frontSrc) => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350; // Formato 4:5
    const ctx = canvas.getContext('2d');

    const imgBack = new Image();
    const imgFront = new Image();

    imgBack.onload = () => {
      // Dibujar foto principal
      ctx.drawImage(imgBack, 0, 0, canvas.width, canvas.height);

      imgFront.onload = () => {
        // Dibujar recuadro de la selfie en la esquina superior izquierda
        const insetWidth = 280;
        const insetHeight = 370;
        const insetX = 40;
        const insetY = 40;
        const radius = 24;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(insetX + radius, insetY);
        ctx.lineTo(insetX + insetWidth - radius, insetY);
        ctx.quadraticCurveTo(insetX + insetWidth, insetY, insetX + insetWidth, insetY + radius);
        ctx.lineTo(insetX + insetWidth, insetY + insetHeight - radius);
        ctx.quadraticCurveTo(insetX + insetWidth, insetY + insetHeight, insetX + insetWidth - radius, insetY + insetHeight);
        ctx.lineTo(insetX + radius, insetY + insetHeight);
        ctx.quadraticCurveTo(insetX, insetY + insetHeight, insetX, insetY + insetHeight - radius);
        ctx.lineTo(insetX, insetY + radius);
        ctx.quadraticCurveTo(insetX, insetY, insetX + radius, insetY);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(imgFront, insetX, insetY, insetWidth, insetHeight);
        ctx.restore();

        // Borde blanco del recuadro selfie
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Sello sobrio abajo a la derecha
        ctx.font = '32px BabyDoll, cursive';
        ctx.fillStyle = '#ffffee';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.fillText('momento gilda ✦', canvas.width - 280, canvas.height - 50);

        const finalData = canvas.toDataURL('image/jpeg', 0.9);
        setImagenFinalComposite(finalData);
        setPaso('vista_previa');
      };
      imgFront.src = frontSrc;
    };
    imgBack.src = backSrc;
  };

  const guardarMomento = async () => {
    if (!imagenFinalComposite || !sesion?.email) return;
    setPaso('subiendo');

    try {
      await supabase.from('wall_posts').insert([{
        tipo: 'momento_gilda',
        cita: 'Momento Gilda instantáneo ✦',
        email: sesion.email,
        nombre: sesion.nombre,
        portada: imagenFinalComposite,
        timestamp: new Date().toISOString()
      }]);

      await cargarDatosSupabase();
      mostrarToast('¡Momento Gilda publicado en el muro!');
      onClose();
    } catch (err) {
      console.error(err);
      mostrarToast('Error al publicar.');
      setPaso('vista_previa');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="editorial-card max-w-sm w-full p-5 space-y-4 bg-white modal-elastic relative text-center">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center border-b border-[#e8e4d9] pb-3">
          <h2 className="font-babydoll text-2xl font-bold text-[#23211e]">Momento Gilda ✦</h2>
          <button onClick={onClose} className="text-xs text-[#75706b] hover:text-[#23211e]">✕</button>
        </div>

        {/* Visor de Cámara y Botón Único */}
        {paso === 'camara' && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] border border-[#e8e4d9]">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 text-[10px] bg-[#23211e]/80 text-[#ffffee] px-2.5 py-1 rounded-full font-sans">
                Cámara lista
              </span>
            </div>
            <button onClick={tomarCapturaInstantanea} className="w-full editorial-btn py-3 text-xs font-medium">
              📸 Tomar instantánea
            </button>
          </div>
        )}

        {/* Estado en proceso de disparo automático */}
        {paso === 'capturando' && (
          <div className="py-12 space-y-3">
            <video ref={videoRef} autoPlay playsInline className="hidden" />
            <p className="font-babydoll text-xl font-bold text-[#23211e] animate-pulse">Capturando tu momento...</p>
            <p className="text-xs text-[#75706b] font-sans">Procesando cámara principal y selfie</p>
          </div>
        )}

        {/* Vista previa de la foto final */}
        {paso === 'vista_previa' && imagenFinalComposite && (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-[#e8e4d9] aspect-[4/5] bg-[#ffffee]">
              <img src={imagenFinalComposite} alt="Momento Gilda" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setPaso('camara'); iniciarCamaraTrasera(); }} className="flex-1 bg-white border border-[#e8e4d9] py-2.5 text-xs font-medium rounded-xl text-[#75706b]">
                Repetir
              </button>
              <button onClick={guardarMomento} className="flex-1 editorial-btn py-2.5 text-xs font-medium">
                Publicar
              </button>
            </div>
          </div>
        )}

        {/* Estado de guardado */}
        {paso === 'subiendo' && (
          <div className="py-10 space-y-2">
            <p className="font-babydoll text-lg font-bold text-[#23211e]">Subiendo al muro...</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}