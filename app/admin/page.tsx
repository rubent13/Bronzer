"use client";

import React, { useState, useEffect } from 'react';
// Nota: No importamos Image de next/image para usar img nativa y evitar bloqueos
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, Users, ShoppingBag, Sparkles, 
  LogOut, Plus, Trash2, Edit2, Search, CheckCircle, XCircle, 
  TrendingUp, DollarSign, Clock, Save, Phone, FileText, RefreshCw, Tag,
  Download, Loader2, Menu, X, Bell, ChevronRight, BarChart3, Home 
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
  
  // Estado Ventas
  const [salesStats, setSalesStats] = useState({ total: 0, orders: 0 });
  
  // Estado para las ventas mensuales
  const [monthlySales, setMonthlySales] = useState<number[]>(new Array(12).fill(0));
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);

  // Estados de Formularios
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  
  // --- MODALES ---
  const [editBooking, setEditBooking] = useState<any>(null); 
  const [editSpecialist, setEditSpecialist] = useState<any>(null); 
  
  // Modales Productos y Servicios
  const [productModal, setProductModal] = useState<any>(null); 
  const [serviceModal, setServiceModal] = useState<any>(null); 
  
  // Estado genérico para saber si estamos creando o editando
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
      // Activamos la carga de datos
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
      const [resCal, resProd, resTeam, resServ, resSales] = await Promise.all([
        fetch('/api/calendar'),
        fetch('/api/database?tab=Productos'),
        fetch('/api/database?tab=ESPECIALISTAS'),
        fetch('/api/database?tab=Servicios'),
        fetch('/api/database?tab=Ventas')
      ]);

      const [dataCal, dataProd, dataTeam, dataServ, dataSales] = await Promise.all([
        resCal.json(), resProd.json(), resTeam.json(), resServ.json(), resSales.json()
      ]);

      // --- CORRECCIÓN AQUÍ: Usamos los campos directos de tu API actualizada ---
      if (dataCal.success) {
        const googleBookings = dataCal.data.map((evt: any) => ({
            id: evt.id,
            // La API nueva ya devuelve los nombres limpios, no hay que parsear description
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
    // Confirmación actualizada
    if(!confirm("¿Eliminar cita de Google Calendar y la Base de Datos?")) return;
    
    setIsProcessing(true);
    try {
      // La API /api/calendar DELETE ya está configurada para borrar de ambos sitios
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
            </motion.div>
        </div>
    );
  }

  return (
    <div className={`h-screen flex bg-slate-50 overflow-hidden ${montserrat.className}`}>
      {!isAppInstalled && (deferredPrompt || isMobile) && (
        <motion.button initial={{ y: 100 }} animate={{ y: 0 }} transition={{ delay: 1 }} onClick={handleInstallClick} className="fixed bottom-24 right-6 z-[60] bg-[#D4AF37] text-black p-4 rounded-full shadow-lg md:hidden"><Download size={24}/></motion.button>
      )}

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
        </nav>
        <div className="p-6 border-t border-gray-50"><button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 text-red-500 bg-red-50/50 py-3.5 rounded-xl text-xs font-bold uppercase hover:bg-red-50"><LogOut size={16} /> Cerrar Sesión</button></div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-200 flex justify-around items-center p-2 z-50 pb-safe shadow-lg">
          {[{ id: "overview", icon: Home, label: "Inicio" }, { id: "bookings", icon: Calendar, label: "Citas" }, { id: "products", icon: ShoppingBag, label: "Inv" }, { id: "services", icon: Sparkles, label: "Serv" }, { id: "team", icon: Users, label: "Equipo" }].map(t => (
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
                         <div className="bg-[#0a0a0a] p-5 rounded-2xl shadow-lg text-white flex flex-col justify-center items-center text-center"><p className="text-[10px] text-[#D4AF37] uppercase tracking-widest mb-1">Estado</p><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> <span className="font-bold text-sm">Online</span></div></div>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-8"><h3 className={`${cinzel.className} text-lg md:text-xl flex items-center gap-2`}><BarChart3 size={20} className="text-[#D4AF37]"/> Rendimiento</h3><span className="text-xs bg-gray-50 px-3 py-1 rounded-full text-gray-500">2025</span></div>
                        <div className="h-40 md:h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
                             {monthlySales.map((amount, i) => {
                                 const max = Math.max(...monthlySales, 100);
                                 const h = Math.round((amount / max) * 100);
                                 const isActive = activeChartIndex === i;
                                 return (
                                 <div key={i} className="w-full flex flex-col justify-end group cursor-pointer relative" onClick={() => setActiveChartIndex(isActive ? null : i)} onMouseEnter={() => setActiveChartIndex(i)} onMouseLeave={() => setActiveChartIndex(null)}>
                                     {isActive && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">${amount}</div>}
                                     <div className={`w-full bg-gradient-to-t from-gray-100 to-gray-200 rounded-t-lg transition-all duration-300 ${isActive ? 'from-[#D4AF37] to-yellow-300' : ''}`} style={{ height: `${h || 5}%` }}></div>
                                 </div>
                             )})}
                        </div>
                        <div className="flex justify-between mt-4 text-[8px] md:text-[10px] text-gray-400 font-bold uppercase border-t border-gray-100 pt-4">{['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map(m => <span key={m}>{m}</span>)}</div>
                    </div>
                </div>
            )}

            {/* VISTA: RESERVAS */}
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
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><Users size={12}/> {res.specialist}</span>
                                </div>
                                <p className="text-xs text-[#D4AF37] font-bold mt-3 uppercase tracking-wide flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span> {res.service}</p>
                            </div>
                            <div className="flex gap-2 border-t pt-3 md:border-t-0 md:pt-0 mt-1 md:mt-0">
                                <button onClick={() => setEditBooking(res)} className="flex-1 md:flex-none bg-black text-white py-2.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-[#D4AF37] transition-colors">Gestionar</button>
                                <button onClick={() => deleteBooking(res.id)} className="px-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    {reservations.length === 0 && <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">No hay citas registradas.</div>}
                </div>
            )}

            {/* VISTA: PRODUCTOS */}
            {activeTab === 'products' && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <button onClick={openNewProductModal} className="w-full md:w-auto bg-black text-white px-6 py-4 rounded-xl text-xs uppercase tracking-widest mb-6 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform"><Plus size={16}/> Agregar Producto</button>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                        {products.map((prod, i) => (
                            <div key={i} onClick={() => openEditProductModal(prod)} className="bg-white p-2.5 md:p-4 rounded-2xl border border-gray-100 shadow-sm relative active:scale-95 transition-transform cursor-pointer">
                                <div className="aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden relative">
                                    {processGoogleImage(prod.img) ? <img src={processGoogleImage(prod.img)||''} className="w-full h-full object-cover"/> : <div className="h-full flex items-center justify-center text-gray-300"><ShoppingBag/></div>}
                                    {prod.stock < 5 && <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded font-bold shadow-sm">Low Stock</span>}
                                </div>
                                <h4 className="font-bold text-xs md:text-sm truncate text-gray-800">{prod.name}</h4>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-[#D4AF37] text-xs font-bold">${prod.price}</p>
                                    <p className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">x{prod.stock}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VISTA: SERVICIOS */}
            {activeTab === 'services' && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <button onClick={openNewServiceModal} className="w-full md:w-auto bg-black text-white px-6 py-4 rounded-xl text-xs uppercase tracking-widest mb-6 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform"><Plus size={16}/> Agregar Servicio</button>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                        {services.map((serv, i) => (
                            <div key={i} onClick={() => openEditServiceModal(serv)} className="bg-white p-3 md:p-5 rounded-2xl border border-gray-100 shadow-sm relative active:scale-95 transition-transform cursor-pointer flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-full flex items-center justify-center text-[#D4AF37] shrink-0">
                                            {processGoogleImage(serv.img) ? <img src={processGoogleImage(serv.img)||''} className="w-full h-full object-cover rounded-full"/> : <Sparkles size={14}/>}
                                        </div>
                                        <div className="absolute top-3 right-3 text-gray-300"><Edit2 size={12}/></div>
                                    </div>
                                    <h4 className="font-bold text-xs md:text-sm text-gray-800 leading-tight mb-1">{serv.name}</h4>
                                    <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-3">{serv.description}</p>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-2">
                                    <span className="text-[#D4AF37] font-bold text-sm">${serv.price}</span>
                                    <span className="text-[9px] bg-gray-50 px-2 py-1 rounded text-gray-500">{serv.duration}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VISTA: EQUIPO */}
            {activeTab === 'team' && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-end mb-4"><button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SHEET_ID || ''}`, '_blank')} className="text-xs text-gray-400 underline flex items-center gap-1 hover:text-black">Gestionar en Sheets <ChevronRight size={12}/></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {team.map((t, i) => (
                            <div key={i} onClick={() => setEditSpecialist(t)} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer active:bg-gray-50">
                                <div className="w-14 h-14 rounded-full bg-gray-50 overflow-hidden shrink-0 border-2 border-white shadow-md">
                                    {processGoogleImage(t.img) ? <img src={processGoogleImage(t.img)||''} className="w-full h-full object-cover"/> : <Users size={20} className="m-auto text-gray-300"/>}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">{t.name}</h4>
                                    <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wider">{t.role}</p>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1"><Clock size={10} /> {t.schedule || "N/A"}</div>
                                </div>
                                <div className="ml-auto text-gray-300"><Edit2 size={16}/></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </main>

      {/* --- MODALES UNIVERSALES --- */}
      <AnimatePresence>
        {(editBooking || productModal || serviceModal || editSpecialist) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full md:w-[500px] max-h-[85vh] rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h3 className={`${cinzel.className} text-lg font-bold`}>
                            {editBooking && 'Gestionar Cita'}
                            {productModal && (isCreating ? 'Nuevo Producto' : 'Editar Producto')}
                            {serviceModal && (isCreating ? 'Nuevo Servicio' : 'Editar Servicio')}
                            {editSpecialist && 'Perfil Especialista'}
                        </h3>
                        <button onClick={() => { setEditBooking(null); setProductModal(null); setServiceModal(null); setEditSpecialist(null); }} className="bg-gray-50 p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={18}/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-5">
                        {/* PRODUCTO */}
                        {productModal && (
                            <>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label><input className="w-full p-3 bg-gray-50 rounded-xl font-medium outline-none border border-transparent focus:border-[#D4AF37] transition-all" value={productModal.name} onChange={e => setProductModal({...productModal, name: e.target.value})} /></div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Precio</label><input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={productModal.price} onChange={e => setProductModal({...productModal, price: e.target.value})} /></div>
                                    <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Stock</label><input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={productModal.stock} onChange={e => setProductModal({...productModal, stock: e.target.value})} /></div>
                                </div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Descripción</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={productModal.description} onChange={e => setProductModal({...productModal, description: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Promoción</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={productModal.promotion} onChange={e => setProductModal({...productModal, promotion: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Link Imagen</label><input className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" value={productModal.img} onChange={e => setProductModal({...productModal, img: e.target.value})} /></div>
                                <button onClick={saveProduct} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl uppercase tracking-widest font-bold text-xs mt-4 hover:bg-[#D4AF37] transition-colors">{isProcessing ? 'Guardando...' : 'Guardar Cambios'}</button>
                            </>
                        )}
                        
                        {/* SERVICIO */}
                        {serviceModal && (
                             <>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label><input className="w-full p-3 bg-gray-50 rounded-xl font-medium outline-none" value={serviceModal.name} onChange={e => setServiceModal({...serviceModal, name: e.target.value})} /></div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Precio</label><input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={serviceModal.price} onChange={e => setServiceModal({...serviceModal, price: e.target.value})} /></div>
                                    <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Duración</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={serviceModal.duration} onChange={e => setServiceModal({...serviceModal, duration: e.target.value})} /></div>
                                </div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Categoría</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={serviceModal.category} onChange={e => setServiceModal({...serviceModal, category: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Link Imagen</label><input className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" value={serviceModal.img} onChange={e => setServiceModal({...serviceModal, img: e.target.value})} /></div>
                                
                                {/* SELECTOR DE ESPECIALISTAS */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Especialistas (Separar por comas)</label>
                                    <div className="flex gap-2">
                                        <input className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" value={serviceModal.specialists || ''} onChange={e => setServiceModal({...serviceModal, specialists: e.target.value})} placeholder="Ej: Dra. Elena, Lic. Sofia" />
                                        <select className="p-3 bg-gray-100 rounded-xl text-xs outline-none w-1/3" onChange={(e) => { if(e.target.value) setServiceModal({...serviceModal, specialists: serviceModal.specialists ? `${serviceModal.specialists}, ${e.target.value}` : e.target.value}); }} value="">
                                            <option value="">+ Add</option>
                                            {team.map((t:any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <button onClick={saveService} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl uppercase tracking-widest font-bold text-xs mt-4">Guardar</button>
                            </>
                        )}

                        {/* CITA */}
                        {editBooking && (
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Fecha</label><input type="date" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editBooking.date} onChange={e => setEditBooking({...editBooking, date: e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Hora</label><input type="time" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editBooking.time} onChange={e => setEditBooking({...editBooking, time: e.target.value})} /></div>
                                <button onClick={saveBookingEdit} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl uppercase tracking-widest font-bold text-xs mt-4">Confirmar Reprogramación</button>
                            </div>
                        )}

                        {/* ESPECIALISTA */}
                        {editSpecialist && (
                             <>
                                <div className="flex justify-center mb-4"><div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-100"><img src={processGoogleImage(editSpecialist.img)||''} className="w-full h-full object-cover"/></div></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editSpecialist.name} onChange={e => setEditSpecialist({...editSpecialist, name: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Rol</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editSpecialist.role} onChange={e => setEditSpecialist({...editSpecialist, role: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Horario</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editSpecialist.schedule} onChange={e => setEditSpecialist({...editSpecialist, schedule: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Servicios (Separados por coma)</label><textarea className="w-full p-3 bg-gray-50 rounded-xl outline-none h-20 text-xs" value={editSpecialist.services || ''} onChange={e => setEditSpecialist({...editSpecialist, services: e.target.value})} placeholder="Maderoterapia, Facial..." /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Link Foto</label><input className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" value={editSpecialist.img} onChange={e => setEditSpecialist({...editSpecialist, img: e.target.value})} /></div>
                                <button onClick={saveSpecialistEdit} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl uppercase tracking-widest font-bold text-xs mt-4">Guardar Perfil</button>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
