"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  ArrowRight, Star, Clock, MapPin, 
  ShoppingBag, X, Check, Phone, Instagram, Mail,
  Trash2, User, Calendar as CalIcon, ArrowLeft 
} from 'lucide-react';
import { Cinzel, Montserrat } from 'next/font/google';

// --- FUENTES ---
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '500', '600'] });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['300', '400', '500'] });

// --- ESTILOS ---
const GLASS_STYLE = "rounded-full bg-white/5 backdrop-blur-[24px] border-[0.5px] border-white/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_inset_0_0_20px_rgba(255,255,255,0.15),_0_8px_20px_-8px_rgba(0,0,0,0.2)] text-[#1a1a1a] font-bold tracking-widest hover:scale-105 hover:bg-white/15 hover:border-white/50 hover:shadow-[inset_0_4px_10px_rgba(255,255,255,1),_inset_0_0_30px_rgba(255,255,255,0.3),_0_15px_30px_-10px_rgba(0,0,0,0.3)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";
const GLASS_DARK_STYLE = "rounded-full bg-black/5 backdrop-blur-[24px] border-[0.5px] border-white/40 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),_inset_0_-2px_4px_rgba(0,0,0,0.1),_0_8px_20px_-8px_rgba(0,0,0,0.25)] text-[#1a1a1a] font-bold tracking-widest hover:scale-105 hover:bg-black/10 hover:border-white/60 hover:shadow-[inset_0_4px_10px_rgba(255,255,255,1),_inset_0_-4px_8px_rgba(0,0,0,0.15),_0_15px_30px_-10px_rgba(0,0,0,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

// --- DATOS INICIALES (DEMO) ---
const INITIAL_SERVICES = [
  { id: 1, name: "Maderoterapia Sculpt", price: 80, duration: "60 min", img: "https://images.unsplash.com/photo-1519699047748-40baea60f125?q=80&w=2070&auto=format&fit=crop" },
  { id: 2, name: "Gold Facial Radiance", price: 120, duration: "90 min", img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop" },
  { id: 3, name: "Deep Tissue Massage", price: 95, duration: "50 min", img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop" },
  { id: 4, name: "Laser Precision", price: 150, duration: "30 min", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=2080&auto=format&fit=crop" },
];

const INITIAL_PRODUCTS = [
  { id: 1, name: "Bronzer Gold Oil", price: 45, img: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?q=80&w=2670&auto=format&fit=crop" },
  { id: 2, name: "Hydra Serum", price: 68, img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=2574&auto=format&fit=crop" },
  { id: 3, name: "Sculpting Cream", price: 55, img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=2080&auto=format&fit=crop" }, 
  { id: 4, name: "Exfoliante Corporal", price: 35, img: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?q=80&w=2670&auto=format&fit=crop" }, 
];

const INITIAL_SPECIALISTS = [
  { id: 1, name: "Dra. Elena V.", role: "Dermatóloga Senior", img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop" },
  { id: 2, name: "Lic. Sofia M.", role: "Esp. Corporal", img: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?q=80&w=1976&auto=format&fit=crop" },
  { id: 3, name: "Dr. Marco R.", role: "Cirujano Estético", img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=2664&auto=format&fit=crop" },
];

const getNextDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d.getDate(),
      dayName: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()],
      fullDate: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
      isoDate: d.toISOString().split('T')[0]
    });
  }
  return days;
};

// --- FUNCIÓN PARA PROCESAR IMÁGENES (DRIVE + UNSPLASH) ---
const processGoogleImage = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    let id = null;
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
        const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (matchD && matchD[1]) id = matchD[1];
        else { const matchId = url.match(/id=([a-zA-Z0-9_-]+)/); if (matchId && matchId[1]) id = matchId[1]; }
        if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    }
    return url;
};

// --- COMPONENTE SPLASH SCREEN ---
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [animationFinished, setAnimationFinished] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => { setAnimationFinished(true); setTimeout(onComplete, 1000); }, 3500); 
    return () => clearTimeout(timer);
  }, [onComplete]);

  const containerVariants: Variants = { exit: { y: "-100vh", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as const } } };
  const textVariants: Variants = { hidden: { opacity: 0, scale: 0.9, filter: "blur(10px)" }, visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 1.2, ease: "easeOut" } } };
  const dotVariants: Variants = { hidden: { scale: 0, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { delay: 1, type: "spring" as const, stiffness: 200, damping: 10 } } };

  return (
    <motion.div variants={containerVariants} exit="exit" className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-tr from-white via-slate-50 to-[#D4AF37]/5 opacity-50 animate-pulse-slow"></div>
      <motion.div className="relative z-10 flex flex-col items-center p-4 text-center">
        <motion.h1 variants={textVariants} initial="hidden" animate="visible" className={`${cinzel.className} text-4xl md:text-5xl lg:text-7xl tracking-[0.2em] font-bold text-[#1a1a1a] flex items-end gap-2 md:gap-3 drop-shadow-sm`}>
          BRONZER
          <motion.div variants={dotVariants} initial="hidden" animate="visible" className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 bg-[#D4AF37] rounded-full mb-2 md:mb-3 shadow-[0_0_20px_rgba(212,175,55,0.6)] relative">
             <div className="absolute inset-0 bg-white/40 rounded-full animate-ping-slow opacity-50"></div>
          </motion.div>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.8 }} className={`${montserrat.className} text-[#D4AF37] text-[10px] md:text-xs lg:text-sm tracking-[0.4em] uppercase mt-4 md:mt-6 font-medium`}>
           DELUXE
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

// --- COMPONENTE CARRITO CON CHECKOUT ---
const CartDrawer = ({ onClose, cart, removeFromCart, total, onCheckout }: any) => {
  const [view, setView] = useState('cart'); // 'cart' o 'checkout'
  const [paymentMethod, setPaymentMethod] = useState('pago_movil');
  const [paymentRef, setPaymentRef] = useState('');
  const [clientInfo, setClientInfo] = useState({ name: '', phone: '' });

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"></div>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed top-0 right-0 z-[70] h-screen w-full md:w-[450px] bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col border-l border-white/50">
        
        {/* Header del Carrito */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className={`${cinzel.className} text-xl flex items-center gap-2`}>
             {view === 'checkout' && <button onClick={() => setView('cart')} className="mr-2"><ArrowLeft size={18}/></button>}
             {view === 'cart' ? `Tu Bolsa (${cart.length})` : 'Finalizar Compra'}
          </h3>
          <button onClick={onClose} className="hover:text-[#D4AF37] p-2"><X size={24} /></button>
        </div>

        {/* VISTA 1: LISTA DE PRODUCTOS */}
        {view === 'cart' && (
            <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                        <ShoppingBag size={48} strokeWidth={1} className="mb-4"/><p>Tu bolsa está vacía.</p></div>
                    ) : (
                    cart.map((item:any, idx:number) => {
                        return (
                            <div key={idx} className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                                    <img src={processGoogleImage(item.img) || ''} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                    <p className="text-xs text-[#D4AF37] font-bold mt-1">${Number(item.price).toFixed(2)}</p>
                                </div>
                                <button onClick={() => removeFromCart(idx)} className="text-gray-300 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                            </div>
                        )
                    })
                    )}
                </div>
                {cart.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex justify-between mb-6 text-lg font-medium font-serif"><span>Total</span><span>${Number(total).toFixed(2)}</span></div>
                        <button onClick={() => setView('checkout')} className={`w-full py-4 text-xs uppercase tracking-[0.2em] ${GLASS_DARK_STYLE}`}>Ir a Pagar</button>
                    </div>
                )}
            </>
        )}

        {/* VISTA 2: PAGO (CHECKOUT) */}
        {view === 'checkout' && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                <div className="space-y-4 mb-6">
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label><input value={clientInfo.name} onChange={e=>setClientInfo({...clientInfo, name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-black"/></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase">Teléfono</label><input value={clientInfo.phone} onChange={e=>setClientInfo({...clientInfo, phone: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-black"/></div>
                </div>

                <h3 className="text-xs uppercase tracking-widest font-bold mb-3 text-gray-400">Método de Pago</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {['pago_movil', 'binance'].map(m => (
                        <button key={m} onClick={() => setPaymentMethod(m)} className={`py-3 text-[10px] uppercase font-bold border rounded-xl ${paymentMethod === m ? 'bg-black text-[#D4AF37] border-black' : 'bg-white border-gray-200 text-gray-400'}`}>{m.replace('_', ' ')}</button>
                    ))}
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 text-sm text-gray-600 space-y-1">
                    {paymentMethod === 'pago_movil' ? (
                        <>
                            <p><strong>Banco:</strong> Banesco</p>
                            <p><strong>Tel:</strong> 0412-123-4567</p>
                            <p><strong>CI:</strong> V-12345678</p>
                        </>
                    ) : (
                        <>
                            <p><strong>Binance Pay ID:</strong> 123456789</p>
                            <p><strong>Email:</strong> binance@bronzer.com</p>
                        </>
                    )}
                </div>

                <div className="mb-auto">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Referencia</label>
                    <input value={paymentRef} onChange={e=>setPaymentRef(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-black" placeholder="Nro de comprobante"/>
                </div>

                <button 
                    onClick={() => {
                        if(!clientInfo.name || !paymentRef) return alert("Completa todos los datos");
                        // Función que viene del padre para guardar la venta
                        onCheckout({ cart, total, clientInfo, paymentMethod, paymentRef });
                    }} 
                    className={`w-full py-4 text-xs uppercase tracking-[0.2em] mt-6 ${GLASS_DARK_STYLE}`}
                >
                    Confirmar Compra
                </button>
            </div>
        )}

      </motion.div>
    </>
  );
};

// --- COMPONENTE MODAL RESERVA (RESPONSIVE & FILTRADO) ---
const BookingModal = ({ 
  onClose, step, setStep, 
  selectedSpecialist, setSelectedSpecialist, 
  selectedService, setSelectedService, 
  selectedDate, setSelectedDate,
  selectedTime, setSelectedTime,
  clientData, setClientData,
  isSubmitting, saveToDatabase, specialistsList
}: any) => {

  // --- 1. NUEVOS ESTADOS PARA EL PAGO ---
  const [paymentMethod, setPaymentMethod] = useState('pago_movil'); // 'pago_movil', 'binance', 'efectivo'
  const [paymentRef, setPaymentRef] = useState('');

  // --- LÓGICA DE FILTRADO CORREGIDA Y ROBUSTA ---
  const filteredSpecialists = selectedService
    ? specialistsList.filter((spec: any) => {
        // 1. Si el servicio no tiene especialistas asignados en el Admin, mostramos TODOS (por seguridad)
        if (!selectedService.specialists || String(selectedService.specialists).trim() === "") {
             return true;
        }
        
        // 2. Normalizamos texto (minúsculas) para comparar correctamente
        const serviceSpecs = String(selectedService.specialists).toLowerCase();
        const specName = String(spec.name).toLowerCase();

        // 3. Verificamos si el nombre del especialista está dentro de la lista del servicio
        return serviceSpecs.includes(specName);
      })
    : specialistsList; // Si no hay servicio (Botón Agendar General), salen todos.

  return (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white/95 backdrop-blur-xl w-full max-w-4xl max-h-[90vh] md:h-[600px] shadow-2xl overflow-hidden flex flex-col md:flex-row rounded-3xl relative border border-white/50">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black z-20"><X size={24} /></button>
      
      {/* SIDEBAR PASOS (Oculto en móvil) */}
      <div className="w-full md:w-1/3 bg-gray-50/50 p-6 md:p-8 flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100 hidden md:flex">
        <div>
          <h3 className={`${cinzel.className} text-xl md:text-2xl mb-6`}>Tu Cita</h3>
          <div className="space-y-4 md:space-y-6">
             <div className={`flex items-center gap-3 ${step >= 1 ? 'text-black' : 'text-gray-400'}`}><div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-current flex items-center justify-center text-[10px] md:text-xs shadow-sm bg-white">1</div><span className="text-[10px] md:text-xs uppercase tracking-widest">Especialista</span></div>
             <div className={`flex items-center gap-3 ${step >= 2 ? 'text-black' : 'text-gray-400'}`}><div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-current flex items-center justify-center text-[10px] md:text-xs shadow-sm bg-white">2</div><span className="text-[10px] md:text-xs uppercase tracking-widest">Fecha & Hora</span></div>
             <div className={`flex items-center gap-3 ${step >= 3 ? 'text-black' : 'text-gray-400'}`}><div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-current flex items-center justify-center text-[10px] md:text-xs shadow-sm bg-white">3</div><span className="text-[10px] md:text-xs uppercase tracking-widest">Tus Datos</span></div>
             <div className={`flex items-center gap-3 ${step >= 4 ? 'text-black' : 'text-gray-400'}`}><div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-current flex items-center justify-center text-[10px] md:text-xs shadow-sm bg-white">4</div><span className="text-[10px] md:text-xs uppercase tracking-widest">Confirmar</span></div>
          </div>
        </div>
        {selectedSpecialist && (
          <div className="bg-white/80 p-4 border border-gray-100 shadow-sm rounded-2xl backdrop-blur-md mt-4 md:mt-0">
            <p className="text-[10px] uppercase text-gray-400">Especialista</p>
            <p className="font-medium text-sm">{selectedSpecialist.name}</p>
          </div>
        )}
      </div>

      <div className="w-full md:w-2/3 p-6 md:p-8 overflow-y-auto relative no-scrollbar">
        
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className={`${cinzel.className} text-xl md:text-2xl mb-2`}>Selecciona tu Experto</h2>
            <p className="text-gray-400 text-sm mb-6">Elige al profesional para tu tratamiento.</p>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              
              {/* LISTA FILTRADA DE ESPECIALISTAS */}
              {filteredSpecialists.length > 0 ? (
                  filteredSpecialists.map((spec: any) => {
                    const imgUrl = processGoogleImage(spec.img);
                    return (
                    <div key={spec.id} onClick={() => { setSelectedSpecialist(spec); setStep(2); }} className="flex items-center gap-4 p-3 border border-gray-100 rounded-2xl hover:border-[#D4AF37]/50 hover:bg-white hover:shadow-md cursor-pointer transition-all group bg-white/50">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden relative grayscale group-hover:grayscale-0 transition-all border-2 border-white shadow-sm shrink-0">
                        {imgUrl ? <img src={imgUrl} alt={spec.name} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div>
                          <h4 className="font-medium text-sm md:text-base">{spec.name}</h4>
                          <p className="text-[10px] md:text-xs text-[#D4AF37] uppercase">{spec.role}</p>
                          {spec.schedule && <p className="text-[10px] text-gray-400 mt-0.5">{spec.schedule}</p>}
                      </div>
                      <ArrowRight className="ml-auto text-gray-300 group-hover:text-[#D4AF37]" size={18} />
                    </div>
                  )})
              ) : (
                  <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
                      No hay especialistas disponibles para este tratamiento.
                  </div>
              )}
              
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setStep(1)} className="text-xs text-gray-400 underline mb-4">Volver</button>
            <h2 className={`${cinzel.className} text-xl md:text-2xl mb-6`}>Disponibilidad</h2>
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
              {getNextDays().map((day: any, i) => (
                <button key={i} onClick={() => setSelectedDate(day.isoDate)} className={`min-w-[70px] h-20 rounded-2xl border flex flex-col items-center justify-center transition-all shadow-sm ${selectedDate === day.isoDate ? 'bg-black text-white border-black shadow-md scale-105' : 'border-gray-200 bg-white/50 text-gray-400 hover:border-[#D4AF37]'}`}>
                  <span className="text-xs uppercase">{day.dayName}</span><span className="text-xl font-serif">{day.date}</span>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {selectedDate && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <p className="text-xs uppercase tracking-widest mb-3">Horas Disponibles</p>
                  <div className="grid grid-cols-3 gap-3">
                    {['09:00', '11:00', '14:30', '16:00', '17:30'].map(time => (
                      <button key={time} onClick={() => { setSelectedTime(time); setStep(3); }} className={`py-2 text-sm ${GLASS_STYLE.replace('py-3', '').replace('px-8','').replace('tracking-widest','')} hover:bg-white/20`}>{time}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setStep(2)} className="text-xs text-gray-400 underline mb-4">Volver</button>
            <h2 className={`${cinzel.className} text-xl md:text-2xl mb-2`}>Tus Datos</h2>
            <p className="text-gray-400 text-sm mb-8">Necesitamos esta información para confirmar tu cita.</p>
            <div className="space-y-4 md:space-y-6 max-w-sm w-full mx-auto md:mx-0">
              <div><label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Nombre Completo</label><input type="text" value={clientData.name} onChange={(e) => setClientData({...clientData, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#D4AF37] focus:ring-0 outline-none transition-colors" placeholder="Ej: María Pérez" autoFocus /></div>
              <div><label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Teléfono</label><input type="tel" value={clientData.phone} onChange={(e) => setClientData({...clientData, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#D4AF37] focus:ring-0 outline-none transition-colors" placeholder="+58 412 000 0000" /></div>
              <div><label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Nota (Opcional)</label><textarea value={clientData.note} onChange={(e) => setClientData({...clientData, note: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#D4AF37] focus:ring-0 outline-none transition-colors resize-none h-24" placeholder="Alergias, preferencias, etc..." /></div>
              <button onClick={() => { if(clientData.name && clientData.phone) setStep(4); else alert("Por favor completa nombre y teléfono"); }} className={`w-full py-3 px-8 text-xs tracking-widest uppercase ${GLASS_DARK_STYLE}`}>Continuar</button>
            </div>
          </motion.div>
        )}

        {/* PASO 4: CONFIRMACIÓN Y PAGO */}
        {step === 4 && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8">
            <button onClick={() => setStep(3)} className="text-xs text-gray-400 underline mb-2 self-start">Volver</button>
            <h2 className={`${cinzel.className} text-xl md:text-2xl mb-4`}>Finalizar Reserva</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {/* Resumen */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 text-sm">
                    <p className="font-bold text-base mb-2">{selectedService?.name || selectedService?.title}</p>
                    <div className="flex justify-between text-gray-500 mb-1"><span>Especialista:</span> <span className="text-black">{selectedSpecialist.name}</span></div>
                    <div className="flex justify-between text-gray-500 mb-1"><span>Fecha:</span> <span className="text-black">{selectedDate} - {selectedTime}</span></div>
                    <div className="flex justify-between text-gray-500 border-t border-gray-200 pt-2 mt-2"><span>Total a Pagar:</span> <span className="text-[#D4AF37] font-bold">${selectedService?.price}</span></div>
                </div>

                {/* Selección de Pago */}
                <h3 className="text-xs uppercase tracking-widest font-bold mb-3 text-gray-400">Método de Pago</h3>
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {['pago_movil', 'binance', 'efectivo'].map(m => (
                        <button 
                            key={m} 
                            onClick={() => setPaymentMethod(m)} 
                            className={`py-3 text-[10px] md:text-xs uppercase tracking-wider border rounded-xl transition-all ${paymentMethod === m ? 'bg-black text-[#D4AF37] border-black' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'}`}
                        >
                            {m.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Detalles del Pago */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl mb-6 shadow-sm">
                    {paymentMethod === 'pago_movil' && (
                        <div className="text-sm space-y-2">
                            <p className="font-bold text-gray-800">Datos Pago Móvil / Zelle:</p>
                            <p className="text-gray-500">Banco: <span className="text-black">Banesco</span></p>
                            <p className="text-gray-500">Tel: <span className="text-black">0412-123-4567</span></p>
                            <p className="text-gray-500">CI/RIF: <span className="text-black">V-12345678</span></p>
                            <p className="text-gray-500 mt-2 text-xs border-t pt-2">Zelle: <span className="text-black font-medium">pagos@bronzer.com</span></p>
                        </div>
                    )}
                    {paymentMethod === 'binance' && (
                        <div className="text-sm space-y-2">
                            <p className="font-bold text-gray-800">Binance Pay:</p>
                            <p className="text-gray-500">Pay ID: <span className="text-black font-mono bg-gray-100 px-2 py-1 rounded">123456789</span></p>
                            <p className="text-gray-500">Email: <span className="text-black">binance@bronzer.com</span></p>
                            <p className="text-[10px] text-[#D4AF37] mt-2">Recuerda seleccionar USDT</p>
                        </div>
                    )}
                    {paymentMethod === 'efectivo' && (
                        <div className="text-sm text-center py-4 text-gray-500">
                            <p>Realizarás el pago directamente en nuestro mostrador el día de tu cita.</p>
                        </div>
                    )}
                </div>

                {/* Input Referencia (Solo si no es efectivo) */}
                {paymentMethod !== 'efectivo' && (
                    <div className="mb-6">
                        <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Número de Referencia / Comprobante</label>
                        <input 
                            type="text" 
                            value={paymentRef} 
                            onChange={(e) => setPaymentRef(e.target.value)} 
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#D4AF37] outline-none" 
                            placeholder="Ej: 123456..." 
                        />
                    </div>
                )}
            </div>

            <button 
                onClick={() => {
                    // Validar que ponga referencia si no es efectivo
                    if(paymentMethod !== 'efectivo' && !paymentRef) {
                        alert("Por favor ingresa el número de referencia del pago.");
                        return;
                    }
                    // Enviamos los datos extra a la función de guardado
                    saveToDatabase({ paymentMethod, paymentRef }); 
                }} 
                disabled={isSubmitting} 
                className={`w-full py-4 text-xs tracking-widest uppercase ${GLASS_DARK_STYLE} disabled:opacity-50`}
            >
                {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="relative flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(40)].map((_, i) => (
                <motion.div key={i} initial={{ y: -50, x: Math.random() * 400 - 200, opacity: 1, rotate: 0 }} animate={{ y: 500, rotate: 360, opacity: 0 }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2, ease: "linear" }} className="absolute top-0 left-1/2 w-2 h-2" style={{ backgroundColor: ['#D4AF37', '#C0C0C0', '#1a1a1a'][Math.floor(Math.random() * 3)], borderRadius: Math.random() > 0.5 ? '50%' : '0%' }} />
              ))}
            </div>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-lg border border-green-100 z-10"><Check size={32} /></div>
            <h4 className={`${cinzel.className} text-xl md:text-2xl mb-2 z-10`}>¡Reserva Exitosa!</h4>
            <p className="text-gray-500 mb-6 max-w-xs text-sm z-10">Tu cita ha sido guardada. Recibirás confirmación por correo.</p>
            <button onClick={onClose} className="underline text-xs tracking-widest text-gray-400 hover:text-black z-10">Cerrar</button>
          </div>
        )}
      </div>
    </div>
  </motion.div>
  );
};

export default function BronzerFullPlatform() {
  const [showSplash, setShowSplash] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); 
  
  // --- ESTADOS: INICIALIZAMOS CON LOS DATOS DE DEMO ---
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);
  const [specialists, setSpecialists] = useState<any[]>(INITIAL_SPECIALISTS);
  const [services, setServices] = useState<any[]>(INITIAL_SERVICES);
  
  // --- NUEVO: ESTADO PARA MOSTRAR TIENDA COMPLETA ---
  const [showFullShop, setShowFullShop] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);
  const addToCart = (product: any) => { setCart([...cart, product]); setCartOpen(true); };
  const removeFromCart = (index: number) => { const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); };

  const [bookingStep, setBookingStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<any>(null);
  const [clientData, setClientData] = useState({ name: "", phone: "", note: "" }); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // CARGA DE DATOS REALES (SI EXISTEN)
    const fetchData = async () => {
        try {
            const resProd = await fetch('/api/database?tab=Productos');
            const dataProd = await resProd.json();
            if(dataProd.success && dataProd.data.length > 0) setProducts(dataProd.data);

            const resSpec = await fetch('/api/database?tab=ESPECIALISTAS');
            const dataSpec = await resSpec.json();
            if(dataSpec.success && dataSpec.data.length > 0) setSpecialists(dataSpec.data);

            const resServ = await fetch('/api/database?tab=Servicios');
            const dataServ = await resServ.json();
            if(dataServ.success && dataServ.data.length > 0) setServices(dataServ.data);
        } catch (error) { console.error("Usando datos demo..."); }
    };
    fetchData();

    const handleScroll = () => { setIsScrolled(window.scrollY > 50); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const saveToDatabase = async (extraData?: any) => {
    setIsSubmitting(true);
    try {
      // Unimos los datos del cliente con los datos extras del pago (si existen)
      const payload = {
          name: clientData.name,
          phone: clientData.phone,
          note: clientData.note,
          service: selectedService?.name || selectedService?.title || "Servicio General",
          date: selectedDate, 
          time: selectedTime, 
          specialist: selectedSpecialist?.name,
          ...extraData // Aquí entran paymentMethod y paymentRef
      };

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Error server");
      const data = await response.json();
      if (data.success) setBookingStep(5); else alert("Error al agendar");
    } catch (error) { alert("Fallo conexión"); } 
    finally { setIsSubmitting(false); }
  };

  // ------------------------------------------------------------------
  // 1. IMPORTANTE: LA FUNCIÓN DE CHECKOUT DEBE ESTAR AQUÍ (ANTES DE USARSE)
  // ------------------------------------------------------------------
  const handleCheckout = async (orderData: any) => {
      // Aquí simulamos el guardado o lo envías a tu API
      console.log("PEDIDO RECIBIDO:", orderData);
      
      // Feedback al usuario
      alert(`¡Gracias ${orderData.clientInfo.name}! Tu pedido ha sido recibido. Te contactaremos pronto.`);
      
      // Limpiar y cerrar
      setCart([]); 
      setCartOpen(false);
  };

  // ------------------------------------------------------------------
  // 2. AHORA SÍ: MODO TIENDA COMPLETA (RESPONSIVE FIX)
  // ------------------------------------------------------------------
  if (showFullShop) {
      return (
        <div className={`bg-slate-50 min-h-screen text-[#1a1a1a] ${montserrat.className}`}>
            <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-6 h-16 md:h-20 flex justify-between items-center">
                    <button onClick={() => setShowFullShop(false)} className="flex items-center gap-2 text-xs md:text-sm hover:text-[#D4AF37] transition-colors uppercase tracking-widest">
                        <ArrowLeft size={16} /> Volver
                    </button>
                    <div className={`${cinzel.className} text-lg md:text-xl tracking-[0.15em] font-bold`}>BRONZER SHOP</div>
                    <div className="relative cursor-pointer hover:text-[#D4AF37] transition-colors" onClick={() => setCartOpen(true)}>
                        <ShoppingBag size={20} />
                        {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{cart.length}</span>}
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto px-6 pt-24 md:pt-32 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12 md:gap-8">
                    {products.map((prod) => {
                        const imgUrl = processGoogleImage(prod.img);
                        return (
                            <div key={prod.id} className="group relative">
                                <div className="relative h-[300px] md:h-[350px] w-full bg-[#F5F5F5] mb-4 overflow-hidden rounded-[1.5rem] border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-xl">
                                    {imgUrl && <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />}
                                    
                                    {/* BOTÓN SOLO ESCRITORIO (HOVER) */}
                                    <button onClick={() => addToCart(prod)} className={`
                                        hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] py-3 translate-y-24 group-hover:translate-y-0 text-xs uppercase tracking-widest 
                                        ${GLASS_DARK_STYLE} rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500
                                    `}>Añadir</button>
                                </div>
                                <h3 className="font-medium text-base">{prod.name}</h3>
                                <p className="text-[#D4AF37] text-sm font-serif italic mb-3">€{Number(prod.price).toFixed(2)}</p>
                                
                                {/* BOTÓN SOLO MÓVIL (DEBAJO DEL PRODUCTO) */}
                                <button onClick={() => addToCart(prod)} className={`
                                    md:hidden w-full py-3 text-xs uppercase tracking-widest 
                                    ${GLASS_DARK_STYLE} rounded-xl
                                `}>Añadir al Carrito</button>
                            </div>
                        )
                    })}
                </div>
            </main>
            {/* AQUÍ AGREGAMOS LA PROPIEDAD onCheckout */}
            {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} cart={cart} removeFromCart={removeFromCart} total={cartTotal} onCheckout={handleCheckout} />}
        </div>
      );
  }
  
  // --- MODO LANDING PAGE (RESPONSIVE FIX) ---
  return (
    <div className={`bg-slate-50 min-h-screen text-[#1a1a1a] ${montserrat.className} selection:bg-[#D4AF37] selection:text-white ${showSplash ? 'overflow-hidden h-screen' : ''}`}>
      
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      
      <header className={`fixed top-0 w-full z-50 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] border-b ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-gray-100 h-20 shadow-sm' : 'bg-transparent border-transparent h-14 md:h-20'}`}>
        {/* Aumentamos px-6 a px-8 en móvil y px-12 en escritorio para más espacio */}
<div className="container mx-auto px-50 md:px-12 h-full flex items-center justify-between relative">
          
          {/* 1. LOGO: ANIMACIÓN DE IZQUIERDA A CENTRO */}
          <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] z-20 ${isScrolled ? 'left-1/2 -translate-x-1/2' : 'left-8 md:left-12'}`}>
             <div className={`${cinzel.className} text-xl md:text-2xl tracking-[0.15em] font-semibold flex items-center gap-2 text-[#1a1a1a]`}>
               BRONZER 
               <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-1 shadow-sm"></div>
             </div>
          </div>

          {/* 2. MENÚ: SE OCULTA AL BAJAR */}
          <nav className={`hidden md:flex mx-auto gap-8 text-xs tracking-[0.2em] uppercase font-medium text-gray-500 transition-all duration-500 delay-100 ${isScrolled ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
            {['Experiencia', 'Servicios', 'Boutique', 'Contacto'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-black transition-colors">{item}</a>
            ))}
          </nav>

          {/* 3. ICONOS Y BOTÓN: SIEMPRE A LA DERECHA (Fixed) */}
          <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 flex items-center gap-4 md:gap-6 z-20">
            <div className="relative cursor-pointer hover:text-[#D4AF37] transition-colors" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{cart.length}</span>}
            </div>
            
            {/* TU BOTÓN CON LA LÓGICA DE LIMPIAR SERVICIO */}
            <button 
                onClick={() => { setSelectedService(null); setBookingStep(1); setBookingOpen(true); }} 
                className={`hidden md:block px-8 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${GLASS_STYLE} ${isScrolled ? 'bg-black text-Black border-transparent hover:bg-gray-800' : ''}`}
            >
                Agendar
            </button>
          </div>
          
        </div>
      </header>

      <section className="relative min-h-screen pt-8 md:pt-21 flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-24 py-12 md:py-0 relative overflow-hidden order-2 md:order-1">
           <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-gray-100 -z-10"></div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 3.8 }} className="relative z-10">
            <span className="text-[#D4AF37] text-xs tracking-[0.4em] uppercase font-bold mb-4 block">Medical Aesthetic</span>
            <h1 className={`${cinzel.className} text-4xl md:text-5xl lg:text-7xl leading-[1.1] mb-6 text-black drop-shadow-sm`}>Centro <br/> Estético y <span className="italic text-gray-400 font-serif">Spa.</span></h1>
            <p className="text-gray-600 font-light leading-relaxed max-w-md mb-8 md:mb-10 text-sm md:text-base">Elevamos el estándar de la belleza. Tecnología de vanguardia en un ambiente de calma absoluta.</p>
            {/* AQUÍ TAMBIÉN: Limpiamos el servicio seleccionado para el botón del Hero */}
            <button 
                onClick={() => { setSelectedService(null); setBookingStep(1); setBookingOpen(true); }} 
                className={`flex w-fit items-center gap-4 px-6 md:px-8 py-3 md:py-4 text-xs uppercase tracking-widest ${GLASS_STYLE}`}
            >
                Reservar Cita <ArrowRight size={14} />
            </button>
          </motion.div>
        </div>
        <div className="w-full md:w-1/2 h-[40vh] md:h-auto relative order-1 md:order-2">
          <Image src="/PORTADA.SVG.jpg" alt="Skin Care Luxury" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent mix-blend-overlay"></div>
        </div>
      </section>

      <section id="experiencia" className="py-16 md:py-24 px-6 md:px-24 bg-white relative">
        <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16 relative z-10">
          <Star className="w-6 h-6 text-[#D4AF37] mx-auto mb-6 drop-shadow-sm" fill="#D4AF37" />
          <h2 className={`${cinzel.className} text-2xl md:text-3xl lg:text-4xl mb-6`}>The Bronzer Standard</h2>
          <p className="text-gray-600 font-light leading-7 md:leading-8 text-sm md:text-base">"No creemos en la transformación forzada, sino en la revelación de tu mejor versión. Utilizamos protocolos suizos y aparatología alemana para garantizar resultados visibles."</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-t border-b border-gray-100 py-12 relative z-10">
          {[{ n: "5+", l: "Años de Experiencia" }, { n: "2k+", l: "Pacientes Felices" }, { n: "100%", l: "Tecnología Certificada" }, { n: "Top", l: "Especialistas" }].map((stat, i) => (
            <div key={i}><h3 className={`${cinzel.className} text-2xl md:text-3xl lg:text-4xl mb-2`}>{stat.n}</h3><p className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400">{stat.l}</p></div>
          ))}
        </div>
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0 pointer-events-none"></div>
      </section>

      <section id="servicios" className="py-16 md:py-24 bg-gray-50/50 relative">
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4 relative z-10">
            <h2 className={`${cinzel.className} text-2xl md:text-4xl drop-shadow-sm`}>Menú de Tratamientos</h2>
            <button 
                onClick={() => { /* Aquí podrías ir a una página de servicios completa */ }}
                className={`hidden md:flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}
            >
                Ver Todo <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {services.map((item) => {
              const imgUrl = processGoogleImage(item.img);
              return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="bg-white/80 backdrop-blur-md p-4 rounded-3xl group cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.1)] transition-all duration-500 border border-white">
                <div className="relative h-48 md:h-64 mb-6 overflow-hidden bg-gray-100 rounded-2xl">
                   {imgUrl && <img src={imgUrl} alt={item.name || item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold font-serif italic rounded-full shadow-sm border border-white/50">€{item.price}</div>
                </div>
                <h3 className={`${cinzel.className} text-lg mb-2 pl-2`}>{item.name || item.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 pl-2"><Clock size={12} /> {item.duration || item.time}</div>
                <button onClick={() => { setSelectedService(item); setBookingStep(1); setBookingOpen(true); }} className={`w-full py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}>Reservar</button>
              </motion.div>
            )})}
          </div>
          {/* BOTÓN MÓVIL AL FINAL (SOLO VISIBLE EN MÓVIL) */}
          <div className="flex md:hidden justify-center mt-8">
            <button className={`flex items-center gap-2 px-8 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}>Ver Todo <ArrowRight size={14} /></button>
          </div>
        </div>
      </section>

      <section id="boutique" className="py-16 md:py-24 px-6 md:px-24 bg-white relative overflow-hidden">
        {/* HEADER: Título a la izquierda, Botón a la derecha (estilo solicitado) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 relative z-10">
            <h2 className={`${cinzel.className} text-2xl md:text-4xl drop-shadow-sm`}>Bronzer Boutique</h2>
            <button 
                onClick={() => { setShowFullShop(true); window.scrollTo(0,0); }}
                className={`hidden md:flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}
            >
                Ver Todo <ArrowRight size={14} />
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-12 relative z-10">
          {/* MOSTRAMOS SOLO LOS PRIMEROS 3 PRODUCTOS */}
          {products.slice(0, 3).map((prod) => {
            const imgUrl = processGoogleImage(prod.img);
            return (
            <div key={prod.id} className="text-center group relative mb-8 md:mb-0">
              <div className="relative h-[260px] md:h-[420px] w-full bg-[#F5F5F5] mb-4 md:mb-6 overflow-hidden rounded-[2rem] border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-xl">
                {imgUrl && <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* BOTÓN SOLO ESCRITORIO (HOVER) */}
                <button onClick={() => addToCart(prod)} className={`
                    hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] py-4 translate-y-24 group-hover:translate-y-0 text-xs uppercase tracking-widest ${GLASS_DARK_STYLE} rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500
                `}>Añadir al Carrito</button>
              </div>
              <h3 className="font-medium text-lg">{prod.name}</h3>
              <p className="text-[#D4AF37] mt-1 font-serif italic font-semibold mb-3">€{prod.price}</p>
              
              {/* BOTÓN SOLO MÓVIL (DEBAJO DEL PRODUCTO) */}
              <button onClick={() => addToCart(prod)} className={`
                    md:hidden w-full py-3 text-xs uppercase tracking-widest ${GLASS_DARK_STYLE} rounded-xl
              `}>Añadir al Carrito</button>
            </div>
          )})}
        </div>

        {/* BOTÓN MÓVIL AL FINAL */}
        <div className="flex md:hidden justify-center mt-12 relative z-10">
            <button 
                onClick={() => { setShowFullShop(true); window.scrollTo(0,0); }}
                className={`flex items-center gap-2 px-8 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}
            >
                Ver Todo <ArrowRight size={14} />
            </button>
        </div>

         <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-gray-50 to-transparent -z-10"></div>
      </section>

      <section className="relative h-[50vh] md:h-[80vh] w-full">
        <Image src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop" alt="Spa Interior" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-center">
          <div className="bg-white/70 backdrop-blur-lg p-8 md:p-12 max-w-sm md:max-w-xl rounded-3xl border border-white/40 shadow-2xl mx-4">
            <h3 className={`${cinzel.className} text-2xl md:text-3xl mb-4 text-[#1a1a1a]`}>Visítanos</h3>
            <p className="text-gray-700 mb-8 font-light leading-relaxed text-sm md:text-base">Un oasis urbano diseñado para desconectar. <br/>Valet Parking disponible.</p>
             <button className={`px-8 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}>Ver Ubicación</button>
          </div>
        </div>
      </section>

      <footer id="contacto" className="bg-[#111] text-white pt-16 md:pt-24 pb-12 relative overflow-hidden">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-16 relative z-10">
             <div><h2 className={`${cinzel.className} text-2xl md:text-3xl mb-6 flex items-center gap-2`}>BRONZER <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-2"></div></h2><p className="text-gray-400 text-sm font-light leading-7 max-w-xs">Centro estético de alto rendimiento. Fusionamos protocolos médicos con experiencias sensoriales de lujo.</p></div>
             <div><h4 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-6 font-semibold">Contacto</h4><ul className="space-y-4 text-sm text-gray-400 font-light"><li className="flex items-center gap-3"><Phone size={16} className="text-[#D4AF37]"/> +58 412 000 0000</li><li className="flex items-center gap-3"><Mail size={16} className="text-[#D4AF37]"/> citas@bronzer.com</li></ul></div>
             <div><h4 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-6 font-semibold">Horarios</h4><ul className="space-y-2 text-sm text-gray-400 font-light"><li className="flex justify-between border-b border-white/10 pb-2"><span>Lunes - Viernes</span> <span>9:00 - 19:00</span></li><li className="flex justify-between border-b border-white/10 pb-2"><span>Sábados</span> <span>10:00 - 16:00</span></li><li className="flex justify-between pb-2"><span className="text-gray-500">Domingos</span> <span className="text-gray-500">Cerrado</span></li></ul></div>
        </div>
        <div className="container mx-auto px-6 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-gray-500 relative z-10">
            <p>© 2025 BRONZER AESTHETIC. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
                {/* --- CAMBIO AQUÍ: ENLACE A INSTAGRAM --- */}
                <a href="https://www.instagram.com/bronzerdeluxe/" target="_blank" rel="noopener noreferrer">
                    <Instagram className="cursor-pointer hover:text-[#D4AF37] transition-colors" size={18} />
                </a>
                {/* --------------------------------------- */}
                <Mail className="cursor-pointer hover:text-[#D4AF37] transition-colors" size={18} />
            </div>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-1/2 bg-gradient-to-t from-[#D4AF37]/10 to-transparent blur-3xl -z-0 pointer-events-none"></div>
      </footer>

      <AnimatePresence>
        {bookingOpen && <BookingModal key="modal" isOpen={bookingOpen} onClose={() => setBookingOpen(false)} step={bookingStep} setStep={setBookingStep} selectedSpecialist={selectedSpecialist} setSelectedSpecialist={setSelectedSpecialist} selectedService={selectedService} setSelectedService={setSelectedService} selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} clientData={clientData} setClientData={setClientData} isSubmitting={isSubmitting} saveToDatabase={saveToDatabase} specialistsList={specialists} />}
        {cartOpen && <CartDrawer key="drawer" isOpen={cartOpen} onClose={() => setCartOpen(false)} cart={cart} removeFromCart={removeFromCart} total={cartTotal} />}
      </AnimatePresence>
    </div>
  );
}
