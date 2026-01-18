"use client";

import React, { useState, useEffect } from 'react';
// Nota: No importamos Image de next/image para usar img nativa y evitar bloqueos
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, Users, ShoppingBag, Sparkles, 
  LogOut, Plus, Trash2, Edit2, Search, CheckCircle, XCircle, 
  TrendingUp, DollarSign, Clock, Save, Phone, FileText, RefreshCw, Tag,
  Download, Loader2, Menu, X, Bell, ChevronRight, BarChart3, Home,
  // Iconos Nuevos para Marketing
  Gift, Palette, Image as ImageIcon, Send, Mail as MailIcon, 
  CheckSquare, Square, Megaphone, CreditCard, Percent, Target
} from 'lucide-react';
import { Cinzel, Montserrat } from 'next/font/google';

// --- FUENTES (Simuladas para evitar errores si no están configuradas en Next.js) ---
const cinzel = { className: 'font-serif' };
const montserrat = { className: 'font-sans' };

// --- DATOS INICIALES (VACÍOS) ---
const INITIAL_RESERVATIONS: any[] = [];
const INITIAL_PRODUCTS: any[] = [];
const INITIAL_TEAM: any[] = [];
const INITIAL_SERVICES: any[] = [];
const INITIAL_CLIENTS: any[] = []; // Nuevo

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
  const [clients, setClients] = useState<any[]>(INITIAL_CLIENTS); // Clientes Registrados
  
  // Estado Ventas
  const [salesStats, setSalesStats] = useState({ total: 0, orders: 0 });
  const [monthlySales, setMonthlySales] = useState<number[]>(new Array(12).fill(0));
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);

  // Estados de Formularios
  const [loginData, setLoginData] = useState({ user: "", pass: "" });

  // --- ESTADO BANNER (Sincronizado) ---
  const [bannerConfig, setBannerConfig] = useState({
    active: true,
    text: "Cargando configuración...",
    bgColor: "#96765A",
    textColor: "#FFFFFF",
    animation: "marquee" // 'none', 'marquee', 'pulse'
  });
  
  // --- MODALES ---
  const [editBooking, setEditBooking] = useState<any>(null); 
  const [editSpecialist, setEditSpecialist] = useState<any>(null); 
  const [productModal, setProductModal] = useState<any>(null); 
  const [serviceModal, setServiceModal] = useState<any>(null); 
  
  // Modales Marketing
  const [marketingModal, setMarketingModal] = useState<any>(null); 
  const [clientSearch, setClientSearch] = useState("");
  
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
      // 1. Cargar Configuración del Banner (Desde api/config)
      try {
        const resConfig = await fetch('/api/config');
        const dataConfig = await resConfig.json();
        if (dataConfig.success && dataConfig.data) {
            setBannerConfig(dataConfig.data);
        }
      } catch (e) { console.error("Error cargando config banner", e); }

      // 2. Cargar Datos de Tablas
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
            client: evt.client_name || evt.cliente || 'Cliente', 
            phone: evt.phone || '---',
            note: evt.note || '',
            service: evt.service || evt.servicio || 'Servicio',
            specialist: evt.specialist || evt.especialista || '---',
            date: evt.date || evt.fecha || '', 
            time: evt.time || evt.hora || '', 
            status: evt.status || 'Confirmado'
        }));
        setReservations(googleBookings);
      }

      if (dataProd.success) setProducts(dataProd.data);
      if (dataTeam.success) setTeam(dataTeam.data);
      if (dataServ.success) setServices(dataServ.data);
      
      // Guardar Clientes
      if (dataClients.success) {
          const loadedClients = dataClients.data.map((c: any) => ({
             ...c,
             Nombre: c.Nombre || c.nombre || 'Sin Nombre',
             Email: c.Email || c.email || 'Sin Email',
             lastSent: c.lastSent || '-' 
          }));
          setClients(loadedClients);
      }

      if (dataSales.success) {
        const salesData = dataSales.data;
        // Ajuste para leer "total" o "Monto" según venga del Excel
        const totalAmount = salesData.reduce((acc: number, curr: any) => acc + (Number(curr.total) || Number(curr.Monto) || 0), 0);
        setSalesStats({ total: totalAmount, orders: salesData.length });

        const salesByMonth = new Array(12).fill(0);
        salesData.forEach((sale: any) => {
            const saleDate = new Date(sale.date || sale.fecha || new Date()); 
            if (!isNaN(saleDate.getTime())) {
                const monthIndex = saleDate.getMonth();
                salesByMonth[monthIndex] += Number(sale.total) || Number(sale.Monto) || 0;
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

  // --- CRUD GENÉRICOS ---
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
    } catch (error) { alert("Error de conexión."); } 
    finally { setIsProcessing(false); }
  };

  const deleteBooking = async (id: any) => {
    if(!confirm("¿Eliminar cita?")) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReservations(reservations.filter(r => r.id !== id));
        alert("🗑️ Eliminada correctamente.");
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (error) { alert("Error de conexión."); } 
    finally { setIsProcessing(false); }
  };

  // Funciones de Producto
  const openNewProductModal = () => { setIsCreating(true); setProductModal({ id: `PROD-${Date.now()}`, name: '', price: 0, stock: 1, img: '' }); };
  const openEditProductModal = (prod: any) => { setIsCreating(false); setProductModal(prod); };
  const saveProduct = async () => {
      if (!productModal) return;
      setIsProcessing(true);
      const rowData = [productModal.id, productModal.name, productModal.price, productModal.stock, productModal.img, productModal.description || '', productModal.promotion || ''];
      try {
          const method = isCreating ? 'POST' : 'PUT';
          const body = isCreating ? { tab: 'Productos', data: rowData } : { tab: 'Productos', rowIndex: productModal.rowIndex, data: rowData };
          await fetch('/api/database', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          alert("✅ Guardado"); setProductModal(null); fetchAllData();
      } catch (e) { alert("Error"); } finally { setIsProcessing(false); }
  };

  // Funciones de Servicio
  const openNewServiceModal = () => { setIsCreating(true); setServiceModal({ id: `S-${Date.now()}`, name: '', price: 0, duration: '60 min', category: 'General', specialists: '' }); };
  const openEditServiceModal = (serv: any) => { setIsCreating(false); setServiceModal(serv); };
  const saveService = async () => {
      if (!serviceModal) return;
      setIsProcessing(true);
      const rowData = [serviceModal.id, serviceModal.name, serviceModal.price, serviceModal.duration, serviceModal.category, serviceModal.description || '', serviceModal.img || '', serviceModal.specialists || ''];
      try {
          const method = isCreating ? 'POST' : 'PUT';
          const body = isCreating ? { tab: 'Servicios', data: rowData } : { tab: 'Servicios', rowIndex: serviceModal.rowIndex, data: rowData };
          await fetch('/api/database', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          alert("✅ Guardado"); setServiceModal(null); fetchAllData();
      } catch (e) { alert("Error"); } finally { setIsProcessing(false); }
  };

  // Funciones de Especialista
  const saveSpecialistEdit = async () => {
    if (!editSpecialist) return;
    setIsProcessing(true);
    const rowData = [editSpecialist.id, editSpecialist.name, editSpecialist.role, editSpecialist.img, editSpecialist.schedule, editSpecialist.specialty || '', editSpecialist.experience || '', editSpecialist.certified || '', editSpecialist.services || ''];
    try {
        await fetch('/api/database', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tab: 'ESPECIALISTAS', rowIndex: editSpecialist.rowIndex, data: rowData }) });
        alert("✅ Guardado"); setEditSpecialist(null); fetchAllData();
    } catch (e) { alert("Error"); } finally { setIsProcessing(false); }
  };

  // --- NUEVAS FUNCIONES DE MARKETING (SINCRONIZADAS) ---
  
  const handleSaveBanner = async () => {
    setIsProcessing(true);
    try {
        // Guardar en la hoja CONFIG usando api/database que tiene lógica de limpieza
        const rowData = [
            bannerConfig.active ? "TRUE" : "FALSE",
            bannerConfig.text,
            bannerConfig.bgColor,
            bannerConfig.textColor,
            bannerConfig.animation
        ];
        
        await fetch('/api/database', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tab: 'CONFIG', data: rowData })
        });
        
        alert("✅ Banner actualizado exitosamente. Los cambios son visibles en la web.");
    } catch (error) {
        alert("Error al guardar banner");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSendMarketing = async () => {
      if (!marketingModal.selectedEmails || marketingModal.selectedEmails.length === 0) {
          alert("⚠️ Selecciona al menos un cliente.");
          return;
      }
      
      setIsProcessing(true);
      try {
          // Enviar un cupón a la hoja CUPONES por cada cliente
          const promises = marketingModal.selectedEmails.map((email: string) => {
              const rowData = [
                  email,
                  marketingModal.title,
                  marketingModal.couponType || 'discount',
                  marketingModal.couponValue || '0', 
                  marketingModal.couponTarget || 'all',
                  marketingModal.bgColor || '#000000',
                  marketingModal.textColor || '#FFFFFF',
                  marketingModal.imageUrl || ''
              ];
              
              return fetch('/api/database', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tab: 'CUPONES', data: rowData })
              });
          });

          await Promise.all(promises);

          const today = new Date().toLocaleDateString('es-VE');
          const updatedClients = clients.map(c => {
              if (marketingModal.selectedEmails.includes(c.Email)) return { ...c, lastSent: today };
              return c;
          });
          setClients(updatedClients);

          alert(`🎉 Promoción enviada a ${marketingModal.selectedEmails.length} clientes.`);
          setMarketingModal(null);
          setClientSearch("");
      } catch (error) {
          alert("Error enviando promociones.");
      } finally {
          setIsProcessing(false);
      }
  };

  // Helpers de selección
  const toggleClientSelection = (email: string) => {
      if (!marketingModal) return;
      const currentSelection = marketingModal.selectedEmails || [];
      const isSelected = currentSelection.includes(email);
      const newSelection = isSelected ? currentSelection.filter((e: string) => e !== email) : [...currentSelection, email];
      setMarketingModal({ ...marketingModal, selectedEmails: newSelection });
  };

  const toggleAllClients = () => {
      if (!marketingModal) return;
      const allSelected = marketingModal.selectedEmails?.length === clients.length;
      setMarketingModal({ ...marketingModal, selectedEmails: allSelected ? [] : clients.map(c => c.Email) });
  };

  const filteredClients = clients.filter(client => 
      (client.Nombre || "").toLowerCase().includes(clientSearch.toLowerCase()) || 
      (client.Email || "").toLowerCase().includes(clientSearch.toLowerCase())
  );

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
            
            {/* VISTA: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-2 text-green-600"><DollarSign size={16}/> <span className="text-[10px] font-bold uppercase">Ingresos</span></div><p className={`${cinzel.className} text-xl md:text-3xl`}>${salesStats.total}</p></div>
                         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-2 text-blue-600"><Calendar size={16}/> <span className="text-[10px] font-bold uppercase">Citas</span></div><p className={`${cinzel.className} text-xl md:text-3xl`}>{reservations.length}</p></div>
                         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-2 text-purple-600"><ShoppingBag size={16}/> <span className="text-[10px] font-bold uppercase">Ventas</span></div><p className={`${cinzel.className} text-xl md:text-3xl`}>{salesStats.orders}</p></div>
                         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-2 mb-2 text-[#D4AF37]"><Users size={16}/> <span className="text-[10px] font-bold uppercase">Clientes</span></div><p className={`${cinzel.className} text-xl md:text-3xl`}>{clients.length}</p></div>
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

            {/* VISTA: BANNER (NUEVO) */}
            {activeTab === 'banner' && (
                <div className="animate-in fade-in zoom-in duration-300 max-w-2xl mx-auto">
                    <h2 className={`${cinzel.className} text-2xl text-[#191919] mb-6`}>Configurar Banner Superior</h2>
                    
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

            {/* VISTA: MARKETING */}
            {activeTab === 'marketing' && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`${cinzel.className} text-2xl text-[#191919]`}>Gestión de Clientes</h2>
                        {/* BOTÓN CREAR CAMPAÑA */}
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
                                </div>
                                <p className="text-xs text-[#D4AF37] font-bold mt-3 uppercase tracking-wide flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span> {res.service}</p>
                            </div>
                            <div className="flex gap-2 border-t pt-3 md:border-t-0 md:pt-0 mt-1 md:mt-0">
                                <button onClick={() => setEditBooking(res)} className="flex-1 md:flex-none bg-black text-white py-2.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-[#D4AF37] transition-colors">Gestionar</button>
                                <button onClick={() => deleteBooking(res.id)} className="px-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
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
                                </div>
                                <div className="ml-auto text-gray-300"><Edit2 size={16}/></div>
                            </div>
                        ))}
                    </div>
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
                        <button onClick={() => { setMarketingModal(null); setEditBooking(null); setProductModal(null); setServiceModal(null); setEditSpecialist(null); }} className="bg-gray-50 p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={18}/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-5">
                        
                        {/* MODAL MARKETING COMPLETO */}
                        {marketingModal && (
                            <div className="space-y-6">
                                {/* SELECCION DE USUARIOS CON BUSCADOR */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Destinatarios</label>
                                        <button onClick={toggleAllClients} className="text-[10px] text-[#D4AF37] font-bold underline">
                                            {marketingModal.selectedEmails?.length === clients.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                        </button>
                                    </div>
                                    {/* LUPA DE BÚSQUEDA */}
                                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 mb-3">
                                        <Search size={14} className="text-gray-400" />
                                        <input 
                                            className="w-full text-xs outline-none text-gray-600 placeholder:text-gray-400" 
                                            placeholder="Buscar cliente..." 
                                            value={clientSearch}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                                        {/* Filtrado de clientes */}
                                        {filteredClients.map((client, i) => {
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

                                {/* INPUT DE VALOR (NUEVO) */}
                                {(marketingModal.couponType === 'discount' || marketingModal.couponType === 'giftcard') && (
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 block">
                                            {marketingModal.couponType === 'discount' ? 'Porcentaje de Descuento' : 'Monto Gift Card ($)'}
                                        </label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            {marketingModal.couponType === 'discount' ? <Percent size={14} className="text-[#D4AF37]"/> : <DollarSign size={14} className="text-[#D4AF37]"/>}
                                            <input 
                                                type="number" 
                                                className="bg-transparent w-full text-sm outline-none font-bold text-[#191919]" 
                                                placeholder={marketingModal.couponType === 'discount' ? '20' : '50.00'} 
                                                value={marketingModal.couponValue || ''} 
                                                onChange={e => setMarketingModal({...marketingModal, couponValue: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                )}

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
                                        {marketingModal.couponValue && (
                                            <p className="text-3xl font-black mb-2 tracking-tighter">
                                                {marketingModal.couponType === 'discount' ? `${marketingModal.couponValue}% OFF` : `$${marketingModal.couponValue}`}
                                            </p>
                                        )}
                                        <p className="text-[10px] opacity-80 uppercase tracking-widest border border-current px-2 py-1 rounded inline-block">
                                            {marketingModal.couponType === 'discount' ? 'CUPÓN DESCUENTO' : (marketingModal.couponType === 'giftcard' ? 'GIFT CARD' : 'REGALO')}
                                        </p>
                                        <p className="text-[9px] mt-2 opacity-60">Válido para: {marketingModal.couponTarget?.toUpperCase()}</p>
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
                        
                        {serviceModal && (
                             <>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label><input className="w-full p-3 bg-gray-50 rounded-xl font-medium outline-none" value={serviceModal.name} onChange={e => setServiceModal({...serviceModal, name: e.target.value})} /></div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Precio</label><input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={serviceModal.price} onChange={e => setServiceModal({...serviceModal, price: e.target.value})} /></div>
                                    <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Duración</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={serviceModal.duration} onChange={e => setServiceModal({...serviceModal, duration: e.target.value})} /></div>
                                </div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Categoría</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={serviceModal.category} onChange={e => setServiceModal({...serviceModal, category: e.target.value})} /></div>
                                
                                {/* SELECTOR DE ESPECIALISTAS */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Especialistas Asignados</label>
                                    <div className="flex gap-2">
                                        <input className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" value={serviceModal.specialists || ''} onChange={e => setServiceModal({...serviceModal, specialists: e.target.value})} placeholder="Ej: Dra. Elena, Lic. Sofia" />
                                        <select className="p-3 bg-gray-100 rounded-xl text-xs outline-none w-1/3" onChange={(e) => { if(e.target.value) setServiceModal({...serviceModal, specialists: serviceModal.specialists ? `${serviceModal.specialists}, ${e.target.value}` : e.target.value}); }}>
                                            <option value="">+ Add</option>
                                            {team.map((t:any) => <option key={t.id} value={t.name}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Link Imagen</label><input className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" value={serviceModal.img} onChange={e => setServiceModal({...serviceModal, img: e.target.value})} /></div>
                                <button onClick={saveService} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl uppercase tracking-widest font-bold text-xs mt-4">Guardar</button>
                            </>
                        )}

                        {editBooking && (
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Fecha</label><input type="date" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editBooking.date} onChange={e => setEditBooking({...editBooking, date: e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Hora</label><input type="time" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editBooking.time} onChange={e => setEditBooking({...editBooking, time: e.target.value})} /></div>
                                <button onClick={saveBookingEdit} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl uppercase tracking-widest font-bold text-xs mt-4">Confirmar Reprogramación</button>
                            </div>
                        )}

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
