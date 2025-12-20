"use client";

import React, { useState, useEffect } from 'react';
// Nota: No importamos Image de next/image para usar img nativa y evitar bloqueos
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, Users, ShoppingBag, Sparkles, 
  LogOut, Plus, Trash2, Edit2, Search, CheckCircle, XCircle, 
  TrendingUp, DollarSign, Clock, Save, Phone, FileText, RefreshCw, Tag,
  Download, Loader2, Menu, X, Bell, ChevronRight, BarChart3 // Iconos Menu, X, Bell, ChevronRight, BarChart3
} from 'lucide-react';
import { Cinzel, Montserrat } from 'next/font/google';

// --- FUENTES ---
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '600', '700'] });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['300', '400', '500', '600'] });

// --- DATOS INICIALES (VACÍOS) ---
const INITIAL_RESERVATIONS: any[] = [];
const INITIAL_PRODUCTS: any[] = [];
const INITIAL_TEAM: any[] = [];
const INITIAL_SERVICES: any[] = []; // NUEVO

export default function AdminPanel() {
  // --- ESTADOS ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false); 
  
  // Estado Sidebar Móvil
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  
  // Estados de Datos
  const [reservations, setReservations] = useState<any[]>(INITIAL_RESERVATIONS);
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);
  const [team, setTeam] = useState<any[]>(INITIAL_TEAM);
  const [services, setServices] = useState<any[]>(INITIAL_SERVICES); 
  
  // Estado Ventas
  const [salesStats, setSalesStats] = useState({ total: 0, orders: 0 });

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

  // --- NUEVOS ESTADOS: PWA Y CARGA INICIAL ---
  // Controla la pantalla de carga (isDataReady ya está declarado más arriba)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null); // Evento de instalación PWA
  const [isAppInstalled, setIsAppInstalled] = useState(false); // Estado de instalación
  const [isMobile, setIsMobile] = useState(false); // Detector de móvil
  const [userName, setUserName] = useState('Admin'); // Nombre a mostrar en header

  // Fecha Actual
  const currentDate = new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });

  // --- LOGIN ---
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


  // --- PWA & RESIZE ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);

    if (window.matchMedia('(display-mode: standalone)').matches) setIsAppInstalled(true);

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

  // Función del botón de instalar
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        // Fallback para iOS (que no permite prompt automático)
        alert("📲 Para instalar en iPhone/iPad:\n1. Toca el botón 'Compartir' (cuadrado con flecha).\n2. Busca y selecciona 'Añadir a pantalla de inicio'.");
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        setDeferredPrompt(null);
    }
  };

  // --- FUNCIÓN BLINDADA: PROCESAR IMÁGENES DE GOOGLE DRIVE ---
  const processGoogleImage = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    
    let id = null;
    // Formato 1: .../d/EL_ID/...
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) id = matchD[1];
    // Formato 2: ...id=EL_ID...
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
      // 1. Cargar Citas (Google Calendar)
      const resCal = await fetch('/api/calendar'); 
      const dataCal = await resCal.json();
      if (dataCal.success) {
        const googleBookings = dataCal.data.map((evt: any) => {
          const getVal = (key: string) => {
             const regex = new RegExp(`${key}: (.*)`, 'i');
             const match = evt.description?.match(regex);
             return match ? match[1] : '';
          };
          const dateObj = new Date(evt.start);
          return {
            id: evt.id,
            client: getVal('Cliente') || evt.title.replace('CITA: ', '').split('(')[0],
            phone: getVal('Teléfono') || '---',
            note: getVal('Nota') || '',
            service: getVal('Servicio') || 'Servicio General',
            specialist: getVal('Especialista') || '---',
            date: dateObj.toISOString().split('T')[0], 
            time: dateObj.toLocaleTimeString('es-VE', {hour: '2-digit', minute:'2-digit', hour12: false}), 
            status: 'Confirmado'
          };
        });
        setReservations(googleBookings);
      }

      // 2. Cargar Productos (Google Sheets)
      const resProd = await fetch('/api/database?tab=Productos');
      const dataProd = await resProd.json();
      if (dataProd.success) setProducts(dataProd.data);

      // 3. Cargar Equipo (Google Sheets)
      const resTeam = await fetch('/api/database?tab=ESPECIALISTAS'); 
      const dataTeam = await resTeam.json();
      if (dataTeam.success) setTeam(dataTeam.data);

      // 4. Cargar Servicios (NUEVO - Google Sheets)
      const resServ = await fetch('/api/database?tab=Servicios');
      const dataServ = await resServ.json();
      if (dataServ.success) setServices(dataServ.data);

      // 5. Cargar Ventas (Google Sheets)
      const resSales = await fetch('/api/database?tab=Ventas');
      const dataSales = await resSales.json();
      if (dataSales.success) {
        const salesData = dataSales.data;
        const totalAmount = salesData.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);
        setSalesStats({ total: totalAmount, orders: salesData.length });
      }

    } catch (error) {
      console.error("Error sincronizando datos:", error);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // NUEVO: Carga inicial asíncrona que bloquea la interfaz hasta terminar
      const initData = async () => {
        await fetchAllData();
        setIsDataReady(true); // Solo mostramos el admin cuando todo cargó
      };
      initData();

      const interval = setInterval(fetchAllData, 30000); 
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // --- LÓGICA DE RESERVAS (PUT/DELETE) ---
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
        alert("✅ Cita actualizada en Google Calendar.");
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
    if(!confirm("¿Estás seguro? Se eliminará de Google Calendar.")) return;
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
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LÓGICA DE PRODUCTOS ---
  const openNewProductModal = () => {
      setIsCreating(true);
      setProductModal({ 
          id: `PROD-${Date.now().toString().slice(-6)}`, 
          name: '', price: 0, stock: 1, img: '', description: '', promotion: '' 
      });
  };

  const openEditProductModal = (prod: any) => {
      setIsCreating(false);
      setProductModal(prod);
  };

  const saveProduct = async () => {
      if (!productModal) return;
      setIsProcessing(true);

      const rowData = [
          productModal.id, productModal.name, productModal.price, productModal.stock,
          productModal.img, productModal.description || '', productModal.promotion || ''
      ];

      try {
          const method = isCreating ? 'POST' : 'PUT';
          const body = isCreating 
            ? { tab: 'Productos', data: rowData }
            : { tab: 'Productos', rowIndex: productModal.rowIndex, data: rowData };

          const res = await fetch('/api/database', {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          });

          const data = await res.json();
          if (data.success) {
              alert(isCreating ? "✅ Producto Creado." : "✅ Producto Actualizado.");
              setProductModal(null);
              fetchAllData();
          } else {
              alert("Error: " + data.error);
          }
      } catch (e) { alert("Error conexión"); } 
      finally { setIsProcessing(false); }
  };

  // --- LÓGICA DE SERVICIOS (NUEVO) ---
  const openNewServiceModal = () => {
      setIsCreating(true);
      setServiceModal({ 
          id: `S-${Date.now().toString().slice(-6)}`, 
          name: '', price: 0, duration: '60 min', category: 'General', description: '', img: '' 
      });
  };

  const openEditServiceModal = (serv: any) => {
      setIsCreating(false);
      setServiceModal(serv);
  };

  const saveService = async () => {
      if (!serviceModal) return;
      setIsProcessing(true);

      // Array ordenado para Excel: [ID, Nombre, Precio, Duracion, Categoria, Descripcion, Imagen]
      const rowData = [
          serviceModal.id, serviceModal.name, serviceModal.price, serviceModal.duration,
          serviceModal.category, serviceModal.description || '', serviceModal.img || ''
      ];

      try {
          const method = isCreating ? 'POST' : 'PUT';
          const body = isCreating 
            ? { tab: 'Servicios', data: rowData }
            : { tab: 'Servicios', rowIndex: serviceModal.rowIndex, data: rowData };

          const res = await fetch('/api/database', {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          });

          const data = await res.json();
          if (data.success) {
              alert(isCreating ? "✅ Servicio Creado." : "✅ Servicio Actualizado.");
              setServiceModal(null);
              fetchAllData();
          } else {
              alert("Error: " + data.error);
          }
      } catch (e) { alert("Error conexión"); } 
      finally { setIsProcessing(false); }
  };

  // --- LÓGICA DE ESPECIALISTAS ---
  const saveSpecialistEdit = async () => {
    if (!editSpecialist) return;
    setIsProcessing(true);
    
    const rowData = [
        editSpecialist.id, editSpecialist.name, editSpecialist.role, editSpecialist.img,
        editSpecialist.schedule, editSpecialist.specialty || '', editSpecialist.experience || '', editSpecialist.certified || ''
    ];

    try {
        const res = await fetch('/api/database', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                tab: 'ESPECIALISTAS', 
                rowIndex: editSpecialist.rowIndex, 
                data: rowData 
            })
        });
        const data = await res.json();
        if (data.success) {
            alert("✅ Especialista actualizado.");
            setEditSpecialist(null);
            fetchAllData(); 
        } else {
            alert("Error al guardar: " + data.error);
        }
    } catch (error) {
        alert("Error de conexión");
    } finally {
        setIsProcessing(false);
    }
  };

  const deleteProduct = (id: number) => {
    if(confirm("Para eliminar, hazlo desde Google Sheets.")) {
       // Manual delete reminder
    }
  };

  // --- RENDER ---
  if (!isAuthenticated) {
    return (
      <div className={`h-screen w-full bg-[#050505] flex items-center justify-center ${montserrat.className}`}>
        <div className="bg-white p-12 w-full max-w-md text-center shadow-2xl border-t-4 border-[#D4AF37]">
          <h1 className={`${cinzel.className} text-3xl mb-2`}>BRONZER</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-8">Panel Administrativo</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Usuario" className="w-full p-4 bg-gray-50 border border-gray-200 outline-none" value={loginData.user} onChange={e => setLoginData({...loginData, user: e.target.value})} />
            <input type="password" placeholder="Contraseña" className="w-full p-4 bg-gray-50 border border-gray-200 outline-none" value={loginData.pass} onChange={e => setLoginData({...loginData, pass: e.target.value})} />
            <button className="w-full bg-black text-white py-4 uppercase tracking-widest text-xs hover:bg-[#D4AF37] transition-colors">Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  if (isAuthenticated && !isDataReady) {
    return (
        <div className={`h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center text-white ${montserrat.className}`}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
                <Loader2 size={40} className="animate-spin text-[#D4AF37]" />
                <h2 className={`${cinzel.className} text-xl tracking-widest text-[#D4AF37]`}>CARGANDO SYSTEM...</h2>
            </motion.div>
        </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F8F9FA] flex ${montserrat.className}`}>
      
      {/* PWA install button removed per user preference */}

      {/* --- SIDEBAR RESPONSIVE (LEFT NAV) --- */}
      {/* Overlay para cerrar en móvil */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />}
      
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col shadow-2xl md:shadow-none
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
          <span className={`${cinzel.className} text-xl tracking-widest`}>BRONZER<span className="text-[#D4AF37]">.</span></span>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400"><X size={24}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <p className="text-[10px] uppercase text-gray-400 font-bold px-4 mb-2 mt-4">Principal</p>
            {[
                { id: "overview", label: "Dashboard", icon: LayoutDashboard },
                { id: "bookings", label: "Reservas", icon: Calendar },
            ].map(item => (
                <button key={item.id} onClick={() => {setActiveTab(item.id); setIsSidebarOpen(false)}} 
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${activeTab === item.id ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <item.icon size={18} /> {item.label}
                </button>
            ))}

            <p className="text-[10px] uppercase text-gray-400 font-bold px-4 mb-2 mt-6">Gestión</p>
            {[
                { id: "services", label: "Servicios", icon: Sparkles },
                { id: "products", label: "Inventario", icon: ShoppingBag },
                { id: "team", label: "Equipo", icon: Users },
            ].map(item => (
                <button key={item.id} onClick={() => {setActiveTab(item.id); setIsSidebarOpen(false)}} 
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${activeTab === item.id ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <item.icon size={18} /> {item.label}
                </button>
            ))}
        </div>

        <div className="p-4 border-t border-gray-100">
            <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 text-red-500 bg-red-50 py-3 rounded-xl text-xs font-bold uppercase hover:bg-red-100 transition-colors">
                <LogOut size={16} /> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ml-0 md:ml-64 flex-1 p-8 md:p-12 pb-24 transition-all duration-300">
        
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-10 shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-black"><Menu size={24}/></button>
                <h2 className={`${cinzel.className} text-lg md:text-2xl truncate`}>
                    {activeTab === 'overview' && 'Visión General'}
                    {activeTab === 'bookings' && 'Citas Agendadas'}
                    {activeTab === 'services' && 'Catálogo de Servicios'}
                    {activeTab === 'products' && 'Inventario'}
                    {activeTab === 'team' && 'Equipo Profesional'}
                </h2>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={fetchAllData} className={`p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-black hover:text-white transition-all ${isLoadingGoogle ? 'animate-spin' : ''}`}>
                    <RefreshCw size={18} />
                </button>
                <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                </div>
                <div className="flex items-center gap-3 ml-2">
                    <div className="w-10 h-10 rounded-full bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center font-serif font-bold border-2 border-gray-100 shadow-sm">{userName?.charAt(0)?.toUpperCase()}</div>
                    <div className="flex flex-col text-sm leading-none">
                        <span className="font-medium text-gray-800">{userName}</span>
                        <span className="text-[10px] text-gray-400">{currentDate}</span>
                    </div>
                </div>
            </div>
        </header>

        {/* --- VISTA: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4"><div className="p-3 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20} /></div><span className="text-green-500 text-xs font-bold">Sheets</span></div>
                <h3 className="text-gray-400 text-xs uppercase tracking-widest">Ingresos Totales</h3>
                <p className={`${cinzel.className} text-3xl mt-2`}>${salesStats.total}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20} /></div><span className="text-blue-500 text-xs font-bold">Calendar</span></div>
                <h3 className="text-gray-400 text-xs uppercase tracking-widest">Citas Agendadas</h3>
                <p className={`${cinzel.className} text-3xl mt-2`}>{reservations.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><ShoppingBag size={20} /></div></div>
                <h3 className="text-gray-400 text-xs uppercase tracking-widest">Ventas Registradas</h3>
                <p className={`${cinzel.className} text-3xl mt-2`}>{salesStats.orders}</p>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`${cinzel.className} text-lg md:text-xl flex items-center gap-2`}><BarChart3 size={20} className="text-[#D4AF37]"/> Rendimiento Anual</h3>
                    <span className="text-xs bg-gray-50 px-3 py-1 rounded-full text-gray-500">2025</span>
                </div>
                <div className="h-40 md:h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
                    {[35,50,45,70,85,65,90,100,80,60,75,95].map((h,i)=>(
                        <div key={i} className="w-full flex flex-col justify-end group cursor-pointer">
                            <div className="w-full bg-gradient-to-t from-gray-100 to-gray-200 group-hover:from-[#D4AF37] group-hover:to-yellow-300 rounded-t-lg transition-all duration-300 relative" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">${h}k</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 text-[9px] md:text-[10px] text-gray-400 font-bold uppercase border-t border-gray-100 pt-4">
                    {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map(m => <span key={m}>{m}</span>)}
                </div>
            </div>
          </div>
        )}

        {/* --- VISTA: RESERVAS --- */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Cliente','Contacto','Servicio','Fecha/Hora','Especialista','Nota','Acciones'].map(h => (
                    <th key={h} className="p-6 text-xs uppercase tracking-widest text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-400">{isLoadingGoogle ? 'Sincronizando...' : 'No hay citas.'}</td></tr>
                ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-6 font-medium">{res.client}</td>
                    <td className="p-6 text-sm text-gray-600"><div className="flex items-center gap-2"><Phone size={14} className="text-[#D4AF37]" /> {res.phone}</div></td>
                    <td className="p-6 text-sm text-gray-600">{res.service}</td>
                    <td className="p-6 text-sm text-gray-600"><div className="flex items-center gap-2"><Calendar size={14} className="text-[#D4AF37]" /> {res.date} <Clock size={14} className="text-[#D4AF37] ml-2" /> {res.time}</div></td>
                    <td className="p-6 text-sm text-gray-600">{res.specialist}</td>
                    <td className="p-6 text-sm text-gray-500 italic max-w-[150px] truncate" title={res.note}>{res.note || '-'}</td>
                    <td className="p-6 flex gap-3">
                      <button onClick={() => setEditBooking(res)} className="text-gray-400 hover:text-black"><Edit2 size={18} /></button>
                      <button onClick={() => deleteBooking(res.id)} className="text-gray-400 hover:text-red-500"><XCircle size={18} /></button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VISTA: SERVICIOS (NUEVO APARTADO) --- */}
        {activeTab === 'services' && (
          <div>
            <div className="flex justify-end mb-6 gap-3">
              <button onClick={openNewServiceModal} className="bg-black text-white px-6 py-3 text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#D4AF37] transition-colors">
                  <Plus size={16} /> Nuevo Servicio
              </button>
              <button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SHEET_ID || ''}`, '_blank')} className="border border-gray-300 text-gray-600 px-6 py-3 text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  <Plus size={16} /> Excel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((serv, i) => {
                const imgUrl = processGoogleImage(serv.img);
                return (
                  <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm group relative flex flex-col">
                    <button onClick={() => openEditServiceModal(serv)} className="absolute top-4 right-4 text-gray-300 hover:text-black z-10"><Edit2 size={16} /></button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                            {imgUrl ? <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Sparkles size={20} className="text-[#D4AF37]" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{serv.name}</h3>
                            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded uppercase text-gray-500 font-bold">{serv.category}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-50 pt-4 mt-auto">
                        <span className="text-[#D4AF37] font-serif font-bold text-lg">${serv.price}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded"><Clock size={12} /> {serv.duration}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VISTA: PRODUCTOS --- */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-end mb-6 gap-3">
              <button onClick={openNewProductModal} className="bg-black text-white px-6 py-3 text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#D4AF37] transition-colors">
                  <Plus size={16} /> Nuevo Producto
              </button>
              <button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SHEET_ID || ''}`, '_blank')} className="border border-gray-300 text-gray-600 px-6 py-3 text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  <Plus size={16} /> Excel
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-h-[50vh] md:max-h-none overflow-y-auto">
              {products.map((prod, i) => {
                const imgUrl = processGoogleImage(prod.img);
                return (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group relative hover:shadow-lg hover:-translate-y-1 transition-transform">
                    <button onClick={() => openEditProductModal(prod)} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md text-gray-400 hover:text-black z-10"><Edit2 size={14} /></button>
                    <div className="relative h-36 md:h-48 bg-gray-100 rounded-lg overflow-hidden mb-4">
                      {prod.promotion && <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 flex items-center gap-1"><Tag size={10} /> {prod.promotion}</div>}
                      {imgUrl ? <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="flex items-center justify-center h-full text-gray-300 text-xs">Sin Imagen</div>}
                    </div>
                    <h3 className="font-medium truncate">{prod.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-[#D4AF37] font-bold">${prod.price}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Stock: {prod.stock}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VISTA: EQUIPO --- */}
        {activeTab === 'team' && (
          <div>
             <div className="flex justify-end mb-6">
              <button onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SHEET_ID || ''}`, '_blank')} className="bg-black text-white px-6 py-3 text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#D4AF37] transition-colors"><Plus size={16} /> Editar en Excel</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {team.map((member, i) => {
                const imgUrl = processGoogleImage(member.img);
                return (
                  <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 relative group">
                    <button onClick={() => setEditSpecialist(member)} className="absolute top-4 right-4 text-gray-300 hover:text-black z-10"><Edit2 size={16} /></button>
                    <div className="w-16 h-16 rounded-full overflow-hidden relative bg-gray-200 shrink-0">
                      {imgUrl ? <img src={imgUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="flex items-center justify-center h-full w-full text-[10px] text-gray-400">Sin Foto</div>}
                    </div>
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-xs text-[#D4AF37] uppercase font-bold mb-1">{member.role}</p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded"><Clock size={10} /> {member.schedule || "Sin horario"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL EDITAR RESERVA --- */}
      <AnimatePresence>
        {editBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl">
              <h3 className={`${cinzel.className} text-xl mb-6`}>Reprogramar Cita</h3>
              <div className="space-y-4">
                <div><label className="text-xs text-gray-500 uppercase">Fecha</label><input type="date" className="w-full border border-gray-200 p-3 rounded mt-1" value={editBooking.date} onChange={(e) => setEditBooking({...editBooking, date: e.target.value})} /></div>
                <div><label className="text-xs text-gray-500 uppercase">Hora</label><input type="time" className="w-full border border-gray-200 p-3 rounded mt-1" value={editBooking.time} onChange={(e) => setEditBooking({...editBooking, time: e.target.value})} /></div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setEditBooking(null)} className="flex-1 py-3 text-sm text-gray-500 hover:bg-gray-50 rounded">Cancelar</button>
                <button onClick={saveBookingEdit} disabled={isProcessing} className="flex-1 py-3 bg-black text-white text-sm uppercase tracking-widest hover:bg-[#D4AF37] rounded disabled:opacity-50">{isProcessing ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL DE PRODUCTOS --- */}
      <AnimatePresence>
        {productModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                    <h3 className={`${cinzel.className} text-xl mb-6`}>{isCreating ? 'Nuevo Producto' : 'Editar Producto'}</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs text-gray-500 uppercase font-bold">Nombre del Producto</label><input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50" value={productModal.name} onChange={(e) => setProductModal({...productModal, name: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs text-gray-500 uppercase font-bold">Precio ($)</label><input type="number" className="w-full border p-3 rounded mt-1 bg-gray-50" value={productModal.price} onChange={(e) => setProductModal({...productModal, price: e.target.value})} /></div>
                            <div><label className="text-xs text-gray-500 uppercase font-bold">Stock</label><input type="number" className="w-full border p-3 rounded mt-1 bg-gray-50" value={productModal.stock} onChange={(e) => setProductModal({...productModal, stock: e.target.value})} /></div>
                        </div>
                        <div><label className="text-xs text-gray-500 uppercase font-bold">Descripción Breve</label><input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50" placeholder="Ej: Crema hidratante facial..." value={productModal.description} onChange={(e) => setProductModal({...productModal, description: e.target.value})} /></div>
                        <div><label className="text-xs text-gray-500 uppercase font-bold">Promoción (Opcional)</label><input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50" placeholder="Ej: 20% OFF" value={productModal.promotion} onChange={(e) => setProductModal({...productModal, promotion: e.target.value})} /></div>
                        <div><label className="text-xs text-gray-500 uppercase font-bold">Imagen (Enlace de Google Drive)</label><input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50 text-xs" value={productModal.img} onChange={(e) => setProductModal({...productModal, img: e.target.value})} /></div>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setProductModal(null)} className="flex-1 py-3 text-sm text-gray-500 hover:bg-gray-50 rounded">Cancelar</button>
                        <button onClick={saveProduct} disabled={isProcessing} className="flex-1 py-3 bg-black text-white text-sm uppercase tracking-widest hover:bg-[#D4AF37] rounded disabled:opacity-50">
                            {isProcessing ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL DE SERVICIOS (NUEVO) --- */}
      <AnimatePresence>
        {serviceModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                    <h3 className={`${cinzel.className} text-xl mb-6`}>{isCreating ? 'Nuevo Servicio' : 'Editar Servicio'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Nombre del Servicio</label>
                            <input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50" value={serviceModal.name} onChange={(e) => setServiceModal({...serviceModal, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Precio ($)</label>
                                <input type="number" className="w-full border p-3 rounded mt-1 bg-gray-50" value={serviceModal.price} onChange={(e) => setServiceModal({...serviceModal, price: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Duración</label>
                                <input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50" placeholder="Ej: 60 min" value={serviceModal.duration} onChange={(e) => setServiceModal({...serviceModal, duration: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Categoría</label>
                            <input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50" placeholder="Ej: Facial, Corporal" value={serviceModal.category} onChange={(e) => setServiceModal({...serviceModal, category: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Descripción</label>
                            <textarea className="w-full border p-3 rounded mt-1 bg-gray-50 h-24" placeholder="Detalles del tratamiento..." value={serviceModal.description} onChange={(e) => setServiceModal({...serviceModal, description: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Imagen (Enlace de Google Drive)</label>
                            <input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50 text-xs" value={serviceModal.img} onChange={(e) => setServiceModal({...serviceModal, img: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setServiceModal(null)} className="flex-1 py-3 text-sm text-gray-500 hover:bg-gray-50 rounded">Cancelar</button>
                        <button onClick={saveService} disabled={isProcessing} className="flex-1 py-3 bg-black text-white text-sm uppercase tracking-widest hover:bg-[#D4AF37] rounded disabled:opacity-50">
                            {isProcessing ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL EDITAR ESPECIALISTA --- */}
      <AnimatePresence>
        {editSpecialist && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className={`${cinzel.className} text-xl mb-6`}>Editar Especialista</h3>
              
              <div className="flex justify-center mb-6">
                 <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden relative border border-gray-200">
                    {processGoogleImage(editSpecialist.img) ? (
                        <img src={processGoogleImage(editSpecialist.img) || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : <div className="flex items-center justify-center h-full text-xs text-gray-400">Sin Foto</div>}
                 </div>
              </div>

              <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Nombre Completo</label>
                    <input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50" value={editSpecialist.name} onChange={(e) => setEditSpecialist({...editSpecialist, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Rol / Título</label>
                        <input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50" value={editSpecialist.role} onChange={(e) => setEditSpecialist({...editSpecialist, role: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Horario</label>
                        <input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50" value={editSpecialist.schedule} onChange={(e) => setEditSpecialist({...editSpecialist, schedule: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Enlace de Foto (Google Drive)</label>
                    <input type="text" className="w-full border p-3 rounded mt-1 bg-gray-50 text-xs" value={editSpecialist.img} onChange={(e) => setEditSpecialist({...editSpecialist, img: e.target.value})} />
                    <p className="text-[10px] text-gray-400 mt-1">Asegúrate de que la foto en Drive sea "Pública para cualquiera con el enlace".</p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={() => setEditSpecialist(null)} className="flex-1 py-3 text-sm text-gray-500 hover:bg-gray-50 rounded">Cancelar</button>
                <button onClick={saveSpecialistEdit} disabled={isProcessing} className="flex-1 py-3 bg-black text-white text-sm uppercase tracking-widest hover:bg-[#D4AF37] rounded disabled:opacity-50">
                    {isProcessing ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
