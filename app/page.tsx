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
      <motion.div className="relative z-10 flex flex-col items-center">
        <motion.h1 variants={textVariants} initial="hidden" animate="visible" className={`${cinzel.className} text-5xl md:text-7xl tracking-[0.2em] font-bold text-[#1a1a1a] flex items-end gap-3 drop-shadow-sm`}>
          BRONZER
          <motion.div variants={dotVariants} initial="hidden" animate="visible" className="w-4 h-4 md:w-5 md:h-5 bg-[#D4AF37] rounded-full mb-2 md:mb-3 shadow-[0_0_20px_rgba(212,175,55,0.6)] relative">
             <div className="absolute inset-0 bg-white/40 rounded-full animate-ping-slow opacity-50"></div>
          </motion.div>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.8 }} className={`${montserrat.className} text-[#D4AF37] text-xs md:text-sm tracking-[0.4em] uppercase mt-6 font-medium`}>
          Medical Aesthetic
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

// --- COMPONENTE CARRITO ---
const CartDrawer = ({ onClose, cart, removeFromCart, total }: any) => (
  <>
    <div onClick={onClose} className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"></div>
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed top-0 right-0 z-[70] h-screen w-full md:w-[400px] bg-white/90 backdrop-blur-xl shadow-2xl p-8 flex flex-col border-l border-white/50">
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
        <h3 className={`${cinzel.className} text-xl`}>Tu Bolsa ({cart.length})</h3>
        <button onClick={onClose} className="hover:text-[#D4AF37]"><X size={24} /></button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar">
        {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <ShoppingBag size={48} strokeWidth={1} className="mb-4"/><p>Tu bolsa está vacía.</p></div>
        ) : (
          cart.map((item:any, idx:number) => {
            const imgUrl = processGoogleImage(item.img);
            return (
                <div key={idx} className="flex gap-4 animate-in fade-in slide-in-from-right-4 bg-white/50 p-3 rounded-2xl border border-white/50 shadow-sm">
                <div className="w-16 h-16 bg-gray-100 relative overflow-hidden shrink-0 rounded-xl border border-white">
                    {imgUrl ? <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1"><h4 className="font-medium text-sm">{item.name}</h4><p className="text-xs text-[#D4AF37] mt-1">${item.price}.00</p></div>
                <button onClick={() => removeFromCart(idx)} className="text-gray-300 hover:text-red-400 h-fit"><Trash2 size={16} /></button>
                </div>
            )
          })
        )}
      </div>
      <div className="border-t border-gray-100 pt-6 mt-6">
        <div className="flex justify-between mb-6 text-lg font-medium"><span>Total</span><span>${total}.00</span></div>
        <button className={`w-full py-4 text-xs uppercase tracking-[0.2em] ${GLASS_DARK_STYLE}`}>Ir a Pagar</button>
      </div>
    </motion.div>
  </>
);

// --- COMPONENTE MODAL RESERVA ---
const BookingModal = ({ 
  onClose, step, setStep, 
  selectedSpecialist, setSelectedSpecialist, 
  selectedService, setSelectedService, 
  selectedDate, setSelectedDate,
  selectedTime, setSelectedTime,
  clientData, setClientData,
  isSubmitting, saveToDatabase, specialistsList
}: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white/95 backdrop-blur-xl w-full max-w-4xl h-[600px] shadow-2xl overflow-hidden flex rounded-3xl relative border border-white/50">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black z-20"><X size={24} /></button>
      
      <div className="w-1/3 bg-gray-50/50 p-8 hidden md:flex flex-col justify-between border-r border-gray-100">
        <div>
          <h3 className={`${cinzel.className} text-2xl mb-6`}>Tu Cita</h3>
          <div className="space-y-6">
             <div className={`flex items-center gap-3 ${step >= 1 ? 'text-black' : 'text-gray-400'}`}><div className="w-8 h-8 rounded-full border border-current flex items-center justify-center text-xs shadow-sm bg-white">1</div><span className="text-xs uppercase tracking-widest">Especialista</span></div>
             <div className={`flex items-center gap-3 ${step >= 2 ? 'text-black' : 'text-gray-400'}`}><div className="w-8 h-8 rounded-full border border-current flex items-center justify-center text-xs shadow-sm bg-white">2</div><span className="text-xs uppercase tracking-widest">Fecha & Hora</span></div>
             <div className={`flex items-center gap-3 ${step >= 3 ? 'text-black' : 'text-gray-400'}`}><div className="w-8 h-8 rounded-full border border-current flex items-center justify-center text-xs shadow-sm bg-white">3</div><span className="text-xs uppercase tracking-widest">Tus Datos</span></div>
             <div className={`flex items-center gap-3 ${step >= 4 ? 'text-black' : 'text-gray-400'}`}><div className="w-8 h-8 rounded-full border border-current flex items-center justify-center text-xs shadow-sm bg-white">4</div><span className="text-xs uppercase tracking-widest">Confirmar</span></div>
          </div>
        </div>
        {selectedSpecialist && (
          <div className="bg-white/80 p-4 border border-gray-100 shadow-sm rounded-2xl backdrop-blur-md">
            <p className="text-[10px] uppercase text-gray-400">Especialista</p>
            <p className="font-medium">{selectedSpecialist.name}</p>
          </div>
        )}
      </div>

      <div className="w-full md:w-2/3 p-8 overflow-y-auto relative">
        
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className={`${cinzel.className} text-2xl mb-2`}>Selecciona tu Experto</h2>
            <p className="text-gray-400 text-sm mb-6">Elige al profesional para tu tratamiento.</p>
            <div className="grid grid-cols-1 gap-4">
              {specialistsList.map((spec: any) => {
                const imgUrl = processGoogleImage(spec.img);
                return (
                <div key={spec.id} onClick={() => { setSelectedSpecialist(spec); setStep(2); }} className="flex items-center gap-4 p-3 border border-gray-100 rounded-2xl hover:border-[#D4AF37]/50 hover:bg-white hover:shadow-md cursor-pointer transition-all group bg-white/50">
                  <div className="w-14 h-14 rounded-full overflow-hidden relative grayscale group-hover:grayscale-0 transition-all border-2 border-white shadow-sm">
                    {imgUrl ? <img src={imgUrl} alt={spec.name} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div><h4 className="font-medium">{spec.name}</h4><p className="text-xs text-[#D4AF37] uppercase">{spec.role}</p></div>
                  <ArrowRight className="ml-auto text-gray-300 group-hover:text-[#D4AF37]" size={18} />
                </div>
              )})}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setStep(1)} className="text-xs text-gray-400 underline mb-4">Volver</button>
            <h2 className={`${cinzel.className} text-2xl mb-6`}>Disponibilidad</h2>
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
            <h2 className={`${cinzel.className} text-2xl mb-2`}>Tus Datos</h2>
            <p className="text-gray-400 text-sm mb-8">Necesitamos esta información para confirmar tu cita.</p>
            <div className="space-y-6 max-w-sm">
              <div><label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Nombre Completo</label><input type="text" value={clientData.name} onChange={(e) => setClientData({...clientData, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#D4AF37] focus:ring-0 outline-none transition-colors" placeholder="Ej: María Pérez" autoFocus /></div>
              <div><label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Teléfono</label><input type="tel" value={clientData.phone} onChange={(e) => setClientData({...clientData, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#D4AF37] focus:ring-0 outline-none transition-colors" placeholder="+58 412 000 0000" /></div>
              <div><label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Nota (Opcional)</label><textarea value={clientData.note} onChange={(e) => setClientData({...clientData, note: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#D4AF37] focus:ring-0 outline-none transition-colors resize-none h-24" placeholder="Alergias, preferencias, etc..." /></div>
              <button onClick={() => { if(clientData.name && clientData.phone) setStep(4); else alert("Por favor completa nombre y teléfono"); }} className={`w-full py-3 px-8 text-xs tracking-widest uppercase ${GLASS_DARK_STYLE}`}>Continuar</button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <button onClick={() => setStep(3)} className="absolute top-8 left-8 text-xs text-gray-400 underline">Volver</button>
            <h2 className={`${cinzel.className} text-2xl mb-6`}>Resumen de Cita</h2>
            <div className="bg-white/60 p-6 w-full max-w-sm mb-6 border border-gray-100 rounded-2xl text-left shadow-inner backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-4">
                 <div className="w-10 h-10 rounded-full overflow-hidden relative border-2 border-white shadow-sm">
                    {selectedSpecialist.img && <img src={processGoogleImage(selectedSpecialist.img) || ''} alt="Spec" className="w-full h-full object-cover" />}
                 </div>
                 <div><p className="font-bold text-sm">{selectedSpecialist.name}</p><p className="text-xs text-gray-500">{selectedSpecialist.role}</p></div>
              </div>
              <p className="text-sm mb-2"><span className="text-gray-400">Cliente:</span> {clientData.name}</p>
              <p className="text-sm mb-2"><span className="text-gray-400">Servicio:</span> {selectedService ? selectedService.title : 'Consulta General'}</p>
              <p className="text-sm mb-2"><span className="text-gray-400">Fecha:</span> {selectedDate}</p>
              <p className="text-sm"><span className="text-gray-400">Hora:</span> {selectedTime}</p>
            </div>
            <button onClick={saveToDatabase} disabled={isSubmitting} className={`w-full max-w-sm py-3 px-8 text-xs tracking-widest uppercase flex justify-center gap-2 ${GLASS_DARK_STYLE} disabled:opacity-50`}>{isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}</button>
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
            <h4 className={`${cinzel.className} text-2xl mb-2 z-10`}>¡Reserva Exitosa!</h4>
            <p className="text-gray-500 mb-6 max-w-xs text-sm z-10">Tu cita ha sido guardada. Recibirás confirmación por correo.</p>
            <button onClick={onClose} className="underline text-xs tracking-widest text-gray-400 hover:text-black z-10">Cerrar</button>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

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

  const saveToDatabase = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientData.name,
          phone: clientData.phone,
          note: clientData.note,
          service: selectedService?.name || selectedService?.title || "Servicio General",
          date: selectedDate, time: selectedTime, specialist: selectedSpecialist?.name,
        }),
      });
      if (!response.ok) throw new Error("Error server");
      const data = await response.json();
      if (data.success) setBookingStep(5); else alert("Error al agendar");
    } catch (error) { alert("Fallo conexión"); } 
    finally { setIsSubmitting(false); }
  };

  // --- SI ESTAMOS EN MODO TIENDA COMPLETA ---
  if (showFullShop) {
      return (
        <div className={`bg-slate-50 min-h-screen text-[#1a1a1a] ${montserrat.className}`}>
            <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-6 h-20 flex justify-between items-center">
                    <button onClick={() => setShowFullShop(false)} className="flex items-center gap-2 text-sm hover:text-[#D4AF37] transition-colors uppercase tracking-widest">
                        <ArrowLeft size={18} /> Volver
                    </button>
                    <div className={`${cinzel.className} text-xl tracking-[0.15em] font-bold`}>BRONZER SHOP</div>
                    <div className="relative cursor-pointer hover:text-[#D4AF37] transition-colors" onClick={() => setCartOpen(true)}>
                        <ShoppingBag size={20} />
                        {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{cart.length}</span>}
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto px-6 pt-32 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {products.map((prod) => {
                        const imgUrl = processGoogleImage(prod.img);
                        return (
                            <div key={prod.id} className="group relative">
                                <div className="relative h-[350px] w-full bg-[#F5F5F5] mb-4 overflow-hidden rounded-[1.5rem] border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-xl">
                                    {imgUrl && <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />}
                                    <button onClick={() => addToCart(prod)} className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] py-3 translate-y-24 group-hover:translate-y-0 text-xs uppercase tracking-widest ${GLASS_DARK_STYLE}`}>Añadir</button>
                                </div>
                                <h3 className="font-medium text-base">{prod.name}</h3>
                                <p className="text-[#D4AF37] text-sm font-serif italic">${prod.price}</p>
                            </div>
                        )
                    })}
                </div>
            </main>
            {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} cart={cart} removeFromCart={removeFromCart} total={cartTotal} />}
        </div>
      );
  }

  // --- MODO LANDING PAGE (NORMAL) ---
  return (
    <div className={`bg-slate-50 min-h-screen text-[#1a1a1a] ${montserrat.className} selection:bg-[#D4AF37] selection:text-white ${showSplash ? 'overflow-hidden h-screen' : ''}`}>
      
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-6 h-20 grid grid-cols-3 items-center relative">
          <div className="justify-self-start">
             <div className={`${cinzel.className} text-2xl tracking-[0.15em] font-semibold flex items-center gap-2 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] z-50 ${isScrolled ? 'fixed left-1/2 -translate-x-1/2 top-6' : 'relative'}`}>
               BRONZER <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-1 shadow-sm"></div>
             </div>
          </div>
          <nav className={`hidden md:flex gap-8 text-xs tracking-[0.2em] uppercase font-medium text-gray-500 justify-self-center transition-all duration-500 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {['Experiencia', 'Servicios', 'Boutique', 'Contacto'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-black transition-colors">{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-6 justify-self-end z-50 bg-transparent">
            <div className="relative cursor-pointer hover:text-[#D4AF37] transition-colors" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={20} />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{cart.length}</span>}
            </div>
            <button onClick={() => { setBookingStep(1); setBookingOpen(true); }} className={`hidden md:block px-8 py-3 text-xs tracking-[0.2em] uppercase ${GLASS_DARK_STYLE}`}>Agendar</button>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen pt-8 md:pt-24 flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-24 py-20 md:py-0 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-gray-100 -z-10"></div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 3.8 }} className="relative z-10">
            <span className="text-[#D4AF37] text-xs tracking-[0.4em] uppercase font-bold mb-4 block">Medical Aesthetic</span>
            <h1 className={`${cinzel.className} text-5xl md:text-7xl leading-[1.1] mb-6 text-black drop-shadow-sm`}>Centro <br/> Estético y <span className="italic text-gray-400 font-serif">Spa.</span></h1>
            <p className="text-gray-600 font-light leading-relaxed max-w-md mb-10">Elevamos el estándar de la belleza. Tecnología de vanguardia en un ambiente de calma absoluta.</p>
            <button onClick={() => { setBookingStep(1); setBookingOpen(true); }} className={`flex w-fit items-center gap-4 px-8 py-4 text-xs uppercase tracking-widest ${GLASS_STYLE}`}>Reservar Cita <ArrowRight size={14} /></button>
          </motion.div>
        </div>
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative">
          <Image src="/PORTADA.SVG.jpg" alt="Skin Care Luxury" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent mix-blend-overlay"></div>
        </div>
      </section>

      <section id="experiencia" className="py-24 px-6 md:px-24 bg-white relative">
        <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
          <Star className="w-6 h-6 text-[#D4AF37] mx-auto mb-6 drop-shadow-sm" fill="#D4AF37" />
          <h2 className={`${cinzel.className} text-3xl md:text-4xl mb-6`}>The Bronzer Standard</h2>
          <p className="text-gray-600 font-light leading-8">"No creemos en la transformación forzada, sino en la revelación de tu mejor versión. Utilizamos protocolos suizos y aparatología alemana para garantizar resultados visibles."</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-t border-b border-gray-100 py-12 relative z-10">
          {[{ n: "5+", l: "Años de Experiencia" }, { n: "2k+", l: "Pacientes Felices" }, { n: "100%", l: "Tecnología Certificada" }, { n: "Top", l: "Especialistas" }].map((stat, i) => (
            <div key={i}><h3 className={`${cinzel.className} text-3xl md:text-4xl mb-2`}>{stat.n}</h3><p className="text-[10px] uppercase tracking-widest text-gray-400">{stat.l}</p></div>
          ))}
        </div>
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0 pointer-events-none"></div>
      </section>

      <section id="servicios" className="py-24 bg-gray-50/50 relative">
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="flex justify-between items-end mb-12">
            <h2 className={`${cinzel.className} text-4xl drop-shadow-sm`}>Menú de Tratamientos</h2>
            <button className={`hidden md:block px-6 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}>Ver Todo</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((item) => {
              const imgUrl = processGoogleImage(item.img);
              return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="bg-white/80 backdrop-blur-md p-4 rounded-3xl group cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.1)] transition-all duration-500 border border-white">
                <div className="relative h-64 mb-6 overflow-hidden bg-gray-100 rounded-2xl">
                   {imgUrl && <img src={imgUrl} alt={item.name || item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold font-serif italic rounded-full shadow-sm border border-white/50">${item.price}</div>
                </div>
                <h3 className={`${cinzel.className} text-lg mb-2 pl-2`}>{item.name || item.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 pl-2"><Clock size={12} /> {item.duration || item.time}</div>
                <button onClick={() => { setSelectedService(item); setBookingStep(1); setBookingOpen(true); }} className={`w-full py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}>Reservar</button>
              </motion.div>
            )})}
          </div>
        </div>
      </section>

      <section id="boutique" className="py-24 px-6 md:px-24 bg-white relative overflow-hidden">
        <div className="container mx-auto relative z-10">
          
          {/* HEADER: Título a la izquierda, Botón a la derecha */}
          <div className="flex justify-between items-end mb-16">
            <h2 className={`${cinzel.className} text-4xl drop-shadow-sm`}>Bronzer Boutique</h2>
            <button 
                onClick={() => { setShowFullShop(true); window.scrollTo(0,0); }}
                className={`hidden md:flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}
            >
                Ver Todo <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* MOSTRAMOS SOLO LOS PRIMEROS 3 PRODUCTOS */}
            {products.slice(0, 3).map((prod) => {
              const imgUrl = processGoogleImage(prod.img);
              return (
              <div key={prod.id} className="text-center group relative">
                <div className="relative h-[420px] w-full bg-[#F5F5F5] mb-6 overflow-hidden rounded-[2rem] border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-xl">
                  {imgUrl && <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <button onClick={() => addToCart(prod)} className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] py-4 translate-y-24 group-hover:translate-y-0 text-xs uppercase tracking-widest ${GLASS_DARK_STYLE}`}>Añadir al Carrito</button>
                </div>
                <h3 className="font-medium text-lg">{prod.name}</h3>
                <p className="text-[#D4AF37] mt-1 font-serif italic font-semibold">${prod.price}</p>
              </div>
            )})}
          </div>
        </div>
         <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-gray-50 to-transparent -z-10"></div>
      </section>

      <section className="relative h-[60vh] md:h-[80vh] w-full">
        <Image src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop" alt="Spa Interior" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-center">
          <div className="bg-white/70 backdrop-blur-lg p-12 max-w-xl rounded-3xl border border-white/40 shadow-2xl">
            <h3 className={`${cinzel.className} text-3xl mb-4 text-[#1a1a1a]`}>Visítanos</h3>
            <p className="text-gray-700 mb-8 font-light leading-relaxed">Un oasis urbano diseñado para desconectar. <br/>Valet Parking disponible.</p>
             <button className={`px-8 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}>Ver Ubicación</button>
          </div>
        </div>
      </section>

      <footer id="contacto" className="bg-[#111] text-white pt-24 pb-12 relative overflow-hidden">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 mb-16 relative z-10">
             <div><h2 className={`${cinzel.className} text-3xl mb-6 flex items-center gap-2`}>BRONZER <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full mt-2"></div></h2><p className="text-gray-400 text-sm font-light leading-7 max-w-xs">Centro estético de alto rendimiento. Fusionamos protocolos médicos con experiencias sensoriales de lujo.</p></div>
             <div><h4 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-6 font-semibold">Contacto</h4><ul className="space-y-4 text-sm text-gray-400 font-light"><li className="flex items-center gap-3"><MapPin size={16} className="text-[#D4AF37]"/> C.C. High Fashion, Piso 5, Caracas</li><li className="flex items-center gap-3"><Phone size={16} className="text-[#D4AF37]"/> +58 412 000 0000</li><li className="flex items-center gap-3"><Mail size={16} className="text-[#D4AF37]"/> citas@bronzer.com</li></ul></div>
             <div><h4 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-6 font-semibold">Horarios</h4><ul className="space-y-2 text-sm text-gray-400 font-light"><li className="flex justify-between border-b border-white/10 pb-2"><span>Lunes - Viernes</span> <span>9:00 - 19:00</span></li><li className="flex justify-between border-b border-white/10 pb-2"><span>Sábados</span> <span>10:00 - 16:00</span></li><li className="flex justify-between pb-2"><span className="text-gray-500">Domingos</span> <span className="text-gray-500">Cerrado</span></li></ul></div>
        </div>
        <div className="container mx-auto px-6 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-gray-500 relative z-10"><p>© 2025 BRONZER AESTHETIC. ALL RIGHTS RESERVED.</p><div className="flex gap-6 mt-4 md:mt-0"><Instagram className="cursor-pointer hover:text-[#D4AF37] transition-colors" size={18} /><Mail className="cursor-pointer hover:text-[#D4AF37] transition-colors" size={18} /></div></div><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-1/2 bg-gradient-to-t from-[#D4AF37]/10 to-transparent blur-3xl -z-0 pointer-events-none"></div>
      </footer>

      <AnimatePresence>
        {bookingOpen && <BookingModal key="modal" isOpen={bookingOpen} onClose={() => setBookingOpen(false)} step={bookingStep} setStep={setBookingStep} selectedSpecialist={selectedSpecialist} setSelectedSpecialist={setSelectedSpecialist} selectedService={selectedService} setSelectedService={setSelectedService} selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} clientData={clientData} setClientData={setClientData} isSubmitting={isSubmitting} saveToDatabase={saveToDatabase} specialistsList={specialists} />}
        {cartOpen && <CartDrawer key="drawer" isOpen={cartOpen} onClose={() => setCartOpen(false)} cart={cart} removeFromCart={removeFromCart} total={cartTotal} />}
      </AnimatePresence>
    </div>
  );
}
