import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Función inteligente para elegir la hoja de cálculo correcta
const getSheetsParams = (tab?: string | null) => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  // SI LA PESTAÑA ES 'Clientes Registrados' O 'CLIENTES', USAMOS EL ID DE LA NUEVA HOJA
  // SI NO, USAMOS LA HOJA GENERAL (process.env.GOOGLE_SHEET_ID)
  // ID NUEVO: 1HaqEU4SnWdEDldvZTs0-hQUE6SBL2e7Zsy7X7dXOZ0Q
  const spreadsheetId = (tab === 'Clientes Registrados' || tab === 'CLIENTES') 
    ? '1HaqEU4SnWdEDldvZTs0-hQUE6SBL2e7Zsy7X7dXOZ0Q' 
    : process.env.GOOGLE_SHEET_ID;

  return { sheets, spreadsheetId };
};

// Función de ayuda para normalizar el nombre de la pestaña
// Esto asegura que si el código envía "CLIENTES", Google busque "Clientes Registrados"
const normalizeTabName = (tab: string | null) => {
    if (tab === 'CLIENTES' || tab === 'Clientes Registrados') return 'Clientes Registrados';
    return tab;
};

// --- LEER (GET) ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTab = searchParams.get('tab'); 
    if (!rawTab) return NextResponse.json({ success: false, error: 'Falta la pestaña' });

    // 1. Normalizamos el nombre (para que coincida con tu Excel)
    const tab = normalizeTabName(rawTab);

    // 2. Obtenemos params con el ID correcto
    const { sheets, spreadsheetId } = getSheetsParams(tab);

    // Leemos un rango amplio.
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tab}'!A2:H100`, 
    });

    const rows = response.data.values || [];
    
    const data = rows.map((row, i) => {
        // Validación básica
        if (!row || !row[1]) return null;
        
        const baseObj = { rowIndex: i + 2 }; 

        // --- PRODUCTOS ---
        if (tab === 'Productos') {
          return { 
            ...baseObj, id: row[0], name: row[1], price: Number(row[2]) || 0, 
            stock: Number(row[3]) || 0, img: row[4], description: row[5] || '', promotion: row[6] || ''    
          };
        }

        // --- SERVICIOS ---
        if (tab === 'Servicios') {
          return {
            ...baseObj,
            id: row[0],
            name: row[1],
            price: Number(row[2]) || 0,
            duration: row[3] || '60 min',
            category: row[4] || 'General',
            description: row[5] || '',
            img: row[6] || ''
          };
        }

        // --- ESPECIALISTAS ---
        if (tab === 'ESPECIALISTAS' || tab === 'Doctores') {
          return { 
            ...baseObj, id: row[0], name: row[1], role: row[2], img: row[3],          
            schedule: row[4] || '', specialty: row[5] || '', experience: row[6] || '', certified: row[7] || ''
          };
        }

        // --- VENTAS ---
        if (tab === 'Ventas' || tab === 'VENTAS') {
          return { ...baseObj, date: row[0], client: row[1], total: row[2], details: row[3] };
        }

        // --- CLIENTES REGISTRADOS (NUEVO ARCHIVO) ---
        // Estructura esperada en el NUEVO Excel: A:Email, B:Password, C:Nombre
        if (tab === 'Clientes Registrados') {
           return {
             ...baseObj,
             Email: row[0],
             Password: row[1],
             Nombre: row[2]
           };
        }

        return null;
    }).filter(item => item !== null);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

// --- ACTUALIZAR (PUT) ---
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tab: rawTab, rowIndex, data } = body; 
    
    const tab = normalizeTabName(rawTab);

    // Pasamos 'tab' para saber qué ID de hoja usar
    const { sheets, spreadsheetId } = getSheetsParams(tab);

    // Definimos hasta qué columna escribir según la pestaña
    let endCol = 'H'; 
    if (tab === 'Productos' || tab === 'Servicios') endCol = 'G';
    if (tab === 'Clientes Registrados') endCol = 'C';

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tab}'!A${rowIndex}:${endCol}${rowIndex}`, 
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [data] },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

// --- CREAR (POST) ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tab: rawTab, data } = body; 
    
    const tab = normalizeTabName(rawTab);
    
    // Pasamos 'tab' para saber qué ID de hoja usar
    const { sheets, spreadsheetId } = getSheetsParams(tab);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId, 
      range: `'${tab}'!A1`, 
      valueInputOption: 'USER_ENTERED', 
      requestBody: { values: [data] },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}