"use client";

import React, { useState, useEffect } from 'react';
// Nota: No importamos Image de next/image para usar img nativa y evitar bloqueos
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ShoppingBag, 
  Sparkles, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Save, 
  Phone, 
  FileText, 
  RefreshCw, 
  Tag,
  Download,   // Nuevo
  Loader2,    // Nuevo
  Menu,       // Nuevo
  X,          // Nuevo
  Home,       // Nuevo
  BarChart3,   // Nuevo
  ChevronRight // Nuevo
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
  // --- ESTADOS ORIGINALES ---
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
  
  // AGREGAR ESTO: Estado para las ventas mensuales (array de 12 posiciones iniciadas en 0)
  const [monthlySales, setMonthlySales] = useState<number[]>(new Array(12).fill(0));

  // AGREGAR ESTA LÍNEA: Controla qué barra se está tocando en el móvil
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);

  // Estados de Formularios
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  
  // --- MODALES ORIGINALES ---
  const [editBooking, setEditBooking] = useState<any>(null); 
  const [editSpecialist, setEditSpecialist] = useState<any>(null); 
  
  // Modales Productos y Servicios
  const [productModal, setProductModal] = useState<any>(null); 
  const [serviceModal, setServiceModal] = useState<any>(null); 
  
  // Estado genérico para saber si estamos creando o editando
  const [isCreating, setIsCreating] = useState(false);

  // --- NUEVOS ESTADOS (PARA EL DISEÑO PWA Y CARGA) ---
  const [isDataReady, setIsDataReady] = useState(false); // Pantalla de carga inicial
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Menú lateral móvil
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null); // Instalación PWA
  const [isAppInstalled, setIsAppInstalled] = useState(false); // Estado PWA
  const [isMobile, setIsMobile] = useState(false); // Detector Móvil
  const [userName, setUserName] = useState('Admin'); // Nombre Usuario

  // Fecha Actual
  const currentDate = new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });
  
  // Saludo según la hora
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
      setIsDataReady(true); // Datos listos, ocultar pantalla de carga
    } else {
      alert("Credenciales Incorrectas");
    }
  };

  // --- DETECTAR PWA Y RESIZE ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); // Check inicial
    window.addEventListener('resize', handleResize);

    // Detectar si está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsAppInstalled(true);
    }

    // Capturar evento de instalación
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
        // Calcular totales generales
        const totalAmount = salesData.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);
        setSalesStats({ total: totalAmount, orders: salesData.length });

        // AGREGAR ESTO: Lógica para agrupar ventas por mes
        const salesByMonth = new Array(12).fill(0);
        salesData.forEach((sale: any) => {
            // Asegúrate que en tu Google Sheet la columna de fecha se llame 'date' o 'fecha'
            const saleDate = new Date(sale.date || sale.fecha || new Date()); 
            if (!isNaN(saleDate.getTime())) {
                const monthIndex = saleDate.getMonth(); // 0 = Enero, 11 = Diciembre
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
      // Si entramos y no hay datos, forzamos carga
      if (!isDataReady) {
         fetchAllData().then(() => setIsDataReady(true));
      }
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
          name: '', price: 0, duration: '60 min', category: 'General', description: '', img: '',
          specialists: '' // Campo para guardar especialistas asignados (separados por comas)
      });
  };

  const openEditServiceModal = (serv: any) => {
      setIsCreating(false);
      setServiceModal(serv);
  };

  const saveService = async () => {
      if (!serviceModal) return;
      setIsProcessing(true);

      // Array ordenado para Excel: [ID, Nombre, Precio, Duracion, Categoria, Descripcion, Imagen, ESPECIALISTAS]
      const rowData = [
          serviceModal.id, serviceModal.name, serviceModal.price, serviceModal.duration,
          serviceModal.category, serviceModal.description || '', serviceModal.img || '',
          serviceModal.specialists || '' // Columna para especialistas asignados
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
        editSpecialist.schedule, editSpecialist.specialty || '', editSpecialist.experience || '', editSpecialist.certified || '', editSpecialist.services || ''
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

  // --- RENDERIZADO DE PANTALLAS ---

  // 1. PANTALLA DE LOGIN
  if (!isAuthenticated) {
    return (
      <div className={`h-screen w-full bg-[#050505] flex items-center justify-center ${montserrat.className}`}>
        <div className="bg-white/10 backdrop-blur-md p-10 w-full max-w-sm text-center shadow-2xl border border-white/20 rounded-3xl">
          <h1 className={`${cinzel.className} text-4xl mb-2 text-[#D4AF37]`}>BRONZER</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-8">Admin Access</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
                type="text" 
                placeholder="ID Usuario" 
                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none text-center focus:border-[#D4AF37] transition-colors" 
                value={loginData.user} 
                onChange={e => setLoginData({...loginData, user: e.target.value})} 
            />
            <input 
                type="password" 
                placeholder="PIN de Acceso" 
                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none text-center focus:border-[#D4AF37] transition-colors" 
                value={loginData.pass} 
                onChange={e => setLoginData({...loginData, pass: e.target.value})} 
            />
            <button className="w-full bg-[#D4AF37] text-black py-4 uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-white transition-colors mt-4">
                Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. PANTALLA DE CARGA (NUEVO)
  // Se muestra solo si está autenticado pero los datos no han terminado de cargar
  if (isAuthenticated && !isDataReady) {
    return (
        <div className={`h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center text-white ${montserrat.className}`}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.5 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="flex flex-col items-center gap-6"
            >
                <Loader2 size={40} className="animate-spin text-[#D4AF37]" />
                <h2 className={`${cinzel.className} text-2xl tracking-widest text-[#D4AF37]`}>CARGANDO DATOS...</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Google Cloud</p>
            </motion.div>
        </div>
    );
  }

  // 3. DASHBOARD PRINCIPAL
  return (
    <div className={`h-screen flex bg-slate-50 overflow-hidden ${montserrat.className}`}>
      
      {/* BOTÓN FLOTANTE PARA INSTALAR APP (SOLO MÓVIL Y NO INSTALADA) */}
      {!isAppInstalled && (deferredPrompt || isMobile) && (
        <motion.button 
          initial={{ y: 100 }} animate={{ y: 0 }} transition={{ delay: 1 }}
          onClick={handleInstallClick}
          className="fixed bottom-24 right-6 z-[60] bg-[#D4AF37] text-black p-4 rounded-full shadow-[0_10px_30px_rgba(212,175,55,0.4)] flex items-center gap-3 text-xs font-bold uppercase tracking-widest border-2 border-white hover:scale-105 active:scale-95 transition-all md:hidden"
        >
          <Download size={24}/>
        </motion.button>
      )}

      {/* --- SIDEBAR (PC) --- */}
      <aside className="w-72 bg-white border-r border-gray-100 h-screen hidden md:flex flex-col z-20 shadow-sm">
        <div className="h-24 flex items-center justify-center border-b border-gray-50">
          <span className={`${cinzel.className} text-2xl tracking-widest font-bold`}>BRONZER<span className="text-[#D4AF37]">.</span></span>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            <p className="text-[10px] uppercase text-gray-400 font-bold px-4 mb-2 mt-2">Principal</p>
            {[{ id: "overview", label: "Dashboard", icon: LayoutDashboard }, { id: "bookings", label: "Reservas", icon: Calendar }].map(item => (
                <button key={item.id} onClick={() => {setActiveTab(item.id)}} 
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm rounded-xl transition-all ${activeTab === item.id ? 'bg-[#0a0a0a] text-white shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <item.icon size={18} className={activeTab === item.id ? "text-[#D4AF37]" : ""} /> {item.label}
                </button>
            ))}

            <p className="text-[10px] uppercase text-gray-400 font-bold px-4 mb-2 mt-6">Gestión</p>
            {[{ id: "services", label: "Servicios", icon: Sparkles }, { id: "products", label: "Inventario", icon: ShoppingBag }, { id: "team", label: "Equipo", icon: Users }].map(item => (
                <button key={item.id} onClick={() => {setActiveTab(item.id)}} 
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm rounded-xl transition-all ${activeTab === item.id ? 'bg-[#0a0a0a] text-white shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <item.icon size={18} className={activeTab === item.id ? "text-[#D4AF37]" : ""} /> {item.label}
                </button>
            ))}
        </nav>

        <div className="p-6 border-t border-gray-50">
            <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 text-red-500 bg-red-50/50 py-3.5 rounded-xl text-xs font-bold uppercase hover:bg-red-50 transition-colors">
                <LogOut size={16} /> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* --- BARRA DE NAVEGACIÓN INFERIOR (MÓVIL) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-200 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
          {[{ id: "overview", icon: Home, label: "Inicio" }, { id: "bookings", icon: Calendar, label: "Citas" }, { id: "products", icon: ShoppingBag, label: "Inv" }, { id: "services", icon: Sparkles, label: "Serv" }, { id: "team", icon: Users, label: "Equipo" }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === t.id ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                  <t.icon size={22} strokeWidth={activeTab === t.id ? 2.5 : 2} />
                  <span className="text-[9px] font-medium">{t.label}</span>
              </button>
          ))}
      </nav>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-auto py-6 md:h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex flex-col justify-center px-6 md:px-10 shrink-0 sticky top-0 z-30">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className={`${cinzel.className} text-xl md:text-3xl font-bold text-[#0a0a0a]`}>
                        {greeting}, {userName}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 uppercase tracking-widest">{currentDate}</span>
                        {isLoadingGoogle && <Loader2 size={12} className="animate-spin text-[#D4AF37]"/>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={fetchAllData} className="p-2.5 rounded-full bg-gray-50 text-gray-500 hover:bg-[#D4AF37] hover:text-black transition-colors">
                        <RefreshCw size={18} className={isLoadingGoogle ? "animate-spin" : ""}/>
                     </button>
                     <div className="w-10 h-10 rounded-full bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center font-serif font-bold border-2 border-gray-100 shadow-sm">
                        {userName.charAt(0)}
                     </div>
                </div>
            </div>
        </header>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 scroll-smooth">
            
            {/* VISTA: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100">
                            <div className="flex items-center gap-2 mb-2 text-green-600"><DollarSign size={16}/> <span className="text-[10px] font-bold uppercase">Ingresos</span></div>
                            <p className={`${cinzel.className} text-xl md:text-3xl`}>€{salesStats.total}</p>
                         </div>
                         <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100">
                            <div className="flex items-center gap-2 mb-2 text-blue-600"><Calendar size={16}/> <span className="text-[10px] font-bold uppercase">Citas</span></div>
                            <p className={`${cinzel.className} text-xl md:text-3xl`}>{reservations.length}</p>
                         </div>
                         <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100">
                            <div className="flex items-center gap-2 mb-2 text-purple-600"><ShoppingBag size={16}/> <span className="text-[10px] font-bold uppercase">Ventas</span></div>
                            <p className={`${cinzel.className} text-xl md:text-3xl`}>{salesStats.orders}</p>
                         </div>
                         <div className="bg-[#0a0a0a] p-5 rounded-2xl shadow-lg text-white flex flex-col justify-center items-center text-center">
                            <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest mb-1">Estado</p>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> <span className="font-bold text-sm">Online</span></div>
                         </div>
                    </div>

                    {/* Gráfica Moderna (Compatible con Táctil) */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                        {/* Decoración de fondo */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent rounded-bl-full pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div>
                                <h3 className={`${cinzel.className} text-lg md:text-xl flex items-center gap-2 text-[#0a0a0a]`}>
                                    <BarChart3 size={20} className="text-[#D4AF37]" /> Rendimiento Financiero
                                </h3>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Flujo de caja mensual</p>
                            </div>
                            <span className="text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600">2025</span>
                        </div>

                        {/* Contenedor de las Barras */}
                        <div className="h-56 md:h-64 flex items-end justify-between gap-2 md:gap-4 px-2 relative z-10">
                             {monthlySales.map((amount, i) => {
                                 const maxSales = Math.max(...monthlySales, 100);
                                 const heightPercentage = Math.round((amount / maxSales) * 100);
                                 const isActive = activeChartIndex === i; // ¿Esta barra está activa?
                                 
                                 return (
                                     <div 
                                        key={i} 
                                        className="w-full flex flex-col justify-end group cursor-pointer h-full relative"
                                        onClick={() => setActiveChartIndex(isActive ? null : i)} // Tocar para ver/ocultar en móvil
                                        onMouseEnter={() => setActiveChartIndex(i)} // Hover en PC
                                        onMouseLeave={() => setActiveChartIndex(null)} // Salir en PC
                                     >
                                         {/* Tooltip: Aparece si está activo (click/hover) */}
                                         <div className={`
                                            transition-all duration-200 absolute -top-2 left-1/2 -translate-x-1/2 
                                            bg-[#0a0a0a] text-[#D4AF37] text-[10px] font-bold py-1 px-2 rounded-md shadow-xl z-20 whitespace-nowrap mb-2 
                                            transform -translate-y-full pointer-events-none
                                            ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                                         `}>
                                            €{amount.toLocaleString()}
                                         </div>
                                         
                                         {/* Barra Animada */}
                                         <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden h-full flex items-end">
                                             <motion.div 
                                                initial={{ height: 0 }} 
                                                animate={{ height: `${heightPercentage}%` }} 
                                                transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 }}
                                                className={`w-full relative transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}
                                             >
                                                {/* Gradiente */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37] to-[#F2D06B]"></div>
                                                {/* Brillo superior */}
                                                <div className="absolute top-0 left-0 w-full h-[2px] bg-white/60"></div>
                                             </motion.div>
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>

                        {/* Etiquetas de los meses */}
                        <div className="flex justify-between mt-4 text-[8px] md:text-[10px] text-gray-400 font-bold uppercase border-t border-gray-100 pt-4 relative z-10">
                             {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => (
                                <span key={i} className={`text-center w-full transition-colors ${activeChartIndex === i ? 'text-[#D4AF37]' : ''}`}>{m}</span>
                             ))}
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA: RESERVAS */}
            {activeTab === 'bookings' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Próximas Citas</h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{reservations.length}</span>
                    </div>
                    {reservations.map((res) => (
                        <div key={res.id} className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                            <div className="flex-1">
                                <div className="flex justify-between md:justify-start items-center gap-4 mb-2">
                                    <h4 className="font-bold text-base text-[#0a0a0a]">{res.client}</h4>
                                    <span className="md:hidden text-[9px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold uppercase border border-green-100">Confirmada</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><Calendar size={12} className="text-[#D4AF37]"/> {res.date}</span>
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><Clock size={12} className="text-[#D4AF37]"/> {res.time}</span>
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><Users size={12}/> {res.specialist}</span>
                                </div>
                                <p className="text-xs text-[#D4AF37] font-bold mt-3 uppercase tracking-wide bg-[#D4AF37]/5 w-fit px-2 py-1 rounded">{res.service}</p>
                                {res.note && <p className="text-xs text-gray-400 mt-2 italic border-l-2 border-gray-200 pl-2">"{res.note}"</p>}
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

            {/* VISTA: PRODUCTOS (GRID 2 COLUMNAS MOVIL) */}
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
                                    <p className="text-[#D4AF37] text-xs font-bold">€{prod.price}</p>
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
                                    <span className="text-[#D4AF37] font-bold text-sm">€{serv.price}</span>
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
                            {productModal && 'Detalles del Producto'}
                            {serviceModal && 'Detalles del Servicio'}
                            {editSpecialist && 'Perfil Especialista'}
                        </h3>
                        <button onClick={() => { setEditBooking(null); setProductModal(null); setServiceModal(null); setEditSpecialist(null); }} className="bg-gray-50 p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={18}/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-5">
                        
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
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Descripción</label><textarea className="w-full p-3 bg-gray-50 rounded-xl h-24 outline-none" value={serviceModal.description} onChange={e => setServiceModal({...serviceModal, description: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Link Imagen</label><input className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" value={serviceModal.img} onChange={e => setServiceModal({...serviceModal, img: e.target.value})} /></div>

                                {/* --- MODIFICACIÓN: SELECTOR DE ESPECIALISTAS PARA EL SERVICIO --- */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Especialistas que realizan este servicio</label>
                                    <div className="flex gap-2">
                                        {/* Input donde se ven los nombres agregados */}
                                        <input 
                                            className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" 
                                            placeholder="Nombres de especialistas..." 
                                            value={serviceModal.specialists || ''} 
                                            onChange={(e) => setServiceModal({...serviceModal, specialists: e.target.value})} 
                                        />
                                        
                                        {/* Selector para agregar rápido */}
                                        <select 
                                            className="p-3 bg-gray-100 rounded-xl text-xs outline-none w-1/3"
                                            onChange={(e) => {
                                                if(e.target.value) {
                                                    const current = serviceModal.specialists || '';
                                                    const newValue = current ? `${current}, ${e.target.value}` : e.target.value;
                                                    setServiceModal({...serviceModal, specialists: newValue});
                                                }
                                            }}
                                            value=""
                                        >
                                            <option value="">+ Agregar</option>
                                            {team.map((t: any) => (
                                                <option key={t.id} value={t.name}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-1">Selecciona de la lista para añadir. (Ej: Dra. Elena, Lic. Sofia)</p>
                                </div>
                                {/* ---------------------------------------------------- */}

                                <button onClick={saveService} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl uppercase tracking-widest font-bold text-xs mt-4">Guardar</button>
                            </>
                        )}

                        {editBooking && (
                            <>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Fecha</label><input type="date" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editBooking.date} onChange={e => setEditBooking({...editBooking, date: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Hora</label><input type="time" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editBooking.time} onChange={e => setEditBooking({...editBooking, time: e.target.value})} /></div>
                                <button onClick={saveBookingEdit} disabled={isProcessing} className="w-full bg-black text-white py-4 rounded-xl uppercase tracking-widest font-bold text-xs mt-4">Confirmar Reprogramación</button>
                            </>
                        )}

                        {editSpecialist && (
                             <>
                                <div className="flex justify-center mb-4"><div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-100"><img src={processGoogleImage(editSpecialist.img)||''} className="w-full h-full object-cover"/></div></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editSpecialist.name} onChange={e => setEditSpecialist({...editSpecialist, name: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Rol</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editSpecialist.role} onChange={e => setEditSpecialist({...editSpecialist, role: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Horario</label><input className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={editSpecialist.schedule} onChange={e => setEditSpecialist({...editSpecialist, schedule: e.target.value})} /></div>
                                {/* --- NUEVO CAMPO PARA SERVICIOS (TEXTAREA) --- */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Tratamientos (Separar por comas)</label>
                                    <textarea 
                                        className="w-full p-3 bg-gray-50 rounded-xl outline-none h-20 text-xs" 
                                        placeholder="Ej: Maderoterapia, Facial, Laser" 
                                        value={editSpecialist.services || ''} 
                                        onChange={e => setEditSpecialist({...editSpecialist, services: e.target.value})} 
                                    />
                                </div>
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
