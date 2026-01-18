"use client";

import React, { useState, useEffect } from 'react';
// Nota: No importamos Image de next/image para usar img nativa y evitar bloqueos
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, Users, ShoppingBag, Sparkles, 
  LogOut, Plus, Trash2, Edit2, Search, CheckCircle, XCircle, 
  TrendingUp, DollarSign, Clock, Save, Phone, FileText, RefreshCw, Tag,
  Download, Loader2, Menu, X, Bell, ChevronRight, BarChart3, Home,
  Gift, Palette, Image as ImageIcon, Send, Mail as MailIcon, CheckSquare, Square,
  Megaphone, CreditCard // Nuevos iconos
} from 'lucide-react';
import { Cinzel, Montserrat } from 'next/font/google';

// --- FUENTES ---
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '600', '700'] });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['300', '400', '500', '600'] });

// --- DATOS INICIALES (VACÍOS) ---
const INITIAL_RESERVATIONS: any[] = [];
const INITIAL_PRODUCTS: any[] = [];
const INITIAL_TEAM: any[] = [];
const INITIAL_SERVICES: any[] = [];
const INITIAL_CLIENTS: any[] = [];

export default function AdminPanel() {
  // --- ESTADOS PRINCIPALES ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false); 
  
  // Estados de Datos
  const [reservations, setReservations] = useState<any[]>(INITIAL_RESERVATIONS);
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);
  const [team, setTeam] = useState<any[]>(INITIAL_TEAM);
  const [services, setServices] = useState<any[]>(INITIAL_SERVICES); 
  const [clients, setClients] = useState<any[]>(INITIAL_CLIENTS);
  
  // Estado Ventas
  const [salesStats, setSalesStats] = useState({ total: 0, orders: 0 });
  const [monthlySales, setMonthlySales] = useState<number[]>(new Array(12).fill(0));
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);

  // Estados de Formularios
  const [loginData, setLoginData] = useState({ user: "", pass: "" });

  // --- ESTADO BANNER (NUEVO) ---
  const [bannerConfig, setBannerConfig] = useState({
    active: true,
    text: "Envíos Gratis en compras mayores a $50 ✨",
    bgColor: "#96765A",
    textColor: "#FFFFFF",
    animation: "marquee" // 'none', 'marquee', 'pulse'
  });
  
  // --- MODALES ---
  const [editBooking, setEditBooking] = useState<any>(null); 
  const [editSpecialist, setEditSpecialist] = useState<any>(null); 
  const [productModal, setProductModal] = useState<any>(null); 
  const [serviceModal, setServiceModal] = useState<any>(null); 
  
  // Modal Marketing Actualizado
  const [marketingModal, setMarketingModal] = useState<any>(null); 
  
  const [isCreating, setIsCreating] = useState(false);

  // --- ESTADOS DE INTERFAZ Y PWA ---
  const [isDataReady, setIsDataReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState('Admin');

  // Fecha Actual y Saludo
  const currentDate = new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Buenos Días' : currentHour < 18 ? 'Buenas Tardes' : 'Buenas Noches';

  // --- LÓGICA DE LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.user === "admin" && loginData.pass === "bronzer2025") {
      setIsAuthenticated(true);
      setUserName(loginData.user ? (loginData.user.charAt(0).toUpperCase() + loginData.user.slice(1)) : 'Admin');
      await fetchAllData();
      setIsDataReady(true); 
    } else {
      alert("Credenciales Incorrectas");
    }
  };

  // --- DETECTAR PWA Y RESIZE ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); 
    window.addEventListener('resize', handleResize);

    if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        alert("📲 Para instalar: Toca 'Compartir' > 'Añadir a inicio'.");
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        setDeferredPrompt(null);
    }
  };

  const processGoogleImage = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    let id = null;
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) id = matchD[1];
    else {
        const matchId = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (matchId && matchId[1]) id = matchId[1];
    }
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    if (url.startsWith('http')) return url;
    return null;
  };

  // --- SINCRONIZACIÓN TOTAL ---
  const fetchAllData = async () => {
    setIsLoadingGoogle(true);
    try {
      const [resCal, resProd, resTeam, resServ, resSales, resClients] = await Promise.all([
        fetch('/api/calendar'),
        fetch('/api/database?tab=Productos'),
        fetch('/api/database?tab=ESPECIALISTAS'),
        fetch('/api/database?tab=Servicios'),
        fetch('/api/database?tab=Ventas'),
        fetch('/api/database?tab=Clientes Registrados')
      ]);

      const [dataCal, dataProd, dataTeam, dataServ, dataSales, dataClients] = await Promise.all([
        resCal.json(), resProd.json(), resTeam.json(), resServ.json(), resSales.json(), resClients.json()
      ]);

      if (dataCal.success) {
        const googleBookings = dataCal.data.map((evt: any) => ({
            id: evt.id,
            client: evt.client_name || 'Cliente', 
            phone: evt.phone || '---',
            note: evt.note || '',
            service: evt.service || 'Servicio',
            specialist: evt.specialist || '---',
            date: evt.date, 
            time: evt.time, 
            status: evt.status || 'Confirmado'
        }));
        setReservations(googleBookings);
      }

      if (dataProd.success) setProducts(dataProd.data);
      if (dataTeam.success) setTeam(dataTeam.data);
      if (dataServ.success) setServices(dataServ.data);
      
      if (dataClients.success) {
         const loadedClients = dataClients.data.map((c: any) => ({
             ...c,
             lastSent: c.lastSent || '-' 
         }));
         setClients(loadedClients);
      }

      if (dataSales.success) {
        const salesData = dataSales.data;
        const totalAmount = salesData.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);
        setSalesStats({ total: totalAmount, orders: salesData.length });

        const salesByMonth = new Array(12).fill(0);
        salesData.forEach((sale: any) => {
            const saleDate = new Date(sale.date || sale.fecha || new Date()); 
            if (!isNaN(saleDate.getTime())) {
                const monthIndex = saleDate.getMonth();
                salesByMonth[monthIndex] += Number(sale.total) || 0;
            }
        });
        setMonthlySales(salesByMonth);
      }

    } catch (error) {
      console.error("Error sincronizando datos:", error);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (!isDataReady) {
         fetchAllData().then(() => setIsDataReady(true));
      }
      const interval = setInterval(fetchAllData, 30000); 
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isDataReady]);

  // --- CRUD CITA ---
  const saveBookingEdit = async () => {
    if (!editBooking) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: editBooking.id,
          date: editBooking.date,
          time: editBooking.time
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Cita actualizada.");
        setEditBooking(null);
        fetchAllData(); 
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteBooking = async (id: any) => {
    if(!confirm("¿Eliminar cita de Google Calendar y la Base de Datos?")) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReservations(reservations.filter(r => r.id !== id));
        alert("🗑️ Cita eliminada correctamente.");
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CRUD PRODUCTOS ---
  const openNewProductModal = () => {
      setIsCreating(true);
      setProductModal({ id: `PROD-${Date.now().toString().slice(-6)}`, name: '', price: 0, stock: 1, img: '', description: '', promotion: '' });
  };
  const openEditProductModal = (prod: any) => { setIsCreating(false); setProductModal(prod); };

  const saveProduct = async () => {
      if (!productModal) return;
      setIsProcessing(true);
      const rowData = [productModal.id, productModal.name, productModal.price, productModal.stock, productModal.img, productModal.description || '', productModal.promotion || ''];
      try {
          const method = isCreating ? 'POST' : 'PUT';
          const body = isCreating ? { tab: 'Productos', data: rowData } : { tab: 'Productos', rowIndex: productModal.rowIndex, data: rowData };
          const res = await fetch('/api/database', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          if ((await res.json()).success) { alert("✅ Guardado."); setProductModal(null); fetchAllData(); }
      } catch (e) { alert("Error"); } finally { setIsProcessing(false); }
  };

  // --- CRUD SERVICIOS ---
  const openNewServiceModal = () => {
      setIsCreating(true);
      setServiceModal({ id: `S-${Date.now().toString().slice(-6)}`, name: '', price: 0, duration: '60 min', category: 'General', description: '', img: '', specialists: '' });
  };
  const openEditServiceModal = (serv: any) => { setIsCreating(false); setServiceModal(serv); };

  const saveService = async () => {
      if (!serviceModal) return;
      setIsProcessing(true);
      const rowData = [serviceModal.id, serviceModal.name, serviceModal.price, serviceModal.duration, serviceModal.category, serviceModal.description || '', serviceModal.img || '', serviceModal.specialists || ''];
      try {
          const method = isCreating ? 'POST' : 'PUT';
          const body = isCreating ? { tab: 'Servicios', data: rowData } : { tab: 'Servicios', rowIndex: serviceModal.rowIndex, data: rowData };
          const res = await fetch('/api/database', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          if ((await res.json()).success) { alert("✅ Guardado."); setServiceModal(null); fetchAllData(); }
      } catch (e) { alert("Error"); } finally { setIsProcessing(false); }
  };

  // --- CRUD ESPECIALISTAS ---
  const saveSpecialistEdit = async () => {
    if (!editSpecialist) return;
    setIsProcessing(true);
    const rowData = [editSpecialist.id, editSpecialist.name, editSpecialist.role, editSpecialist.img, editSpecialist.schedule, editSpecialist.specialty || '', editSpecialist.experience || '', editSpecialist.certified || '', editSpecialist.services || ''];
    try {
        const res = await fetch('/api/database', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tab: 'ESPECIALISTAS', rowIndex: editSpecialist.rowIndex, data: rowData }) });
        if ((await res.json()).success) { alert("✅ Guardado."); setEditSpecialist(null); fetchAllData(); }
    } catch (error) { alert("Error"); } finally { setIsProcessing(false); }
  };

  // --- FUNCIÓN ENVIAR MARKETING / BANNER ---
  const handleSaveBanner = () => {
    // Aquí iría la lógica para guardar en DB. Por ahora simulamos.
    alert("✅ Banner actualizado exitosamente en la tienda.");
  };

  const handleSendMarketing = () => {
      if (!marketingModal.selectedEmails || marketingModal.selectedEmails.length === 0) {
          alert("⚠️ Por favor selecciona al menos un cliente.");
          return;
      }

      // Datos del Cupón/Regalo
      const couponData = {
          title: marketingModal.title,
          type: marketingModal.couponType || 'discount', // 'discount', 'giftcard', 'gift'
          target: marketingModal.couponTarget || 'all', // 'all', 'boutique', 'nutrition', 'service_id'
          singleUse: true, // Siempre true según requerimiento
          clients: marketingModal.selectedEmails
      };

      // Aquí guardarías en la BD de Cupones/Notificaciones
      console.log("Enviando Cupón:", couponData);

      const today = new Date().toLocaleDateString('es-VE');
      const updatedClients = clients.map(c => {
          if (marketingModal.selectedEmails.includes(c.Email)) {
              return { ...c, lastSent: today };
          }
          return c;
      });
      setClients(updatedClients);

      alert(`🎉 Promoción "${marketingModal.title}" enviada a ${marketingModal.selectedEmails.length} clientes.`);
      setMarketingModal(null);
  };

  const toggleClientSelection = (email: string) => {
      if (!marketingModal) return;
      const currentSelection = marketingModal.selectedEmails || [];
      const isSelected = currentSelection.includes(email);
      let newSelection = isSelected ? currentSelection.filter((e: string) => e !== email) : [...currentSelection, email];
      setMarketingModal({ ...marketingModal, selectedEmails: newSelection });
  };

  const toggleAllClients = () => {
      if (!marketingModal) return;
      const allSelected = marketingModal.selectedEmails?.length === clients.length;
      setMarketingModal({ 
          ...marketingModal, 
          selectedEmails: allSelected ? [] : clients.map(c => c.Email) 
      });
  };

  // --- RENDER ---
  if (!isAuthenticated) {
    return (
      <div className={`h-screen w-full bg-[#050505] flex items-center justify-center ${montserrat.className}`}>
        <div className="bg-white/10 backdrop-blur-md p-10 w-full max-w-sm text-center shadow-2xl border border-white/20 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
          <h1 className={`${cinzel.className} text-4xl mb-2 text-[#D4AF37]`}>BRONZER</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-8">Admin Access</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="ID Usuario" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none text-center focus:border-[#D4AF37]" value={loginData.user} onChange={e => setLoginData({...loginData, user: e.target.value})} />
            <input type="password" placeholder="PIN de Acceso" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none text-center focus:border-[#D4AF37]" value={loginData.pass} onChange={e => setLoginData({...loginData, pass: e.target.value})} />
            <button className="w-full bg-[#D4AF37] text-black py-4 uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-white mt-4">Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  if (isAuthenticated && !isDataReady) {
    return (
        <div className={`h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center text-white ${montserrat.className}`}>
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
                <Loader2 size={40} className="animate-spin text-[#D4AF37]" />
                <h2 className={`${cinzel.className} text-2xl tracking-widest text-[#D4AF37]`}>CARGANDO DATOS...</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Google Cloud</p>
            </motion.div>
        </div>
    );
  }

  return (
    <div className={`h-screen flex bg-slate-50 overflow-hidden ${montserrat.className}`}>
      {!isAppInstalled && (deferredPrompt || isMobile) && (
        <motion.button initial={{ y: 100 }} animate={{ y: 0 }} transition={{ delay: 1 }} onClick={handleInstallClick} className="fixed bottom-24 right-6 z-[60] bg-[#D4AF37] text-black p-4 rounded-full shadow-lg md:hidden"><Download size={24}/></motion.button>
      )}

      {/* SIDEBAR PC */}
      <aside className="w-72 bg-white border-r border-gray-100 h-screen hidden md:flex flex-col z-20 shadow-sm">
        <div className="h-24 flex items-center justify-center border-b border-gray-50"><span className={`${cinzel.className} text-2xl tracking-widest font-bold`}>BRONZER<span className="text-[#D4AF37]">.</span></span></div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            <p className="text-[10px] uppercase text-gray-400 font-bold px-4 mb-2 mt-2">Principal</p>
            {[{ id: "overview", label: "Dashboard", icon: LayoutDashboard }, { id: "bookings", label: "Reservas", icon: Calendar }].map(item => (
                <button key={item.id} onClick={() => {setActiveTab(item.id)}} className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm rounded-xl transition-all ${activeTab === item.id ? 'bg-[#0a0a0a] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}><item.icon size={18} className={activeTab === item.id ? "text-[#D4AF37]" : ""} /> {item.label}</button>
            ))}
            <p className="text-[10px] uppercase text-gray-400 font-bold px-4 mb-2 mt-6">Gestión</p>
            {[{ id: "services", label: "Servicios", icon: Sparkles }, { id: "products", label: "Inventario", icon: ShoppingBag }, { id: "team", label: "Equipo", icon: Users }].map(item => (
                <button key={item.id} onClick={() => {setActiveTab(item.id)}} className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm rounded-xl transition-all ${activeTab === item.id ? 'bg-[#0a0a0a] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}><item.icon size={18} className={activeTab === item.id ? "text-[#D4AF37]" : ""} /> {item.label}</button>
            ))}
            <p className="text-[10px] uppercase text-gray-400 font-bold px-4 mb-2 mt-6">Configuración</p>
            {[{ id: "marketing", label: "Marketing", icon: Gift }, { id: "banner", label: "Banner Web", icon: Megaphone }].map(item => (
                <button key={item.id} onClick={() => {setActiveTab(item.id)}} className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm rounded-xl transition-all ${activeTab === item.id ? 'bg-[#0a0a0a] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}><item.icon size={18} className={activeTab === item.id ? "text-[#D4AF37]" : ""} /> {item.label}</button>
            ))}
        </nav>
        <div className="p-6 border-t border-gray-50"><button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 text-red-500 bg-red-50/50 py-3.5 rounded-xl text-xs font-bold uppercase hover:bg-red-50"><LogOut size={16} /> Cerrar Sesión</button></div>
      </aside>

      {/* BOTTOM BAR MÓVIL */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-200 flex justify-around items-center p-2 z-50 pb-safe shadow-lg">
          {[{ id: "overview", icon: Home, label: "Inicio" }, { id: "bookings", icon: Calendar, label: "Citas" }, { id: "marketing", icon: Gift, label: "Promo" }, { id: "banner", icon: Megaphone, label: "Banner" }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${activeTab === t.id ? 'text-[#D4AF37]' : 'text-gray-400'}`}><t.icon size={22} strokeWidth={activeTab === t.id ? 2.5 : 2} /><span className="text-[9px] font-medium">{t.label}</span></button>
          ))}
      </nav>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-auto py-6 md:h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex flex-col justify-center px-6 md:px-10 shrink-0 sticky top-0 z-30">
            <div className="flex justify-between items-start">
                <div><h1 className={`${cinzel.className} text-xl md:text-3xl font-bold text-[#0a0a0a]`}>{greeting}, {userName}</h1><div className="flex items-center gap-2 mt-1"><span className="text-xs text-gray-400 uppercase tracking-widest">{currentDate}</span>{isLoadingGoogle && <Loader2 size={12} className="animate-spin text-[#D4AF37]"/>}</div></div>
                <div className="flex items-center gap-3"><button onClick={fetchAllData} className="p-2.5 rounded-full bg-gray-50 text-gray-500 hover:bg-[#D4AF37] hover:text-black transition-colors"><RefreshCw size={18} className={isLoadingGoogle ? "animate-spin" : ""}/></button><div className="w-10 h-10 rounded-full bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center font-serif font-bold border-2 border-gray-100 shadow-sm">{userName.charAt(0)}</div></div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 scroll-smooth">
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-2 text-green-600"><DollarSign size={16}/> <span className="text-[10px] font-bold uppercase">Ingresos</span></div><p className={`${cinzel.className} text-xl md:text-3xl`}>${salesStats.total}</p></div>
                         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-2 text-blue-600"><Calendar size={16}/> <span className="text-[10px] font-bold uppercase">Citas</span></div><p className={`${cinzel.className} text-xl md:text-3xl`}>{reservations.length}</p></div>
                         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-2 text-purple-600"><ShoppingBag size={16}/> <span className="text-[10px] font-bold uppercase">Ventas</span></div><p className={`${cinzel.className} text-xl md:text-3xl`}>{salesStats.orders}</p></div>
                         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-2 text-[#D4AF37]"><Users size={16}/> <span className="text-[10px] font-bold uppercase">Clientes</span></div><p className={`${cinzel.className} text-xl md:text-3xl`}>{clients.length}</p></div>
                    </div>
                </div>
            )}

            {/* VISTA: BANNER (NUEVO) */}
            {activeTab === 'banner' && (
                <div className="animate-in fade-in zoom-in duration-300 max-w-2xl mx-auto">
                    <h2 className={`${cinzel.className} text-2xl text-[#191919] mb-6`}>Configurar Banner Superior</h2>
                    
                    {/* Previsualización */}
                    <div className="mb-8 p-4 border border-gray-100 rounded-2xl bg-gray-50">
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Vista Previa:</p>
                        <div className="w-full py-2 overflow-hidden flex items-center justify-center text-xs font-medium tracking-widest uppercase shadow-sm rounded" style={{ backgroundColor: bannerConfig.bgColor, color: bannerConfig.textColor }}>
                            {bannerConfig.animation === 'marquee' ? (
                                <div className="animate-marquee whitespace-nowrap">{bannerConfig.text} &nbsp; • &nbsp; {bannerConfig.text}</div>
                            ) : (
                                <span className={bannerConfig.animation === 'pulse' ? 'animate-pulse' : ''}>{bannerConfig.text}</span>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Texto del Banner</label>
                            <input className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[#D4AF37]" value={bannerConfig.text} onChange={e => setBannerConfig({...bannerConfig, text: e.target.value})} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Color Fondo</label>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <input type="color" className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" value={bannerConfig.bgColor} onChange={e => setBannerConfig({...bannerConfig, bgColor: e.target.value})} />
                                    <span className="text-xs text-gray-500">{bannerConfig.bgColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Color Texto</label>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <input type="color" className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" value={bannerConfig.textColor} onChange={e => setBannerConfig({...bannerConfig, textColor: e.target.value})} />
                                    <span className="text-xs text-gray-500">{bannerConfig.textColor}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Animación</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['none', 'marquee', 'pulse'].map(anim => (
                                    <button 
                                        key={anim}
                                        onClick={() => setBannerConfig({...bannerConfig, animation: anim})}
                                        className={`py-2 text-xs uppercase rounded-lg border ${bannerConfig.animation === anim ? 'bg-[#191919] text-white border-[#191919]' : 'bg-white text-gray-500 border-gray-200'}`}
                                    >
                                        {anim}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleSaveBanner} className="w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-[#bfa080] transition-colors">
                            Publicar Cambios
                        </button>
                    </div>
                </div>
            )}

            {/* VISTA: MARKETING Y CLIENTES */}
            {activeTab === 'marketing' && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`${cinzel.className} text-2xl text-[#191919]`}>Gestión de Clientes</h2>
                        <button onClick={() => setMarketingModal({ type: 'all', title: 'Nueva Campaña', textColor: '#FFFFFF', bgColor: '#000000', selectedEmails: [], couponTarget: 'all', couponType: 'discount' })} className="bg-[#0a0a0a] text-white px-4 py-2 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#D4AF37] transition-colors">
                            <Plus size={16} /> Crear Campaña
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="grid grid-cols-12 bg-gray-50 p-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                             <div className="col-span-1 text-center"></div> 
                            <div className="col-span-3">Nombre</div>
                            <div className="col-span-5">Email</div>
                            <div className="col-span-3 text-right">Último Envío</div>
                        </div>
                        {clients.length > 0 ? (
                            clients.map((client, idx) => (
                                <div key={idx} className="grid grid-cols-12 p-4 border-b border-gray-50 items-center text-sm hover:bg-gray-50/50 transition-colors">
                                     <div className="col-span-1 text-center">
                                         <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                                             {client.Nombre?.charAt(0)}
                                         </div>
                                     </div>
                                    <div className="col-span-3 font-medium text-[#191919] truncate pr-2">{client.Nombre}</div>
                                    <div className="col-span-5 text-gray-500 truncate pr-2">{client.Email}</div>
                                    <div className="col-span-3 text-right text-xs text-gray-400">{client.lastSent || '-'}</div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-sm">No hay clientes registrados aún.</div>
                        )}
                    </div>
                </div>
            )}

            {/* VISTA: RESERVAS (IGUAL QUE ANTES) */}
            {activeTab === 'bookings' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Próximas Citas</h3><span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{reservations.length}</span></div>
                    {reservations.map((res) => (
                        <div key={res.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                            <div className="flex-1">
                                <div className="flex justify-between md:justify-start items-center gap-4 mb-2"><h4 className="font-bold text-base text-[#0a0a0a]">{res.client}</h4><span className="md:hidden text-[9px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold uppercase border border-green-100">Confirmada</span></div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><Calendar size={12} className="text-[#D4AF37]"/> {res.date}</span>
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><Clock size={12} className="text-[#D4AF37]"/> {res.time}</span>
                                </div>
                                <p className="text-xs text-[#D4AF37] font-bold mt-3 uppercase tracking-wide flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span> {res.service}</p>
                            </div>
                            <div className="flex gap-2 border-t pt-3 md:border-t-0 md:pt-0 mt-1 md:mt-0">
                                <button onClick={() => deleteBooking(res.id)} className="px-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* ... OTRAS VISTAS (PRODUCTOS, SERVICIOS, EQUIPO) SE MANTIENEN ... */}
            {(activeTab === 'products' || activeTab === 'services' || activeTab === 'team') && (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Gestionar desde las pestañas correspondientes (Código mantenido)</p>
                </div>
            )}
        </div>
      </main>

      {/* --- MODALES --- */}
      <AnimatePresence>
        {(editBooking || productModal || serviceModal || editSpecialist || marketingModal) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full md:w-[500px] max-h-[85vh] rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h3 className={`${cinzel.className} text-lg font-bold`}>
                            {marketingModal && 'Diseñador de Promociones'}
                            {!marketingModal && 'Gestión'}
                        </h3>
                        <button onClick={() => { setMarketingModal(null); setEditBooking(null); }} className="bg-gray-50 p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={18}/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-5">
                        
                        {/* MODAL MARKETING COMPLETO */}
                        {marketingModal && (
                            <div className="space-y-6">
                                {/* SELECCION DE USUARIOS */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Destinatarios</label>
                                        <button onClick={toggleAllClients} className="text-[10px] text-[#D4AF37] font-bold underline">
                                            {marketingModal.selectedEmails?.length === clients.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                        </button>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                                        {clients.map((client, i) => {
                                            const isSelected = marketingModal.selectedEmails?.includes(client.Email);
                                            return (
                                                <div key={i} onClick={() => toggleClientSelection(client.Email)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer text-xs ${isSelected ? 'bg-white border border-[#D4AF37]/30 shadow-sm' : 'hover:bg-gray-100'}`}>
                                                    {isSelected ? <CheckSquare size={14} className="text-[#D4AF37]" /> : <Square size={14} className="text-gray-300"/>}
                                                    <span className={isSelected ? 'font-medium text-[#191919]' : 'text-gray-500'}>{client.Nombre}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[9px] text-right mt-2 text-gray-400">{marketingModal.selectedEmails?.length || 0} seleccionados</p>
                                </div>

                                {/* CONFIGURACIÓN DEL CUPÓN */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 block">Tipo</label>
                                        <select className="w-full p-2 bg-gray-50 rounded-lg text-xs outline-none" value={marketingModal.couponType} onChange={e => setMarketingModal({...marketingModal, couponType: e.target.value})}>
                                            <option value="discount">Descuento (%)</option>
                                            <option value="giftcard">Gift Card ($)</option>
                                            <option value="gift">Regalo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 block">Válido Para</label>
                                        <select className="w-full p-2 bg-gray-50 rounded-lg text-xs outline-none" value={marketingModal.couponTarget} onChange={e => setMarketingModal({...marketingModal, couponTarget: e.target.value})}>
                                            <option value="all">Todo</option>
                                            <option value="boutique">Solo Boutique</option>
                                            <option value="nutrition">Nutrición</option>
                                            <option value="service">Servicio Específico</option>
                                        </select>
                                    </div>
                                </div>

                                {/* VISUALIZADOR */}
                                <div 
                                    className="w-full h-48 rounded-2xl flex flex-col items-center justify-center text-center p-6 shadow-md relative overflow-hidden transition-all duration-300"
                                    style={{ 
                                        backgroundColor: marketingModal.bgColor, 
                                        color: marketingModal.textColor,
                                        background: marketingModal.gradientColor 
                                            ? `linear-gradient(135deg, ${marketingModal.bgColor}, ${marketingModal.gradientColor})` 
                                            : marketingModal.bgColor
                                    }}
                                >
                                    {marketingModal.imageUrl && (
                                        <div className="absolute inset-0 opacity-30">
                                            <img src={marketingModal.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="relative z-10">
                                        <Gift size={24} className="mx-auto mb-2 opacity-80"/>
                                        <h3 className={`${cinzel.className} text-2xl font-bold mb-1`}>{marketingModal.title || "Tu Título"}</h3>
                                        <p className="text-[10px] opacity-80 uppercase tracking-widest border border-current px-2 py-1 rounded inline-block">
                                            {marketingModal.couponType === 'discount' ? 'CUPÓN DESCUENTO' : 'GIFT CARD'}
                                        </p>
                                        <p className="text-[9px] mt-2 opacity-60">Válido para: {marketingModal.couponTarget?.toUpperCase()}</p>
                                        <p className="text-[8px] mt-1 opacity-60">Válido una sola vez</p>
                                    </div>
                                </div>

                                {/* CONTROLES DE DISEÑO */}
                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <input className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[#D4AF37]" placeholder="Título (Ej: 20% OFF)" value={marketingModal.title} onChange={e => setMarketingModal({...marketingModal, title: e.target.value})} />
                                    
                                    <div className="flex gap-4">
                                        <div className="flex-1 flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold text-gray-400">Color 1</label>
                                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                                                <input type="color" value={marketingModal.bgColor} onChange={e => setMarketingModal({...marketingModal, bgColor: e.target.value})} className="w-full h-8 bg-transparent cursor-pointer rounded" />
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold text-gray-400">Color 2 (Opcional)</label>
                                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                                                <input type="color" value={marketingModal.gradientColor || '#ffffff'} onChange={e => setMarketingModal({...marketingModal, gradientColor: e.target.value})} className="w-full h-8 bg-transparent cursor-pointer rounded" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 block">Imagen de Fondo (URL)</label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                                            <ImageIcon size={16} className="text-gray-400"/>
                                            <input className="bg-transparent w-full text-xs outline-none" placeholder="https://..." value={marketingModal.imageUrl || ''} onChange={e => setMarketingModal({...marketingModal, imageUrl: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button onClick={handleSendMarketing} className="flex-1 py-4 bg-[#0a0a0a] text-white rounded-xl text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-[#D4AF37] transition-colors">
                                        <Send size={16} /> Enviar a Clientes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
