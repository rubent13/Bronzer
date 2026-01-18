"use client";

import React, { useState, useEffect, useRef } from 'react';
// import Image from 'next/image'; // DESACTIVADO: Usamos <img> estándar para evitar errores
import { motion, AnimatePresence, Variants, useMotionValue, useTransform } from 'framer-motion';
import { 
  ArrowRight, Star, Clock, MapPin, 
  ShoppingBag, X, Check, Phone, Instagram, Mail,
  Trash2, User, Calendar as CalIcon, ArrowLeft 
} from 'lucide-react';
// import { Cinzel, Montserrat } from 'next/font/google'; // DESACTIVADO PARA EVITAR ERROR DE BUILD

// --- FUENTES SIMULADAS (Para evitar error de build) ---
// Usamos clases estándar de Tailwind que se verán bien en cualquier navegador
const cinzel = { className: 'font-serif' }; 
const montserrat = { className: 'font-sans' };

// --- ESTILOS ---
const GLASS_STYLE = "rounded-full bg-white/10 backdrop-blur-[24px] border-[0.5px] border-[#96765A]/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),_0_4px_10px_rgba(0,0,0,0.05)] text-[#191919] font-bold tracking-widest hover:scale-105 hover:bg-[#E9E0D5]/40 hover:border-[#96765A] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";
const GLASS_DARK_STYLE = "rounded-full bg-[#191919] backdrop-blur-[24px] border-[0.5px] border-[#96765A]/50 text-[#E9E0D5] font-bold tracking-widest hover:scale-105 hover:bg-[#2B2B2B] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

// --- Types ---
interface Product {
  id: number;
  name: string;
  price: number;
  img?: string | null;
  description?: string;
}

interface Service {
  id: number;
  name?: string;
  title?: string;
  price?: number;
  duration?: string;
  time?: string;
  img?: string | null;
  Imagen?: string | null;
  imagen?: string | null;
  Image?: string | null;
  specialists?: string | string[] | null;
}

interface Specialist {
  id: number;
  name: string;
  role?: string;
  img?: string | null;
  schedule?: string;
}

// --- DATOS INICIALES (DEMO) ---
const INITIAL_SERVICES = [
  { id: 1, name: "Maderoterapia Sculpt", price: 80, duration: "60 min", img: "https://images.unsplash.com/photo-1519699047748-40baea60f125?q=80&w=2070&auto=format&fit=crop" },
  { id: 2, name: "Gold Facial Radiance", price: 120, duration: "90 min", img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop" },
  { id: 3, name: "Deep Tissue Massage", price: 95, duration: "50 min", img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop" },
  { id: 4, name: "Laser Precision", price: 150, duration: "30 min", img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=2080&auto=format&fit=crop" },
];

const INITIAL_PRODUCTS = [
  { id: 1, name: "Bronzer Gold Oil", price: 45, img: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?q=80&w=2670&auto=format&fit=crop", description: "Aceite corporal iluminador con partículas de oro de 24k." },
  { id: 2, name: "Hydra Serum", price: 68, img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=2574&auto=format&fit=crop", description: "Suero de hidratación profunda con ácido hialurónico puro." },
  { id: 3, name: "Sculpting Cream", price: 55, img: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=2080&auto=format&fit=crop", description: "Crema reafirmante corporal para definir contornos." }, 
  { id: 4, name: "Exfoliante Corporal", price: 35, img: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?q=80&w=2670&auto=format&fit=crop", description: "Exfoliante suave con sales del Mar Muerto." }, 
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

// --- FUNCIÓN PARA PROCESAR IMÁGENES ---
const processGoogleImage = (url?: string | null): string | null => {
    if (!url || typeof url !== 'string') return null;
    let id: string | null = null;
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
        const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (matchD && matchD[1]) id = matchD[1];
        else { const matchId = url.match(/id=([a-zA-Z0-9_-]+)/); if (matchId && matchId[1]) id = matchId[1]; }
        if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=600`;
    }
    return url;
};

// --- COMPONENTE SPLASH SCREEN ---
const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [animationFinished, setAnimationFinished] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => { setAnimationFinished(true); onComplete(); }, 2500); 
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div exit={{ y: "-100vh", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }} className="fixed inset-0 z-[100] bg-[#FAF9F6] flex flex-col items-center justify-center overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-tr from-white via-[#E9E0D5]/30 to-[#96765A]/10 opacity-50 animate-pulse-slow"></div>
      <motion.div className="relative z-10 flex flex-col items-center p-4 text-center">
        <motion.h1 initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 1.2 }} className={`${cinzel.className} text-4xl md:text-5xl lg:text-7xl tracking-[0.2em] font-bold text-[#191919] flex items-end gap-2 md:gap-3 drop-shadow-sm`}>
          BRONZER
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: "spring" }} className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 bg-[#96765A] rounded-full mb-2 md:mb-3 shadow-[0_0_20px_rgba(150,118,90,0.6)] relative">
             <div className="absolute inset-0 bg-white/40 rounded-full animate-ping-slow opacity-50"></div>
          </motion.div>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.8 }} className={`${montserrat.className} text-[#96765A] text-[10px] md:text-xs lg:text-sm tracking-[0.4em] uppercase mt-4 md:mt-6 font-medium`}>
           DELUXE
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

// --- COMPONENTE CARRUSEL 3D (OPTIMIZADO Y SEGURO) ---
const Boutique3DCarousel = ({ products, addToCart, onViewAll }: { products: any[], addToCart: (p: any) => void, onViewAll: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-play seguro
  useEffect(() => {
    if (!products || products.length === 0) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex, products]);

  const nextSlide = () => {
    if (!products || products.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (!products || products.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  const slideVariants: Variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0, scale: 0.8 }),
    center: { zIndex: 1, x: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0, scale: 0.8, transition: { duration: 0.6 } })
  };

  // --- LÓGICA DE SEGUIMIENTO DE MOUSE 3D ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [15, -15]); 
  const rotateY = useTransform(x, [-100, 100], [-15, 15]); 
  
  function handleMouse(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = (mouseX / width - 0.5) * 200; 
    const yPct = (mouseY / height - 0.5) * 200;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() { x.set(0); y.set(0); }

  // --- VALIDACIÓN DE SEGURIDAD ---
  const currentProduct = products && products.length > 0 ? products[currentIndex] : null;

  if (!currentProduct) {
      return (
          <div className="w-full h-[50vh] flex items-center justify-center bg-[#E9E0D5]">
              <div className="text-[#96765A] animate-pulse uppercase tracking-widest text-xs font-bold">Cargando Boutique...</div>
          </div>
      );
  }

  const imgUrl = processGoogleImage(currentProduct.img);

  return (
    <div className="w-full h-auto md:min-h-[700px] relative flex flex-col items-center justify-center overflow-hidden py-12 md:py-0 bg-[#E9E0D5]">
      
      {/* Botón Ver Todo */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-40">
          <button onClick={onViewAll} className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 text-[10px] md:text-xs uppercase tracking-widest ${GLASS_STYLE} bg-white/40`}>
              Ver Todo <ArrowRight size={14} />
          </button>
      </div>

      {/* Fondo Dinámico */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center overflow-hidden">
          <motion.h1 
            key={currentProduct.id}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 0.1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className={`${cinzel.className} text-[18vw] md:text-[15vw] leading-none font-bold text-[#96765A] whitespace-nowrap uppercase`}
          >
            BRONZER
          </motion.h1>
        </div>
        <div className="absolute top-0 right-0 w-full md:w-3/4 h-full bg-gradient-to-b md:bg-gradient-to-l from-white/40 to-transparent"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 w-full flex flex-col items-center">
        
        {/* AREA DEL SLIDER */}
        <div className="w-full h-[500px] md:h-full flex items-center justify-center relative mb-8 md:mb-0">
            <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 absolute md:relative top-0 md:top-auto"
            >
                {/* INFO */}
                <div className="w-full md:w-1/2 text-left space-y-4 md:pl-12 order-2 md:order-1 relative z-20 mt-4 md:mt-0">
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <span className="inline-block py-1 px-3 border border-[#96765A] rounded-full text-[9px] md:text-[10px] uppercase tracking-widest text-[#96765A] mb-2 md:mb-4">Destacado</span>
                        <h2 className={`${cinzel.className} text-3xl md:text-6xl text-[#191919] leading-tight`}>{currentProduct.name}</h2>
                        <p className="text-[#6D6D6D] text-xs md:text-base max-w-md mt-2 md:mt-4 leading-relaxed font-light line-clamp-3 md:line-clamp-none">{currentProduct.description || "Lujo y pureza para tu piel."}</p>
                        <div className="flex items-center gap-4 md:gap-6 mt-6 md:mt-8">
                            <p className={`${cinzel.className} text-2xl md:text-3xl text-[#96765A]`}>€{Number(currentProduct.price).toFixed(2)}</p>
                            <button onClick={() => addToCart(currentProduct)} className={`px-6 py-3 md:px-8 md:py-4 bg-[#191919] text-[#E9E0D5] text-[10px] md:text-xs uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2`}>
                            Agregar <ShoppingBag size={16}/>
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* IMAGEN 3D */}
                <motion.div 
                className="w-full md:w-1/2 h-[300px] md:h-[600px] flex items-center justify-center perspective-1000 cursor-pointer order-1 md:order-2"
                onMouseMove={handleMouse}
                onMouseLeave={handleMouseLeave}
                whileHover={{ scale: 1.05 }}
                >
                    <motion.div style={{ rotateX, rotateY, x, y }} className="relative w-full max-w-[280px] md:max-w-md aspect-square">
                        <div className="absolute inset-0 bg-[#96765A]/20 rounded-full blur-3xl scale-75 transform translate-y-10 -z-10"></div>
                        {imgUrl && <img src={imgUrl} alt={currentProduct.name} className="w-full h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.3)] md:drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)]" />}
                    </motion.div>
                </motion.div>

            </motion.div>
            </AnimatePresence>
        </div>

        {/* CONTROLES */}
        <div className="relative md:absolute mt-8 md:mt-0 md:bottom-10 left-auto md:left-1/2 md:-translate-x-1/2 flex items-center gap-6 md:gap-8 z-30">
            <button onClick={prevSlide} className="p-3 rounded-full border border-[#191919]/20 hover:bg-[#191919] hover:text-[#E9E0D5] transition-colors"><ArrowLeft size={18}/></button>
            <div className="flex gap-2">
                {products.slice(0, 5).map((_, idx) => (
                    <div 
                    key={idx} 
                    onClick={() => { setDirection(idx > currentIndex ? 1 : -1); setCurrentIndex(idx); }}
                    className={`h-1 cursor-pointer transition-all duration-300 rounded-full ${idx === currentIndex ? 'w-8 bg-[#191919]' : 'w-2 bg-[#191919]/30'}`}
                    />
                ))}
            </div>
            <button onClick={nextSlide} className="p-3 rounded-full border border-[#191919]/20 hover:bg-[#191919] hover:text-[#E9E0D5] transition-colors"><ArrowRight size={18}/></button>
        </div>

      </div>
    </div>
  );
};

// --- COMPONENTE CARRITO ---
const CartDrawer: React.FC<{
  onClose: () => void;
  cart: Array<{ id?: number; name: string; price: number; img?: string | null }>;
  removeFromCart: (index: number) => void;
  total: number;
  onCheckout: (order: any) => Promise<void>; 
}> = ({ onClose, cart, removeFromCart, total, onCheckout }) => {
  const [view, setView] = useState('cart'); 
  const [paymentMethod, setPaymentMethod] = useState('pago_movil');
  const [paymentRef, setPaymentRef] = useState('');
  const [clientInfo, setClientInfo] = useState({ name: '', phone: '' });

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] bg-[#191919]/20 backdrop-blur-[2px]"></div>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed top-0 right-0 z-[70] h-screen w-full md:w-[450px] bg-[#E9E0D5]/95 backdrop-blur-xl shadow-2xl flex flex-col border-l border-white/50">
        
        <div className="flex justify-between items-center p-6 border-b border-[#96765A]/20">
          <h3 className={`${cinzel.className} text-xl flex items-center gap-2 text-[#191919]`}>
             {view === 'checkout' && <button onClick={() => setView('cart')} className="mr-2"><ArrowLeft size={18}/></button>}
             {view === 'cart' ? `Tu Bolsa (${cart.length})` : 'Finalizar Compra'}
          </h3>
          <button onClick={onClose} className="hover:text-[#96765A] p-2 text-[#191919]"><X size={24} /></button>
        </div>

        {view === 'cart' && (
            <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <ShoppingBag size={48} strokeWidth={1} className="mb-4"/><p>Tu bolsa está vacía.</p></div>
                    ) : (
                    cart.map((item, idx) => {
                        return (
                            <div key={idx} className="flex gap-3 bg-white/60 p-3 rounded-2xl border border-white/60 shadow-sm items-center">
                                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0">
                                    <img src={processGoogleImage(item.img) || ''} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate text-[#191919]">{item.name}</h4>
                                    <p className="text-xs text-[#96765A] font-bold mt-1">${Number(item.price).toFixed(2)}</p>
                                </div>
                                <button onClick={() => removeFromCart(idx)} className="text-gray-400 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                            </div>
                        )
                    })
                    )}
                </div>
                {cart.length > 0 && (
                    <div className="p-6 border-t border-[#96765A]/20 bg-[#E9E0D5]/50">
                        <div className="flex justify-between mb-6 text-lg font-medium font-serif text-[#191919]"><span>Total</span><span>${Number(total).toFixed(2)}</span></div>
                        <button onClick={() => setView('checkout')} className={`w-full py-4 text-xs uppercase tracking-[0.2em] ${GLASS_DARK_STYLE}`}>Ir a Pagar</button>
                    </div>
                )}
            </>
        )}

        {view === 'checkout' && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                <div className="space-y-4 mb-6">
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase">Nombre</label><input value={clientInfo.name} onChange={e=>setClientInfo({...clientInfo, name: e.target.value})} className="w-full p-3 bg-white/60 rounded-xl outline-none border border-transparent focus:border-[#191919] text-[#191919]"/></div>
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase">Teléfono</label><input value={clientInfo.phone} onChange={e=>setClientInfo({...clientInfo, phone: e.target.value})} className="w-full p-3 bg-white/60 rounded-xl outline-none border border-transparent focus:border-[#191919] text-[#191919]"/></div>
                </div>

                <h3 className="text-xs uppercase tracking-widest font-bold mb-3 text-gray-500">Método de Pago</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {['pago_movil', 'binance'].map(m => (
                        <button key={m} onClick={() => setPaymentMethod(m)} className={`py-3 text-[10px] uppercase font-bold border rounded-xl ${paymentMethod === m ? 'bg-[#191919] text-[#96765A] border-[#191919]' : 'bg-white border-gray-200 text-gray-400'}`}>{m.replace('_', ' ')}</button>
                    ))}
                </div>

                <div className="bg-white/60 p-4 rounded-xl border border-white/60 mb-4 text-sm text-gray-600 space-y-1">
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
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Referencia</label>
                    <input value={paymentRef} onChange={e=>setPaymentRef(e.target.value)} className="w-full p-3 bg-white/60 rounded-xl outline-none border border-transparent focus:border-[#191919] text-[#191919]" placeholder="Nro de comprobante"/>
                </div>

                <button 
                    onClick={() => {
                        if(!clientInfo.name || !paymentRef) return alert("Completa todos los datos");
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

// --- COMPONENTE MODAL RESERVA ---
interface BookingModalProps {
  onClose: () => void;
  step: number;
  setStep: (n: number) => void;
  selectedSpecialist: any | null;
  setSelectedSpecialist: (s: any | null) => void;
  selectedService: any | null;
  setSelectedService: (s: any | null) => void;
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
  selectedTime: string | null;
  setSelectedTime: (t: string | null) => void;
  clientData: { name: string; phone: string; note: string };
  setClientData: React.Dispatch<React.SetStateAction<{ name: string; phone: string; note: string }>>;
  isSubmitting: boolean;
  saveToDatabase: (extraData: Record<string, unknown>) => void;
  specialistsList: Array<any>;
  existingBookings: any[]; // Propiedad para citas existentes
}

const BookingModal: React.FC<BookingModalProps> = ({ 
  onClose, step, setStep, 
  selectedSpecialist, setSelectedSpecialist, 
  selectedService, setSelectedService, 
  selectedDate, setSelectedDate,
  selectedTime, setSelectedTime,
  clientData, setClientData,
  isSubmitting, saveToDatabase, specialistsList,
  existingBookings = [] 
}: any) => {

  const [paymentMethod, setPaymentMethod] = useState('pago_movil'); 
  const [paymentRef, setPaymentRef] = useState('');

  const filteredSpecialists = selectedService
    ? specialistsList.filter((spec: any) => {
        if (!selectedService.specialists || String(selectedService.specialists).trim() === "") {
             return true;
        }
        
        const serviceSpecs = String(selectedService.specialists).toLowerCase();
        const specName = String(spec.name).toLowerCase();

        return serviceSpecs.includes(specName);
      })
    : specialistsList; 
  
  // --- LÓGICA DE BLOQUEO DE HORARIO ---
  const isTimeSlotTaken = (time: string) => {
    if (!selectedSpecialist) return false;
    
    // Verifica si hay una cita que coincida en FECHA, HORA y ESPECIALISTA
    return existingBookings.some((booking: any) => 
       booking.date === selectedDate && 
       booking.time.includes(time) && 
       booking.specialist?.toLowerCase().trim() === selectedSpecialist.name.toLowerCase().trim()
    );
  };
  // -------------------------------------

  return (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-[#191919]/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-[#E9E0D5]/95 backdrop-blur-xl w-full max-w-4xl max-h-[90vh] md:h-[600px] shadow-2xl overflow-hidden flex flex-col md:flex-row rounded-3xl relative border border-white/50">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-[#191919] z-20"><X size={24} /></button>
      
      {/* SIDEBAR PASOS */}
      <div className="w-full md:w-1/3 bg-white/40 p-6 md:p-8 flex-col justify-between border-b md:border-b-0 md:border-r border-[#96765A]/10 hidden md:flex">
        <div>
          <h3 className={`${cinzel.className} text-xl md:text-2xl mb-6 text-[#191919]`}>Tu Cita</h3>
          <div className="space-y-4 md:space-y-6">
             <div className={`flex items-center gap-3 ${step >= 1 ? 'text-[#191919]' : 'text-gray-400'}`}><div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border border-current flex items-center justify-center text-[10px] md:text-xs shadow-sm ${step >= 1 ? 'bg-[#96765A] text-white border-transparent' : 'bg-white'}`}>1</div><span className="text-[10px] md:text-xs uppercase tracking-widest">Especialista</span></div>
             <div className={`flex items-center gap-3 ${step >= 2 ? 'text-[#191919]' : 'text-gray-400'}`}><div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border border-current flex items-center justify-center text-[10px] md:text-xs shadow-sm ${step >= 2 ? 'bg-[#96765A] text-white border-transparent' : 'bg-white'}`}>2</div><span className="text-[10px] md:text-xs uppercase tracking-widest">Fecha & Hora</span></div>
             <div className={`flex items-center gap-3 ${step >= 3 ? 'text-[#191919]' : 'text-gray-400'}`}><div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border border-current flex items-center justify-center text-[10px] md:text-xs shadow-sm ${step >= 3 ? 'bg-[#96765A] text-white border-transparent' : 'bg-white'}`}>3</div><span className="text-[10px] md:text-xs uppercase tracking-widest">Tus Datos</span></div>
             <div className={`flex items-center gap-3 ${step >= 4 ? 'text-[#191919]' : 'text-gray-400'}`}><div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border border-current flex items-center justify-center text-[10px] md:text-xs shadow-sm ${step >= 4 ? 'bg-[#96765A] text-white border-transparent' : 'bg-white'}`}>4</div><span className="text-[10px] md:text-xs uppercase tracking-widest">Confirmar</span></div>
          </div>
        </div>
        {selectedSpecialist && (<div className="bg-white/60 p-4 border border-white/50 shadow-sm rounded-2xl mt-4 md:mt-0"><p className="text-[10px] uppercase text-gray-500">Especialista</p><p className="font-medium text-sm text-[#191919]">{selectedSpecialist.name}</p></div>)}
      </div>

      <div className="w-full md:w-2/3 p-6 md:p-8 overflow-y-auto relative no-scrollbar">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className={`${cinzel.className} text-xl md:text-2xl mb-2 text-[#191919]`}>Selecciona tu Experto</h2>
            <div className="grid grid-cols-1 gap-3 md:gap-4 mt-6">
              {filteredSpecialists.length > 0 ? (filteredSpecialists.map((spec: any) => { const imgUrl = processGoogleImage(spec.img); return (<div key={spec.id} onClick={() => { setSelectedSpecialist(spec); setStep(2); }} className="flex items-center gap-4 p-3 border border-[#E9E0D5] rounded-2xl hover:border-[#96765A]/50 hover:bg-white hover:shadow-md cursor-pointer transition-all group bg-white/50"><div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden relative border-2 border-white shadow-sm shrink-0">{imgUrl ? <img src={imgUrl} alt={spec.name} className="w-full h-full object-cover" /> : null}</div><div><h4 className="font-medium text-sm md:text-base text-[#191919]">{spec.name}</h4><p className="text-[10px] md:text-xs text-[#96765A] uppercase">{spec.role}</p>{spec.schedule && <p className="text-[10px] text-[#6D6D6D] mt-0.5">{spec.schedule}</p>}</div><ArrowRight className="ml-auto text-[#C8B29C] group-hover:text-[#96765A]" size={18} /></div>)})) : (<div className="text-center py-10 text-[#6D6D6D] text-sm border border-dashed border-[#E9E0D5] rounded-2xl">No hay especialistas disponibles.</div>)}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setStep(1)} className="text-xs text-[#6D6D6D] underline mb-4">Volver</button>
            <h2 className={`${cinzel.className} text-xl md:text-2xl mb-6 text-[#191919]`}>Disponibilidad</h2>
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
              {getNextDays().map((day, i) => (<button key={i} onClick={() => setSelectedDate(day.isoDate)} className={`min-w-[70px] h-20 rounded-2xl border flex flex-col items-center justify-center transition-all shadow-sm ${selectedDate === day.isoDate ? 'bg-[#191919] text-[#E9E0D5] border-[#191919] shadow-md scale-105' : 'border-[#E9E0D5] bg-white text-[#6D6D6D] hover:border-[#96765A]'}`}><span className="text-xs uppercase">{day.dayName}</span><span className="text-xl font-serif">{day.date}</span></button>))}
            </div>
            {selectedDate && (
              <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2">
                {['09:00', '11:00', '14:30', '16:00', '17:30'].map(time => {
                    const taken = isTimeSlotTaken(time);
                    return (
                        <button 
                            key={time} 
                            disabled={taken} 
                            onClick={() => { setSelectedTime(time); setStep(3); }} 
                            className={`py-2 text-sm rounded-full border transition-all ${taken ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed line-through' : 'border-[#E9E0D5] hover:bg-[#E9E0D5]/50 text-[#6D6D6D] cursor-pointer'}`}
                        >
                            {time}
                        </button>
                    );
                })}
              </div>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setStep(2)} className="text-xs text-[#6D6D6D] underline mb-4">Volver</button>
            <h2 className={`${cinzel.className} text-xl md:text-2xl mb-2 text-[#191919]`}>Tus Datos</h2>
            <div className="space-y-4 md:space-y-6 max-w-sm w-full mx-auto md:mx-0 mt-6">
              <div><input type="text" value={clientData.name} onChange={(e) => setClientData({...clientData, name: e.target.value})} className="w-full p-4 bg-white border border-[#E9E0D5] rounded-xl focus:border-[#96765A] outline-none text-[#191919]" placeholder="Nombre Completo" /></div>
              <div><input type="tel" value={clientData.phone} onChange={(e) => setClientData({...clientData, phone: e.target.value})} className="w-full p-4 bg-white border border-[#E9E0D5] rounded-xl focus:border-[#96765A] outline-none text-[#191919]" placeholder="Teléfono" /></div>
              <button onClick={() => { if(clientData.name && clientData.phone) setStep(4); else alert("Completa los datos"); }} className={`w-full py-3 px-8 text-xs tracking-widest uppercase ${GLASS_DARK_STYLE} text-white mt-4`}>Continuar</button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8">
            <button onClick={() => setStep(3)} className="text-xs text-[#6D6D6D] underline mb-2 self-start">Volver</button>
            <h2 className="font-cinzel text-2xl text-[#191919]">Confirmar y Pagar</h2>
            
            <div className="bg-[#E9E0D5]/30 p-4 rounded-xl border border-[#E9E0D5] text-sm mb-4">
                <p><strong>Servicio:</strong> {selectedService?.name || "General"}</p>
                <p><strong>Especialista:</strong> {selectedSpecialist?.name}</p>
                <p><strong>Fecha:</strong> {selectedDate} {selectedTime}</p>
                <p className="mt-2 pt-2 border-t border-[#E9E0D5] text-[#96765A] font-bold text-lg">Total: €{selectedService?.price || 0}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
                {['pago_movil', 'binance'].map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 text-[10px] uppercase font-bold border rounded-xl ${paymentMethod === m ? 'bg-[#191919] text-[#E9E0D5]' : 'bg-white text-[#6D6D6D]'}`}>{m.replace('_', ' ')}</button>
                ))}
            </div>

            <input placeholder="Referencia de Pago" className="w-full p-3 bg-white border border-[#E9E0D5] rounded-xl outline-none" value={paymentRef} onChange={e=>setPaymentRef(e.target.value)}/>

            <button onClick={() => saveToDatabase({paymentMethod, paymentRef})} disabled={isSubmitting} className={`w-full py-4 text-xs uppercase tracking-widest ${GLASS_DARK_STYLE} text-white mt-auto`}>
                {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
            </button>
          </div>
        )}

         {step === 5 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4"><Check size={32}/></div>
                <h2 className="font-cinzel text-2xl text-[#191919] mb-2">¡Reserva Exitosa!</h2>
                <button onClick={onClose} className="underline text-[#6D6D6D]">Cerrar</button>
            </div>
        )}
      </div>
    </div>
  </motion.div>
  );
};

// --- COMPONENTE ZONA PRIVADA DE CLIENTES ---
const ClientAccessModal = ({ onClose, onLoginSuccess }: any) => {
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ email: '', password: '', nombre: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (view === 'login') {
        const res = await fetch('/api/database?tab=Clientes Registrados');
        const data = await res.json();
        
        if (data.success) {
          const user = data.data.find((u: any) => 
            u.Email?.toLowerCase() === formData.email.toLowerCase() && 
            String(u.Password) === formData.password
          );

          if (user) {
            onLoginSuccess(user);
          } else {
            setError('Correo o contraseña incorrectos.');
          }
        } else {
            setError('Error conectando con la base de datos.');
        }
      } else {
        if(!formData.nombre || !formData.email || !formData.password) {
            setError("Todos los campos son obligatorios.");
            setLoading(false);
            return;
        }

        const payload = {
            tab: "Clientes Registrados", 
            data: [formData.email, formData.password, formData.nombre] 
        };

        const res = await fetch('/api/database', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (result.success) {
            alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
            setView('login');
        } else {
            setError("Error al registrar: " + (result.error || "Intenta de nuevo."));
        }
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[#FAF9F6] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-[#E9E0D5] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#6D6D6D] hover:text-[#191919]"><X size={20} /></button>
        
        <div className="p-8 text-center">
            <h2 className={`${cinzel.className} text-2xl text-[#191919] mb-2`}>
                {view === 'login' ? 'Acceso Clientes' : 'Únete a Bronzer'}
            </h2>
            <p className="text-xs text-[#6D6D6D] mb-8 uppercase tracking-widest">
                {view === 'login' ? 'Ingresa para ver tus beneficios' : 'Regístrate y recibe novedades'}
            </p>

            <div className="space-y-4">
                {view === 'register' && (
                    <input 
                        type="text" 
                        placeholder="Tu Nombre" 
                        className="w-full p-4 bg-white border border-[#E9E0D5] rounded-xl outline-none text-[#191919] focus:border-[#96765A] transition-colors"
                        value={formData.nombre}
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                    />
                )}
                <input 
                    type="email" 
                    placeholder="Correo Electrónico" 
                    className="w-full p-4 bg-white border border-[#E9E0D5] rounded-xl outline-none text-[#191919] focus:border-[#96765A] transition-colors"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                />
                <input 
                    type="password" 
                    placeholder="Contraseña" 
                    className="w-full p-4 bg-white border border-[#E9E0D5] rounded-xl outline-none text-[#191919] focus:border-[#96765A] transition-colors"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                />
            </div>

            {error && <p className="text-red-500 text-xs mt-4 font-bold">{error}</p>}

            <button 
                onClick={handleAuth} 
                disabled={loading}
                className={`w-full py-4 text-xs uppercase tracking-widest mt-8 ${GLASS_DARK_STYLE} disabled:opacity-50`}
            >
                {loading ? 'Procesando...' : (view === 'login' ? 'Entrar' : 'Crear Cuenta')}
            </button>

            <div className="mt-6 text-xs text-[#6D6D6D]">
                {view === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="text-[#96765A] font-bold underline hover:text-[#191919]">
                    {view === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
                </button>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- COMPONENTE NOVEDADES ---
const ClientNewsModal = ({ user, onClose }: any) => (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[60] bg-[#FAF9F6] flex flex-col">
        <header className="p-6 border-b border-[#E9E0D5] flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div>
                <p className="text-xs text-[#6D6D6D] uppercase tracking-widest">Bienvenido de nuevo,</p>
                <h2 className={`${cinzel.className} text-xl text-[#191919]`}>{user?.Nombre || 'Cliente'}</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-[#191919] rounded-3xl p-6 text-[#E9E0D5] relative overflow-hidden">
                <div className="relative z-10">
                    <span className="bg-[#96765A] text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Nuevo</span>
                    <h3 className={`${cinzel.className} text-2xl mt-3 mb-2`}>Golden Hour Facial</h3>
                    <p className="text-sm opacity-80 mb-6 max-w-[200px]">Descubre nuestro nuevo tratamiento con oro de 24k para una piel radiante.</p>
                    <button className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold uppercase">Ver Detalles</button>
                </div>
                <div className="absolute right-[-20px] top-0 w-32 h-full bg-gradient-to-l from-[#96765A]/50 to-transparent"></div>
            </div>

            <h3 className="text-[#191919] font-bold uppercase tracking-widest text-xs mt-8 mb-4">Tus Ofertas Exclusivas</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-[#E9E0D5] p-4 rounded-2xl">
                    <div className="text-[#96765A] font-cinzel text-xl font-bold">20% OFF</div>
                    <p className="text-xs text-[#6D6D6D] mt-1">En tu próxima visita de Lunes a Miércoles.</p>
                </div>
                <div className="bg-white border border-[#E9E0D5] p-4 rounded-2xl">
                    <div className="text-[#96765A] font-cinzel text-xl font-bold">2x1</div>
                    <p className="text-xs text-[#6D6D6D] mt-1">En limpieza facial básica si traes un amigo.</p>
                </div>
            </div>
        </div>
    </motion.div>
);

export default function BronzerFullPlatform() {
  const [showSplash, setShowSplash] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); 
  
  // --- ESTADOS: INICIALIZAMOS VACÍOS ---
  const [products, setProducts] = useState<any[]>([]); 
  const [specialists, setSpecialists] = useState<any[]>([]); 
  const [services, setServices] = useState<any[]>([]); 
  // --- NUEVO: Estado para guardar las citas ocupadas ---
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  
  // --- NUEVO: ESTADO PARA MOSTRAR TIENDA COMPLETA ---
  const [showFullShop, setShowFullShop] = useState(false);

  type CartItem = { id?: number; name: string; price: number; img?: string | null };
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);
  const addToCart = (product: CartItem) => { setCart([...cart, product]); setCartOpen(true); };
  const removeFromCart = (index: number) => { const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); };

  const [bookingStep, setBookingStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientData, setClientData] = useState<{ name: string; phone: string; note: string }>({ name: "", phone: "", note: "" }); 
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- VARIABLES PARA EL CARRUSEL (BOUTIQUE) ---
  const [width, setWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (carouselRef.current) {
      setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
    }
  }, [products]);

  // --- CARGA DE DATOS REALES ---
  useEffect(() => {
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

            // --- CARGAR CITAS EXISTENTES PARA BLOQUEO ---
            const resCitas = await fetch('/api/calendar'); 
            const dataCitas = await resCitas.json();
            if (dataCitas.success) {
                const bookings = dataCitas.data.map((evt: any) => {
                    const desc = evt.description || "";
                    const getVal = (k: string) => {
                        const regex = new RegExp(`${k}: (.*)`, 'i');
                        const match = desc.match(regex);
                        return match ? match[1].trim() : '';
                    };
                    const d = new Date(evt.start);
                    return {
                        date: d.toISOString().split('T')[0],
                        time: d.toLocaleTimeString('es-VE', {hour:'2-digit', minute:'2-digit', hour12:false}), 
                        specialist: getVal('Especialista')
                    };
                });
                setExistingBookings(bookings);
            }
        } catch (error) { console.error("Usando datos demo..."); }
    };
    fetchData();

    const handleScroll = () => { setIsScrolled(window.scrollY > 50); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- GUARDAR CITAS (PESTAÑA 'Citas') ---
  const saveToDatabase = async (extraData?: Record<string, unknown>): Promise<void> => {
    setIsSubmitting(true);
    try {
      const payload = {
          sheetName: "Citas", // <--- Pestaña exacta en tu Excel
          name: clientData.name,
          phone: clientData.phone,
          note: clientData.note,
          service: selectedService?.name || selectedService?.title || "Servicio General",
          date: selectedDate, 
          time: selectedTime, 
          specialist: selectedSpecialist?.name,
          ...extraData 
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

  // --- GUARDAR VENTAS (PESTAÑA 'VENTAS') ---
  const handleCheckout = async (orderData: any) => {
      try {
          const payload = {
              sheetName: "VENTAS", 
              fecha: new Date().toLocaleString(),
              cliente: orderData.clientInfo.name,
              telefono: orderData.clientInfo.phone,
              productos: orderData.cart.map((p: any) => p.name).join(", "),
              total: orderData.total,
              metodoPago: orderData.paymentMethod,
              referencia: orderData.paymentRef
          };

          const response = await fetch('/api/calendar', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
          });

          if (response.ok) {
              alert(`¡Gracias ${orderData.clientInfo.name}! Tu pedido ha sido registrado correctamente.`);
              setCart([]); 
              setCartOpen(false);
          } else {
              alert("Hubo un error al guardar el pedido. Intenta nuevamente.");
          }
      } catch (error) {
          console.error(error);
          alert("Error de conexión al procesar el pedido.");
      }
  };

  // --- ESTADOS PARA CLIENTES ---
  const [clientAuthOpen, setClientAuthOpen] = useState(false);
  const [clientNewsOpen, setClientNewsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ------------------------------------------------------------------
  // MODO TIENDA COMPLETA (RESPONSIVE FIX)
  // ------------------------------------------------------------------
  if (showFullShop) {
      return (
        <div className={`bg-[#E9E0D5] min-h-screen text-[#191919] ${montserrat.className}`}>
            <header className="fixed top-0 w-full z-50 bg-[#E9E0D5]/90 backdrop-blur-xl border-b border-[#96765A]/10 shadow-sm">
                <div className="container mx-auto px-6 h-16 md:h-20 flex justify-between items-center">
                    <button onClick={() => setShowFullShop(false)} className="flex items-center gap-2 text-xs md:text-sm hover:text-[#96765A] transition-colors uppercase tracking-widest">
                        <ArrowLeft size={16} /> Volver
                    </button>
                    <div className={`${cinzel.className} text-lg md:text-xl tracking-[0.15em] font-bold`}>BRONZER SHOP</div>
                    <div className="relative cursor-pointer hover:text-[#96765A] transition-colors" onClick={() => setCartOpen(true)}>
                        <ShoppingBag size={20} />
                        {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-[#191919] text-[#E9E0D5] text-[10px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{cart.length}</span>}
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto px-4 pt-24 md:pt-32 pb-24">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {products.map((prod) => {
                        const imgUrl = processGoogleImage(prod.img);
                        return (
                            <div key={prod.id} className="group relative">
                                <div className="relative h-[200px] md:h-[350px] w-full bg-[#E9E0D5]/30 mb-3 overflow-hidden rounded-[1.5rem] border border-[#E9E0D5] shadow-sm transition-all duration-500 group-hover:shadow-xl">
                                    {imgUrl && <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />}
                                    
                                    {/* BOTÓN SOLO ESCRITORIO (HOVER) */}
                                    <button onClick={() => addToCart(prod)} className={`hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] py-3 text-xs uppercase tracking-widest ${GLASS_DARK_STYLE} rounded-full opacity-0 group-hover:opacity-100 transition-all`}>Añadir</button>
                                </div>
                                <h3 className="font-medium text-xs md:text-base text-[#191919] truncate">{prod.name}</h3>
                                <p className="text-[#96765A] text-xs md:text-sm font-serif italic mb-2">€{Number(prod.price).toFixed(2)}</p>
                                
                                {/* BOTÓN SOLO MÓVIL (DEBAJO DEL PRODUCTO) */}
                                <button onClick={() => addToCart(prod)} className={`md:hidden w-full py-2 text-[10px] uppercase tracking-widest ${GLASS_DARK_STYLE} rounded-xl`}>+ Añadir</button>
                            </div>
                        )
                    })}
                </div>
            </main>
            {/* AGREGAMOS existingBookings AL MODAL */}
            {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} cart={cart} removeFromCart={removeFromCart} total={cartTotal} onCheckout={handleCheckout} />}
            
            {/* MODALES DE CLIENTE (NECESARIOS TAMBIÉN EN LA TIENDA) */}
            {clientAuthOpen && (<ClientAccessModal onClose={() => setClientAuthOpen(false)} onLoginSuccess={(user: any) => { setCurrentUser(user); setClientAuthOpen(false); setClientNewsOpen(true); }} />)}
            {clientNewsOpen && (<ClientNewsModal user={currentUser} onClose={() => setClientNewsOpen(false)} />)}
        </div>
      );
  }
  
  // --- MODO LANDING PAGE (RESPONSIVE FIX) ---
  return (
    <div className={`bg-[#E9E0D5] min-h-screen text-[#191919] ${montserrat.className} selection:bg-[#96765A] selection:text-[#E9E0D5] ${showSplash ? 'overflow-hidden h-screen' : ''}`}>
      
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      
      <header className={`fixed top-0 w-full z-50 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] border-b ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-[#E9E0D5] h-16 md:h-20 shadow-sm' : 'bg-transparent border-transparent h-20 md:h-32'}`}>
        <div className="container mx-auto h-full flex items-center justify-between relative px-6 md:px-12">
          
          <div className={`absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] z-20 ${isScrolled ? 'left-1/2 -translate-x-1/2' : 'left-8 md:left-12'}`}>
             <div className={`${cinzel.className} text-xl md:text-2xl tracking-[0.15em] font-semibold flex items-center gap-2 text-[#191919]`}>
               BRONZER 
               <div className="w-1.5 h-1.5 bg-[#96765A] rounded-full mt-1 shadow-sm"></div>
             </div>
          </div>

          <nav className={`hidden md:flex mx-auto gap-8 text-xs tracking-[0.2em] uppercase font-medium text-[#6D6D6D] transition-all duration-500 delay-100 ${isScrolled ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
            {['Experiencia', 'Servicios', 'Boutique', 'Contacto'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-[#191919] transition-colors">{item}</a>
            ))}
          </nav>

          <div className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 flex items-center gap-4 md:gap-6 z-20">
            
            {/* BOTÓN USUARIO */}
            <button onClick={() => currentUser ? setClientNewsOpen(true) : setClientAuthOpen(true)} className="relative cursor-pointer hover:text-[#96765A] transition-colors mr-2">
                {currentUser ? (
                    <div className="w-6 h-6 bg-[#96765A] rounded-full flex items-center justify-center text-white text-xs font-bold">{currentUser.Nombre?.charAt(0)}</div>
                ) : (
                    <User size={20} strokeWidth={1.5} />
                )}
            </button>

            <div className="relative cursor-pointer hover:text-[#96765A] transition-colors" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-[#191919] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{cart.length}</span>}
            </div>

            <button 
                onClick={() => { setSelectedService(null); setBookingStep(1); setBookingOpen(true); }} 
                className={`hidden md:block px-8 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${GLASS_STYLE} ${isScrolled ? 'bg-[#191919] text-[#E9E0D5] border-transparent hover:bg-[#2B2B2B]' : ''}`}
            >
                Agendar
            </button>
          </div>
          
        </div>
      </header>

      {/* HERO SECTION CORREGIDA: Padding Top Aumentado (pt-28) */}
      <section className="relative min-h-screen pt-28 md:pt-32 flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-24 py-12 md:py-0 relative overflow-hidden order-2 md:order-1">
           <div className="absolute inset-0 bg-gradient-to-br from-white via-[#FAF9F6] to-[#E9E0D5]/20 -z-10"></div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: showSplash ? 3.8 : 0.2 }} className="relative z-10">
            <span className="text-[#96765A] text-xs tracking-[0.4em] uppercase font-bold mb-4 block">Medical Aesthetic</span>
            <h1 className={`${cinzel.className} text-4xl md:text-5xl lg:text-7xl leading-[1.1] mb-6 text-[#191919] drop-shadow-sm`}>Centro <br/> Estético y <span className="italic text-[#6D6D6D] font-serif">Spa.</span></h1>
            <p className="text-[#6D6D6D] font-light leading-relaxed max-w-md mb-8 md:mb-10 text-sm md:text-base">Elevamos el estándar de la belleza. Tecnología de vanguardia en un ambiente de calma absoluta.</p>
            {/* AQUÍ TAMBIÉN: Limpiamos el servicio seleccionado para el botón del Hero */}
            <button 
                onClick={() => { setSelectedService(null); setBookingStep(1); setBookingOpen(true); }} 
                className={`flex w-fit items-center gap-4 px-6 md:px-8 py-3 md:py-4 text-xs uppercase tracking-widest ${GLASS_STYLE}`}
            >
                Reservar Cita <ArrowRight size={14} />
            </button>
          </motion.div>
        </div>
        
        {/* COLUMNA DERECHA: VIDEO DE FONDO */}
        <div className="w-full md:w-1/2 h-[28vh] md:h-auto relative order-1 md:order-2">
          {/* USAMOS VIDEO HTML5 STANDARD */}
          <video 
            className="w-full h-full object-cover" 
            autoPlay 
            loop 
            muted 
            playsInline 
          >
            <source src="/portada.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6]/20 to-transparent mix-blend-overlay"></div>
        </div>
      </section>

      <section id="experiencia" className="py-16 md:py-24 px-6 md:px-24 bg-white relative">
        <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16 relative z-10">
          <Star className="w-6 h-6 text-[#96765A] mx-auto mb-6 drop-shadow-sm" fill="#96765A" />
          <h2 className={`${cinzel.className} text-2xl md:text-3xl lg:text-4xl mb-6 text-[#191919]`}>The Bronzer Standard</h2>
          <p className="text-[#6D6D6D] font-light leading-7 md:leading-8 text-sm md:text-base">"No creemos en la transformación forzada, sino en la revelación de tu mejor versión. Utilizamos protocolos suizos y aparatología alemana para garantizar resultados visibles."</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-t border-b border-[#E9E0D5] py-12 relative z-10">
          {[{ n: "5+", l: "Años de Experiencia" }, { n: "2k+", l: "Pacientes Felices" }, { n: "100%", l: "Tecnología Certificada" }, { n: "Top", l: "Especialistas" }].map((stat, i) => (
            <div key={i}><h3 className={`${cinzel.className} text-2xl md:text-3xl lg:text-4xl mb-2 text-[#191919]`}>{stat.n}</h3><p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#96765A]">{stat.l}</p></div>
          ))}
        </div>
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0 pointer-events-none"></div>
      </section>

      {/* --- SECCIÓN SERVICIOS (GRILLA DE 2 COLUMNAS MÍNIMO) --- */}
      <section id="servicios" className="py-16 md:py-24 bg-[#E9E0D5]/30 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-12 relative z-10">
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-12 gap-4 relative z-10">
            <h2 className={`${cinzel.className} text-2xl md:text-4xl drop-shadow-sm text-[#191919]`}>Menú de Tratamientos</h2>
            
            <button 
                onClick={() => { /* Navegación futura */ }}
                className={`hidden md:flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}
            >
                Ver Todo <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {services.map((item) => {
              const imgUrl = processGoogleImage(item.img || item.Imagen || item.imagen || item.Image);
              return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="bg-white/80 backdrop-blur-md p-3 md:p-4 rounded-3xl group cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(150,118,90,0.1)] transition-all duration-500 border border-[#E9E0D5]">
                <div className="relative h-32 md:h-64 mb-3 md:mb-6 overflow-hidden bg-[#E9E0D5]/30 rounded-2xl">
                   {imgUrl && <img src={imgUrl} alt={item.name || item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                  <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/90 backdrop-blur-md px-2 py-1 text-[10px] md:text-xs font-bold font-serif italic rounded-full shadow-sm border border-[#E9E0D5] text-[#96765A]">€{item.price}</div>
                </div>
                <h3 className={`${cinzel.className} text-xs md:text-lg mb-1 md:mb-2 pl-2 text-[#191919]`}>{item.name || item.title}</h3>
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-[#6D6D6D] mb-2 md:mb-6 pl-2"><Clock size={12} /> {item.duration || item.time}</div>
                <button onClick={() => { setSelectedService(item); setBookingStep(1); setBookingOpen(true); }} className={`w-full py-2 md:py-3 text-[10px] md:text-xs uppercase tracking-widest ${GLASS_STYLE}`}>Reservar</button>
              </motion.div>
            )})}
          </div>

          <div className="flex md:hidden justify-center mt-8">
            <button className={`flex items-center gap-2 px-8 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}>Ver Todo <ArrowRight size={14} /></button>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN BOUTIQUE (CARRUSEL 3D AJUSTADO MÓVIL) --- */}
      <section id="boutique" className="py-20 md:py-28 px-0 md:px-12 bg-[#FAF9F6] relative overflow-hidden">
        <div className="container mx-auto relative z-10 px-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                <div>
                    <h2 className={`${cinzel.className} text-3xl md:text-5xl drop-shadow-sm text-[#191919]`}>Bronzer Boutique</h2>
                    <p className="text-[#6D6D6D] text-xs uppercase tracking-widest mt-2">Skin Care de Alta Gama</p>
                </div>
                
                <div className="md:hidden flex items-center gap-2 text-[10px] text-[#96765A] animate-pulse">
                    <ArrowRight size={12}/> DESLIZA
                </div>

                <button 
                    onClick={() => { setShowFullShop(true); window.scrollTo(0,0); }}
                    className={`hidden md:flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}
                >
                    Ver Todo <ArrowRight size={14} />
                </button>
            </div>
            
            <motion.div 
                ref={carouselRef} 
                className="cursor-grab active:cursor-grabbing overflow-visible p-4" 
                whileTap={{ cursor: "grabbing" }}
            >
                <motion.div 
                    drag="x" 
                    dragConstraints={{ right: 0, left: -width }} 
                    className="flex gap-4 md:gap-12 pl-2"
                >
                    {products.slice(0, 5).map((prod) => {
                        const imgUrl = processGoogleImage(prod.img);
                        return (
                            <motion.div 
                                key={prod.id} 
                                className="relative min-w-[42vw] md:min-w-[400px] group perspective-1000"
                            >
                                <div className="bg-white rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-white/60 p-2 md:p-6 transition-all duration-500 ease-out group-hover:-translate-y-4 group-hover:shadow-[0_30px_60px_-15px_rgba(150,118,90,0.3)]">
                                    
                                    <div className="relative h-[180px] md:h-[450px] w-full bg-[#E9E0D5]/30 mb-4 md:mb-6 overflow-hidden rounded-[1.5rem] shadow-inner">
                                        {imgUrl && (
                                            <img 
                                                src={imgUrl} 
                                                alt={prod.name} 
                                                loading="lazy" 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none" 
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
                                        
                                        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-white/90 backdrop-blur-md px-3 py-1 md:px-4 md:py-2 rounded-full shadow-lg z-10 border border-[#E9E0D5]">
                                            <p className="text-[#96765A] font-serif font-bold text-[10px] md:text-base">€{Number(prod.price).toFixed(2)}</p>
                                        </div>

                                        <button onClick={() => addToCart(prod)} className={`
                                            hidden md:block absolute bottom-4 right-4 px-6 py-3 
                                            text-xs uppercase tracking-widest text-white 
                                            ${GLASS_DARK_STYLE} rounded-full 
                                            opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 
                                            transition-all duration-500 shadow-xl
                                        `}>
                                            Añadir +
                                        </button>
                                    </div>

                                    <div className="text-center px-1 md:px-2 relative z-20">
                                        <h3 className={`${cinzel.className} text-xs md:text-2xl text-[#191919] mb-1 truncate`}>{prod.name}</h3>
                                        <p className="text-[#6D6D6D] text-[10px] md:text-xs line-clamp-2 min-h-[2.5em] leading-relaxed hidden md:block">
                                            {prod.description || "Tratamiento exclusivo para el cuidado de la piel."}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => addToCart(prod)} 
                                        className={`
                                            md:hidden w-full mt-2 py-2 
                                            text-[10px] uppercase tracking-[0.2em] font-bold text-[#E9E0D5] 
                                            bg-[#191919] rounded-xl shadow-lg 
                                            active:scale-95 transition-transform
                                        `}
                                    >
                                        Añadir
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </motion.div>

            <div className="flex md:hidden justify-center mt-6">
                <button 
                    onClick={() => { setShowFullShop(true); window.scrollTo(0,0); }}
                    className={`flex items-center gap-2 px-8 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}
                >
                    Ver Todo <ArrowRight size={14} />
                </button>
            </div>

        </div>
         <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#E9E0D5]/40 via-transparent to-transparent -z-10"></div>
      </section>

      <section className="relative h-[50vh] md:h-[80vh] w-full">
        <Image src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop" alt="Spa Interior" fill className="object-cover" />
        <div className="absolute inset-0 bg-[#191919]/20 flex items-center justify-center text-center">
          <div className="bg-white/70 backdrop-blur-lg p-8 md:p-12 max-w-sm md:max-w-xl rounded-3xl border border-white/40 shadow-2xl mx-4">
            <h3 className={`${cinzel.className} text-2xl md:text-3xl mb-4 text-[#191919]`}>Visítanos</h3>
            <p className="text-[#6D6D6D] mb-8 font-light leading-relaxed text-sm md:text-base">Un oasis urbano diseñado para desconectar. <br/>Valet Parking disponible.</p>
             <button className={`px-8 py-3 text-xs uppercase tracking-widest ${GLASS_STYLE}`}>Ver Ubicación</button>
          </div>
        </div>
      </section>

      <footer id="contacto" className="bg-[#191919] text-[#E9E0D5] pt-16 md:pt-24 pb-12 relative overflow-hidden">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-16 relative z-10">
             <div><h2 className={`${cinzel.className} text-2xl md:text-3xl mb-6 flex items-center gap-2`}>BRONZER <div className="w-1.5 h-1.5 bg-[#96765A] rounded-full mt-2"></div></h2><p className="text-[#6D6D6D] text-sm font-light leading-7 max-w-xs">Centro estético de alto rendimiento. Fusionamos protocolos médicos con experiencias sensoriales de lujo.</p></div>
             <div><h4 className="text-xs uppercase tracking-[0.2em] text-[#96765A] mb-6 font-semibold">Contacto</h4><ul className="space-y-4 text-sm text-[#6D6D6D] font-light"><li className="flex items-center gap-3"><Phone size={16} className="text-[#96765A]"/> +58 412 000 0000</li><li className="flex items-center gap-3"><Mail size={16} className="text-[#96765A]"/> citas@bronzer.com</li></ul></div>
             <div><h4 className="text-xs uppercase tracking-[0.2em] text-[#96765A] mb-6 font-semibold">Horarios</h4><ul className="space-y-2 text-sm text-[#6D6D6D] font-light"><li className="flex justify-between border-b border-white/10 pb-2"><span>Lunes - Viernes</span> <span>9:00 - 19:00</span></li><li className="flex justify-between border-b border-white/10 pb-2"><span>Sábados</span> <span>10:00 - 16:00</span></li><li className="flex justify-between pb-2"><span className="text-[#6D6D6D]">Domingos</span> <span className="text-[#6D6D6D]">Cerrado</span></li></ul></div>
        </div>
        <div className="container mx-auto px-6 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-[#6D6D6D] relative z-10">
            <p>© 2025 BRONZER AESTHETIC. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
                <a href="https://www.instagram.com/bronzerdeluxe/" target="_blank" rel="noopener noreferrer">
                    <Instagram className="cursor-pointer hover:text-[#96765A] transition-colors" size={18} />
                </a>
                <Mail className="cursor-pointer hover:text-[#96765A] transition-colors" size={18} />
            </div>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-1/2 bg-gradient-to-t from-[#96765A]/10 to-transparent blur-3xl -z-0 pointer-events-none"></div>
      </footer>

      <AnimatePresence>
        {bookingOpen && <BookingModal key="modal" isOpen={bookingOpen} onClose={() => setBookingOpen(false)} step={bookingStep} setStep={setBookingStep} selectedSpecialist={selectedSpecialist} setSelectedSpecialist={setSelectedSpecialist} selectedService={selectedService} setSelectedService={setSelectedService} selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} clientData={clientData} setClientData={setClientData} isSubmitting={isSubmitting} saveToDatabase={saveToDatabase} specialistsList={specialists} existingBookings={existingBookings} />}
        {cartOpen && <CartDrawer key="drawer" isOpen={cartOpen} onClose={() => setCartOpen(false)} cart={cart} removeFromCart={removeFromCart} total={cartTotal} onCheckout={handleCheckout} />}
        
        {/* MODALES DE CLIENTE */}
        {clientAuthOpen && (
            <ClientAccessModal 
                onClose={() => setClientAuthOpen(false)} 
                onLoginSuccess={(user: any) => {
                    setCurrentUser(user);
                    setClientAuthOpen(false);
                    setClientNewsOpen(true); 
                }} 
            />
        )}
        {clientNewsOpen && (
            <ClientNewsModal 
                user={currentUser} 
                onClose={() => setClientNewsOpen(false)} 
            />
        )}
      </AnimatePresence>
    </div>
  );
}
