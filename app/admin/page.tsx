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
  Download,   
  Loader2,    
  Menu,       
  X,          
  Home,       
  BarChart3,   
  ChevronRight,
  // --- NUEVOS ICONOS ---
  Gift,
  CheckSquare,
  Square,
  Image as ImageIcon,
  Send
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
// --- NUEVO ---
const INITIAL_CLIENTS: any[] = [];

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
  // --- NUEVO ESTADO DE CLIENTES ---
  const [clients, setClients] = useState<any[]>(INITIAL_CLIENTS);
  
  // Estado Ventas
  const [salesStats, setSalesStats] = useState({ total: 0, orders: 0 });
  const [monthlySales, setMonthlySales] = useState<number[]>(new Array(12).fill(0));
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);

  // Estados de Formularios
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  
  // --- MODALES ORIGINALES ---
  const [editBooking, setEditBooking] = useState<any>(null); 
  const [editSpecialist, setEditSpecialist] = useState<any>(null); 
  const [productModal, setProductModal] = useState<any>(null); 
  const [serviceModal, setServiceModal] = useState<any>(null); 
  
  // --- NUEVO MODAL DE MARKETING ---
  const [marketingModal, setMarketingModal] = useState(false);
  
  // Estado genérico para saber si estamos creando o editando
  const [isCreating, setIsCreating] = useState(false);

  // --- NUEVOS ESTADOS (PARA EL DISEÑO PWA Y CARGA) ---
  const [isDataReady, setIsDataReady] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null); 
  const [isAppInstalled, setIsAppInstalled] = useState(false); 
  const [isMobile, setIsMobile] = useState(false); 
  const [userName, setUserName] = useState('Admin'); 

  // --- NUEVOS ESTADOS PARA GESTIÓN DE CUPONES ---
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [couponConfig, setCouponConfig] = useState({
      type: 'discount',
      title: '¡SORPRESA!',
      value: '20%',
      code: 'BRONZER2025',
      bgColor: '#000000',
      color2: '#333333', // NUEVO: Segundo color para degradado
      isGradient: false, // NUEVO: Activar degradado
      textColor: '#D4AF37',
      message: 'Disfruta de este regalo exclusivo para ti.',
      customImage: null as string | null,
      scope: 'all', // NUEVO: 'all', 'service', 'product'
      selectedItem: '' // NUEVO: Nombre del servicio o producto
  });

  // Fecha Actual
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
      // 1. Cargar Citas
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

      // 2. Cargar Productos
      const resProd = await fetch('/api/database?tab=Productos');
      const dataProd = await resProd.json();
      if (dataProd.success) setProducts(dataProd.data);

      // 3. Cargar Equipo
      const resTeam = await fetch('/api/database?tab=ESPECIALISTAS'); 
      const dataTeam = await resTeam.json();
      if (dataTeam.success) setTeam(dataTeam.data);

      // 4. Cargar Servicios
      const resServ = await fetch('/api/database?tab=Servicios');
      const dataServ = await resServ.json();
      if (dataServ.success) setServices(dataServ.data);

      // --- NUEVO: 5. CARGAR CLIENTES REGISTRADOS ---
      const resClients = await fetch('/api/database?tab=Clientes Registrados');
      const dataClients = await resClients.json();
      if (dataClients.success) setClients(dataClients.data);

      // 6. Cargar Ventas
      const resSales = await fetch('/api/database?tab=Ventas');
      const dataSales = await resSales.json();
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
  }, [isAuthenticated]);

  // --- LÓGICA DE RESERVAS, PRODUCTOS, SERVICIOS, EQUIPO ---
  // (Mantengo estas funciones igual que en tu código original)
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

  const openNewServiceModal = () => {
      setIsCreating(true);
      setServiceModal({ 
          id: `S-${Date.now().toString().slice(-6)}`, 
          name: '', price: 0, duration: '60 min', category: 'General', description: '', img: '',
          specialists: ''
      });
  };

  const openEditServiceModal = (serv: any) => {
      setIsCreating(false);
      setServiceModal(serv);
  };

  const saveService = async () => {
      if (!serviceModal.name || !serviceModal.price) return alert("Completa los campos obligatorios");
      setIsProcessing(true);
      
      // --- CORRECCIÓN: ESTRUCTURA EXACTA DE 7 COLUMNAS (A-G) ---
      // Eliminamos 'specialists' de aquí para evitar el error "writing to column [H]"
      const rowData = [
          serviceModal.id,                  // A: ID
          serviceModal.name,                // B: Nombre
          serviceModal.price,               // C: Precio
          serviceModal.duration,            // D: Duración
          serviceModal.category,            // E: Categoría
          serviceModal.description || '',   // F: Descripción
          serviceModal.img || ''            // G: Imagen
      ];
      // ---------------------------------------------------------

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

  const saveSpecialistEdit = async () => {
    if (!editSpecialist) return;
    setIsProcessing(true);
    
    // CORRECCIÓN: Ajustado a 8 columnas exactas para coincidir con tu Excel (A-H)
    // Se eliminó la 9na columna que causaba el error y se fusionaron los servicios en la columna F.
    const rowData = [
        editSpecialist.id, 
        editSpecialist.name, 
        editSpecialist.role, 
        editSpecialist.img,
        editSpecialist.schedule, 
        editSpecialist.services || editSpecialist.specialty || '', // Col F: Aquí se guardan los tratamientos
        editSpecialist.experience || '', 
        editSpecialist.certified || ''
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

  // --- LÓGICA DE MARKETING (NUEVO) ---
  const handleSelectClient = (email: string) => {
      if (selectedClients.includes(email)) {
          setSelectedClients(selectedClients.filter(e => e !== email));
      } else {
          setSelectedClients([...selectedClients, email]);
      }
  };

  const handleSelectAll = () => {
      const visibleClients = clients.filter(c => 
          c.Nombre?.toLowerCase().includes(clientSearch.toLowerCase()) || 
          c.Email?.toLowerCase().includes(clientSearch.toLowerCase())
      );
      if (selectedClients.length === visibleClients.length && visibleClients.length > 0) {
          setSelectedClients([]);
      } else {
          setSelectedClients(visibleClients.map(c => c.Email));
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setCouponConfig({ ...couponConfig, customImage: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  // --- ACTUALIZACIÓN: LÓGICA REAL DE ENVÍO (GOOGLE SHEETS) ---
// --- EN ADMIN PANEL: ACTUALIZA ESTA FUNCIÓN ---
  const sendCampaign = async () => {
      if (selectedClients.length === 0) return alert("Selecciona al menos un cliente.");
      
      // Validación
      if (couponConfig.scope !== 'all' && !couponConfig.selectedItem) {
          return alert("Por favor selecciona el Servicio o Producto específico.");
      }
      
      setIsProcessing(true);

      try {
          const promises = selectedClients.map(async (email) => {
              
              // 1. PREPARAR EL FONDO (Color sólido o Gradient)
              const finalBg = couponConfig.isGradient 
                  ? `linear-gradient(135deg, ${couponConfig.bgColor}, ${couponConfig.color2})`
                  : couponConfig.bgColor;

              // 2. PREPARAR EL TARGET (Esto es lo vital para que funcione el descuento)
              // Guardaremos un formato especial: "TIPO|NOMBRE" (ej: "service|Nutricion")
              let targetValue = 'all';
              if (couponConfig.scope === 'service') targetValue = `service|${couponConfig.selectedItem}`;
              if (couponConfig.scope === 'product') targetValue = `product|${couponConfig.selectedItem}`;

              // 3. PREPARAR MENSAJE VISUAL
              let finalMessage = couponConfig.message;
              if (couponConfig.selectedItem) finalMessage += ` (Válido solo en: ${couponConfig.selectedItem})`;

              // Estructura Sheet: Email, Titulo, Tipo, Valor, Target, BgColor, Text, Color, Imagen
              const rowData = [
                  email,
                  couponConfig.title,
                  couponConfig.type,
                  couponConfig.value,
                  targetValue,   // <--- AQUÍ GUARDAMOS LA LÓGICA
                  finalBg,       
                  finalMessage,
                  couponConfig.textColor,
                  couponConfig.customImage || ''
              ];

              await fetch('/api/database', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      tab: 'cupones', 
                      data: rowData 
                  })
              });
          });

          await Promise.all(promises);
          alert(`✅ Campaña enviada. Los cupones funcionarán automáticamente para: ${couponConfig.selectedItem || 'Todo'}`);
          setMarketingModal(false);
          setSelectedClients([]);
          
      } catch (error) {
          console.error(error);
          alert("Error guardando.");
      } finally {
          setIsProcessing(false);
      }
  };

  // --- RENDERIZADO DE PANTALLAS ---

  if (!isAuthenticated) {
    return (
      <div className={`h-screen w-full bg-[#050505] flex items-center justify-center ${montserrat.className}`}>
        <div className="bg-white/10 backdrop-blur-md p-10 w-full max-w-sm text-center shadow-2xl border border-white/20 rounded-3xl">
          <h1 className={`${cinzel.className} text-4xl mb-2 text-[#D4AF37]`}>BRONZER</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-black-400 mb-8">Admin Access</p>
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

  return (
    <div className={`h-screen flex bg-slate-50 overflow-hidden ${montserrat.className}`}>
      
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
            <p className="text-[10px] uppercase text-black-400 font-bold px-4 mb-2 mt-2">Principal</p>
            {[{ id: "overview", label: "Dashboard", icon: LayoutDashboard }, { id: "bookings", label: "Reservas", icon: Calendar }].map(item => (
                <button key={item.id} onClick={() => {setActiveTab(item.id)}} 
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm rounded-xl transition-all ${activeTab === item.id ? 'bg-[#0a0a0a] text-white shadow-lg shadow-black/20' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <item.icon size={18} className={activeTab === item.id ? "text-[#D4AF37]" : ""} /> {item.label}
                </button>
            ))}

            <p className="text-[10px] uppercase text-black-400 font-bold px-4 mb-2 mt-6">Gestión</p>
            {[{ id: "services", label: "Servicios", icon: Sparkles }, { id: "products", label: "Inventario", icon: ShoppingBag }, { id: "team", label: "Equipo", icon: Users }, { id: "clients", label: "Clientes", icon: Users }].map(item => (
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
          {[{ id: "overview", icon: Home, label: "Inicio" }, { id: "bookings", icon: Calendar, label: "Citas" }, { id: "products", icon: ShoppingBag, label: "Inv" }, { id: "clients", icon: Users, label: "Clientes" }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === t.id ? 'text-[#D4AF37]' : 'text-black-400'}`}>
                  <t.icon size={22} strokeWidth={activeTab === t.id ? 2.5 : 2} />
                  <span className="text-[9px] font-medium">{t.label}</span>
              </button>
          ))}
      </nav>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        <header className="h-auto py-6 md:h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex flex-col justify-center px-6 md:px-10 shrink-0 sticky top-0 z-30">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className={`${cinzel.className} text-xl md:text-3xl font-bold text-[#0a0a0a]`}>
                        {greeting}, {userName}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-black-400 uppercase tracking-widest">{currentDate}</span>
                        {isLoadingGoogle && <Loader2 size={12} className="animate-spin text-[#D4AF37]"/>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={fetchAllData} className="p-2.5 rounded-full bg-gray-50 text-black-500 hover:bg-[#D4AF37] hover:text-black transition-colors">
                        <RefreshCw size={18} className={isLoadingGoogle ? "animate-spin" : ""}/>
                     </button>
                     <div className="w-10 h-10 rounded-full bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center font-serif font-bold border-2 border-gray-100 shadow-sm">
                        {userName.charAt(0)}
                     </div>
                </div>
            </div>
        </header>

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

                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
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
                        <div className="h-56 md:h-64 flex items-end justify-between gap-2 md:gap-4 px-2 relative z-10">
                             {monthlySales.map((amount, i) => {
                                 const maxSales = Math.max(...monthlySales, 100);
                                 const heightPercentage = Math.round((amount / maxSales) * 100);
                                 const isActive = activeChartIndex === i; 
                                 
                                 return (
                                     <div 
                                        key={i} 
                                        className="w-full flex flex-col justify-end group cursor-pointer h-full relative"
                                        onClick={() => setActiveChartIndex(isActive ? null : i)}
                                        onMouseEnter={() => setActiveChartIndex(i)} 
                                        onMouseLeave={() => setActiveChartIndex(null)}
                                     >
                                         <div className={`
                                            transition-all duration-200 absolute -top-2 left-1/2 -translate-x-1/2 
                                            bg-[#0a0a0a] text-[#D4AF37] text-[10px] font-bold py-1 px-2 rounded-md shadow-xl z-20 whitespace-nowrap mb-2 
                                            transform -translate-y-full pointer-events-none
                                            ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                                         `}>
                                            €{amount.toLocaleString()}
                                         </div>
                                         <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden h-full flex items-end">
                                             <motion.div 
                                                initial={{ height: 0 }} 
                                                animate={{ height: `${heightPercentage}%` }} 
                                                transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 }}
                                                className={`w-full relative transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}
                                             >
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37] to-[#F2D06B]"></div>
                                                <div className="absolute top-0 left-0 w-full h-[2px] bg-white/60"></div>
                                             </motion.div>
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
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

            {/* --- VISTA: CLIENTES (NUEVA) --- */}
            {activeTab === 'clients' && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h2 className={`${cinzel.className} text-xl md:text-2xl text-[#0a0a0a]`}>Base de Clientes</h2>
                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{clients.length} usuarios registrados</p>
                        </div>
                        
                        <button 
                            onClick={() => { setMarketingModal(true); setSelectedClients([]); }} 
                            className="bg-[#D4AF37] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-[#b5952f] transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
                        >
                            <Gift size={18} /> Crear Campaña
                        </button>
                    </div>

                    {/* Buscador */}
                    <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2 mb-6 max-w-md">
                        <Search size={18} className="text-gray-400 ml-2" />
                        <input 
                            placeholder="Buscar por nombre o email..." 
                            className="flex-1 p-2 outline-none text-sm text-gray-600"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                        />
                    </div>

                    {/* Grid Clientes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clients
                            .filter(c => c.Nombre?.toLowerCase().includes(clientSearch.toLowerCase()) || c.Email?.toLowerCase().includes(clientSearch.toLowerCase()))
                            .map((client, i) => (
                            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center font-bold text-lg shadow-md border-2 border-[#D4AF37]">
                                        {client.Nombre?.charAt(0) || 'C'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-gray-800 truncate">{client.Nombre || "Cliente Sin Nombre"}</h4>
                                        <p className="text-xs text-gray-400 truncate">{client.Email}</p>
                                        <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 rounded mt-1 inline-block border border-green-100">Activo</span>
                                    </div>
                                </div>
                                <div className="border-t border-gray-50 pt-3 flex gap-2">
                                    <button 
                                        onClick={() => { setSelectedClients([client.Email]); setMarketingModal(true); }}
                                        className="flex-1 bg-gray-50 text-black py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-[#D4AF37] hover:text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Gift size={14} /> Enviar Regalo
                                    </button>
                                </div>
                            </div>
                        ))}
                        {clients.length === 0 && <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed">No hay clientes registrados aún.</div>}
                    </div>
                </div>
            )}

        </div>
      </main>

      {/* --- MODALES --- */}
      <AnimatePresence>
        
{/* MODAL DE MARKETING */}
        {marketingModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
                    <button onClick={() => setMarketingModal(false)} className="absolute top-4 right-4 z-20 bg-black/10 p-2 rounded-full hover:bg-black/20"><X size={20}/></button>
                    
                    {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
                    <div className="w-full md:w-1/3 bg-gray-50 p-6 overflow-y-auto border-r border-gray-200">
                        <h3 className={`${cinzel.className} text-xl font-bold mb-6 text-[#0a0a0a]`}>Diseñar Campaña</h3>
                        
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Tipo</label>
                                <div className="flex gap-2">
                                    {['discount', 'gift', 'giftcard'].map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setCouponConfig({...couponConfig, type})}
                                            className={`flex-1 py-2 text-[10px] uppercase font-bold rounded-lg border ${couponConfig.type === type ? 'bg-[#0a0a0a] text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}
                                        >
                                            {type === 'discount' ? 'Desc.' : type === 'gift' ? 'Regalo' : 'Card'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* --- NUEVO: SELECTOR DE ALCANCE --- */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Aplicar a:</label>
                                <select 
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                                    value={couponConfig.scope}
                                    onChange={(e) => setCouponConfig({ ...couponConfig, scope: e.target.value, selectedItem: '' })}
                                >
                                    <option value="all">Todo el sitio / General</option>
                                    <option value="service">Servicio Específico</option>
                                    <option value="product">Producto Específico</option>
                                </select>
                            </div>

                            {couponConfig.scope !== 'all' && (
                                <div className="space-y-1 animate-in fade-in zoom-in">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Seleccionar {couponConfig.scope === 'service' ? 'Servicio' : 'Producto'}</label>
                                    <select 
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                                        value={couponConfig.selectedItem}
                                        onChange={(e) => setCouponConfig({ ...couponConfig, selectedItem: e.target.value })}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {couponConfig.scope === 'service' 
                                            ? services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                                            : products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)
                                        }
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Título</label><input className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm" value={couponConfig.title} onChange={e => setCouponConfig({...couponConfig, title: e.target.value})} /></div>
                            
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Valor (ej: 20%, 50€)</label><input className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm" value={couponConfig.value} onChange={e => setCouponConfig({...couponConfig, value: e.target.value})} /></div>
                            
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Código (Opcional)</label><input className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-mono tracking-widest uppercase" value={couponConfig.code} onChange={e => setCouponConfig({...couponConfig, code: e.target.value})} /></div>

                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Mensaje</label><textarea className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm h-20" value={couponConfig.message} onChange={e => setCouponConfig({...couponConfig, message: e.target.value})} /></div>

                            {/* --- NUEVO: COLORES CON DEGRADADO --- */}
                            <div className="space-y-2 pt-2 border-t border-gray-100 mt-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Estilo de Fondo</label>
                                    <label className="flex items-center gap-2 text-[10px] cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={couponConfig.isGradient} 
                                            onChange={(e) => setCouponConfig({...couponConfig, isGradient: e.target.checked})}
                                            className="accent-black"
                                        />
                                        Usar Degradado
                                    </label>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[9px] text-gray-400 uppercase">Color 1</label>
                                        <input type="color" className="w-full h-10 rounded-lg cursor-pointer border-0 p-0" value={couponConfig.bgColor} onChange={e => setCouponConfig({...couponConfig, bgColor: e.target.value})} />
                                    </div>
                                    
                                    {couponConfig.isGradient && (
                                        <div className="flex-1 space-y-1 animate-in fade-in slide-in-from-left-2">
                                            <label className="text-[9px] text-gray-400 uppercase">Color 2</label>
                                            <input type="color" className="w-full h-10 rounded-lg cursor-pointer border-0 p-0" value={couponConfig.color2} onChange={e => setCouponConfig({...couponConfig, color2: e.target.value})} />
                                        </div>
                                    )}

                                    <div className="flex-1 space-y-1">
                                        <label className="text-[9px] text-gray-400 uppercase">Texto</label>
                                        <input type="color" className="w-full h-10 rounded-lg cursor-pointer border-0 p-0" value={couponConfig.textColor} onChange={e => setCouponConfig({...couponConfig, textColor: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Imagen (Opcional)</label>
                                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <ImageIcon size={20} className="mx-auto text-gray-400 mb-1" />
                                    <p className="text-[10px] text-gray-500">Click para subir</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: PREVISUALIZACIÓN Y LISTA */}
                    <div className="w-full md:w-2/3 flex flex-col h-full">
                        
                        {/* 1. PREVISUALIZACIÓN */}
                        <div className="flex-1 bg-[#e5e5e5] p-8 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                            
                            <div 
                                className="relative w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center transition-all duration-300 overflow-hidden"
                                style={{ 
                                    // APLICA EL DEGRADADO O EL COLOR SÓLIDO
                                    background: couponConfig.isGradient 
                                        ? `linear-gradient(135deg, ${couponConfig.bgColor}, ${couponConfig.color2})`
                                        : couponConfig.bgColor, 
                                    color: couponConfig.textColor 
                                }}
                            >
                                {couponConfig.customImage && <img src={couponConfig.customImage} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                                
                                <div className="relative z-10">
                                    <p className="text-xs uppercase tracking-[0.3em] opacity-80 mb-4">Bronzer Exclusive</p>
                                    <h2 className={`${cinzel.className} text-3xl font-bold mb-2`}>{couponConfig.title}</h2>
                                    <div className="my-6 border-y border-current py-4 opacity-90">
                                        <p className="text-5xl font-bold">{couponConfig.value}</p>
                                        <p className="text-xs uppercase tracking-widest mt-1">
                                            {couponConfig.type === 'discount' ? 'Descuento' : couponConfig.type === 'gift' ? 'Regalo' : 'Gift Card'}
                                        </p>
                                    </div>
                                    <p className="text-sm font-light italic mb-2">"{couponConfig.message}"</p>
                                    
                                    {/* MUESTRA EL SERVICIO/PRODUCTO SI SE SELECCIONÓ */}
                                    {couponConfig.selectedItem && (
                                        <div className="mb-4">
                                            <span className="text-[9px] uppercase font-bold tracking-widest border border-current/30 px-2 py-1 rounded inline-block">
                                                Válido en: {couponConfig.selectedItem}
                                            </span>
                                        </div>
                                    )}

                                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/30 inline-block px-6">
                                        <p className="text-xs font-mono font-bold tracking-widest">{couponConfig.code}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. SELECCIÓN DE USUARIOS */}
                        <div className="h-1/3 bg-white border-t border-gray-200 flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white border border-gray-200 flex items-center rounded-lg px-2 py-1.5 w-40 md:w-60">
                                        <Search size={14} className="text-gray-400 mr-2"/>
                                        <input className="text-xs outline-none w-full" placeholder="Filtrar..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                                    </div>
                                    <button onClick={handleSelectAll} className="text-xs font-bold underline text-gray-500 hover:text-black">
                                        {selectedClients.length > 0 ? 'Deseleccionar' : 'Todos'}
                                    </button>
                                </div>
                                <span className="text-xs font-bold text-[#D4AF37]">{selectedClients.length} sel.</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {clients
                                        .filter(c => c.Nombre?.toLowerCase().includes(clientSearch.toLowerCase()) || c.Email?.toLowerCase().includes(clientSearch.toLowerCase()))
                                        .map((c, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => handleSelectClient(c.Email)}
                                            className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${selectedClients.includes(c.Email) ? 'bg-[#0a0a0a] border-black text-white' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                        >
                                            {selectedClients.includes(c.Email) ? <CheckSquare size={16} className="text-[#D4AF37]"/> : <Square size={16} className="text-gray-300"/>}
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold truncate">{c.Nombre}</p>
                                                <p className={`text-[9px] truncate ${selectedClients.includes(c.Email) ? 'text-gray-400' : 'text-gray-400'}`}>{c.Email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                                <button onClick={() => setMarketingModal(false)} className="px-6 py-3 rounded-xl text-xs font-bold uppercase text-gray-500 hover:bg-gray-100">Cancelar</button>
                                <button 
                                    onClick={sendCampaign}
                                    disabled={isProcessing}
                                    className="bg-[#D4AF37] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-[#b5952f] transition-all flex items-center gap-2"
                                >
                                    {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Enviar
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}

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
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Especialistas que realizan este servicio</label>
                                    <div className="flex gap-2">
                                        <input 
                                            className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" 
                                            placeholder="Nombres de especialistas..." 
                                            value={serviceModal.specialists || ''} 
                                            onChange={(e) => setServiceModal({...serviceModal, specialists: e.target.value})} 
                                        />
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
                                
                                {/* --- NUEVO: SELECTOR DE SERVICIOS (CHECKBOXES) --- */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Asignar Tratamientos Autorizados</label>
                                    <div className="h-40 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-1 gap-2">
                                        {services.map((serv) => {
                                            // Verificamos si el especialista ya tiene este servicio asignado
                                            const currentServices = editSpecialist.services || '';
                                            const isChecked = currentServices.includes(serv.name);

                                            return (
                                                <label key={serv.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                    <input 
                                                        type="checkbox" 
                                                        className="accent-[#D4AF37]"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            let newServices = currentServices.split(',').map((s: string) => s.trim()).filter(Boolean);
                                                            
                                                            if (e.target.checked) {
                                                                // Agregar servicio
                                                                newServices.push(serv.name);
                                                            } else {
                                                                // Quitar servicio
                                                                newServices = newServices.filter((s: string) => s !== serv.name);
                                                            }
                                                            // Guardar como string separado por comas
                                                            setEditSpecialist({ ...editSpecialist, services: newServices.join(', ') });
                                                        }}
                                                    />
                                                    <span className="text-xs text-gray-700">{serv.name}</span>
                                                </label>
                                            );
                                        })}
                                        {services.length === 0 && <p className="text-[10px] text-gray-400">No hay servicios creados aún.</p>}
                                    </div>
                                    <p className="text-[9px] text-gray-400">Selecciona los servicios que este especialista puede realizar.</p>
                                </div>
                                {/* ------------------------------------------------ */}

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
