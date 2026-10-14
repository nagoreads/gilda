import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function ModalMomentoGilda({ onClose, sesion, supabase, cargarDatosSupabase, mostrarToast }) {
  const [paso, setPaso] = useState('trasera'); 
  const [fotoTrasera, setFotoTrasera] = useState(null);
  const [fotoFinal, setFotoFinal] = useState(null);
  const [cuentaAtras, setCuentaAtras] = useState(3);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const iniciarCamara = useCallback(async (tipo) => {
    detenerCamara();
    try {
      // Pedimos máxima calidad (HD) pero usando "ideal" para que el móvil no aplique zoom digital
      const constraints = {
        video: { 
          facingMode: tipo === 'trasera' ? 'environment' : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1920 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(() => {});
        };
      }
    } catch (err) {
      if (mostrarToast) mostrarToast("Permite el acceso a la cámara.");
    }
  }, [mostrarToast]);

  useEffect(() => {
    if (paso === 'trasera' || paso === 'frontal') iniciarCamara(paso);
    return detenerCamara;
  }, [paso, iniciarCamara]);

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturarTrasera = () => {
    if (!videoRef.current || !videoRef.current.videoWidth) return;
    const w = videoRef.current.videoWidth;
    const h = videoRef.current.videoHeight;
    
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, w, h);
    // Guardamos con calidad máxima (1.0)
    setFotoTrasera(canvas.toDataURL('image/jpeg', 1.0));
    
    setCuentaAtras(3);
    setPaso('frontal');
  };

  useEffect(() => {
    if (paso === 'frontal') {
      const timer = setInterval(() => {
        setCuentaAtras((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            capturarFrontalYFusionar();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [paso]);

  const capturarFrontalYFusionar = async () => {
    setPaso('procesando');
    if (!videoRef.current) return;

    const sW = videoRef.current.videoWidth || 1080;
    const sH = videoRef.current.videoHeight || 1920;
    const selfieCanvas = document.createElement('canvas');
    selfieCanvas.width = sW;
    selfieCanvas.height = sH;
    selfieCanvas.getContext('2d').drawImage(videoRef.current, 0, 0, sW, sH);
    const fotoFrontal = selfieCanvas.toDataURL('image/jpeg', 1.0);

    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    try {
      const [imgTrasera, imgFrontal] = await Promise.all([
        loadImage(fotoTrasera),
        loadImage(fotoFrontal)
      ]);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Resolución final tipo Instagram Story
      canvas.width = 1080;
      canvas.height = 1920;

      // 1. Fondo (Trasera) - Recorte cover perfecto
      const scaleT = Math.max(canvas.width / imgTrasera.width, canvas.height / imgTrasera.height);
      const xT = (canvas.width / 2) - (imgTrasera.width / 2) * scaleT;
      const yT = (canvas.height / 2) - (imgTrasera.height / 2) * scaleT;
      ctx.drawImage(imgTrasera, xT, yT, imgTrasera.width * scaleT, imgTrasera.height * scaleT);

      // 2. Selfie frontal
      const rectWidth = 320;
      const rectHeight = 420;
      const margin = 50;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(margin, margin, rectWidth, rectHeight, 30);
      ctx.clip();

      ctx.translate(margin, margin);
      ctx.translate(rectWidth, 0);
      ctx.scale(-1, 1);

      const sScale = Math.max(rectWidth / imgFrontal.width, rectHeight / imgFrontal.height);
      const sX = (rectWidth / 2) - (imgFrontal.width / 2) * sScale;
      const sY = (rectHeight / 2) - (imgFrontal.height / 2) * sScale;

      ctx.drawImage(imgFrontal, sX, sY, imgFrontal.width * sScale, imgFrontal.height * sScale);
      ctx.restore();

      // 3. Bordes y Marca de agua
      ctx.beginPath();
      ctx.roundRect(margin, margin, rectWidth, rectHeight, 30);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#23211e';
      ctx.stroke();

      ctx.fillStyle = '#ffffee';
      ctx.font = 'bold 45px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText('aquí y ahora ✦ @gilda.mailclub', 60, canvas.height - 80);

      // Calidad de exportación máxima
      setFotoFinal(canvas.toDataURL('image/jpeg', 0.95));
      detenerCamara();
      setPaso('preview');

    } catch (err) {
      if (mostrarToast) mostrarToast("Hubo un fallo revelando. Inténtalo de nuevo.");
      setPaso('trasera');
    }
  };

  const compartirEnStories = async () => {
    try {
      const response = await fetch(fotoFinal);
      const blob = await response.blob();
      const file = new File([blob], 'momento-gilda.jpg', { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'aquí y ahora en gilda', files: [file] });
      } else {
        const link = document.createElement('a');
        link.href = fotoFinal;
        link.download = 'momento-gilda.jpg';
        link.click();
        if (mostrarToast) mostrarToast("Imagen descargada para compartir");
      }
    } catch (err) {
      if (mostrarToast) mostrarToast("No se pudo abrir el menú de compartir.");
    }
  };

  const publicarMomento = async () => {
    if (!sesion?.email || !fotoFinal) return;
    if (mostrarToast) mostrarToast("Publicando tu instante...");
    
    const publicacion = {
      tipo: 'momento_gilda',
      email: sesion.email,
      nombre: sesion.nombre,
      portada: fotoFinal,
      timestamp: new Date().toISOString()
    };
    
    await supabase.from('wall_posts').insert([publicacion]);
    if (cargarDatosSupabase) await cargarDatosSupabase();
    if (mostrarToast) mostrarToast("¡Publicado en el muro!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23211e] bg-opacity-95 p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-black text-[#ffffee] flex flex-col">
        
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <span className="font-babydoll text-xl font-bold drop-shadow-md">aquí y ahora ✦</span>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>

        <div className="relative w-full aspect-[9/16] bg-zinc-900 flex items-center justify-center overflow-hidden">
          {(paso === 'trasera' || paso === 'frontal') && (
            <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${paso === 'frontal' ? 'scale-x-[-1]' : ''}`} />
          )}

          {paso === 'frontal' && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <span className="text-8xl font-babydoll font-bold drop-shadow-xl animate-pulse">{cuentaAtras}</span>
            </div>
          )}

          {paso === 'procesando' && (
             <div className="text-center space-y-3">
               <div className="w-8 h-8 border-4 border-[#ffffee] border-t-transparent rounded-full animate-spin mx-auto"></div>
               <p className="font-sans text-xs">Revelando...</p>
             </div>
          )}

          {paso === 'preview' && fotoFinal && (
            <img src={fotoFinal} alt="Momento Gilda" className="w-full h-full object-cover" />
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 bg-[#23211e] flex flex-col gap-3">
          {paso === 'trasera' && (
            <button onClick={capturarTrasera} className="w-16 h-16 rounded-full bg-white border-4 border-zinc-400 mx-auto hover:scale-95 transition-transform" />
          )}
          
          {paso === 'preview' && (
            <>
              <button onClick={compartirEnStories} className="w-full bg-[#ffffee] text-[#23211e] py-3 rounded-xl font-sans font-medium text-xs flex items-center justify-center gap-2">
                <i className="fa-brands fa-instagram"></i> Compartir en Stories
              </button>
              <button onClick={publicarMomento} className="w-full bg-zinc-800 text-[#ffffee] py-3 rounded-xl font-sans font-medium text-xs hover:bg-zinc-700 transition-colors">
                Publicar en el club
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
