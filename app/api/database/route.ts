import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// MODIFICACIÓN: Ahora acepta 'tab' para saber qué archivo de Excel abrir
const getSheetsParams = (tab?: string | null) => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  // SI ES LA PESTAÑA DE CLIENTES O CUPONES, USAMOS EL ID ESPECÍFICO
  // SI NO, USAMOS EL ID GENERAL DE SIEMPRE
  const spreadsheetId = (tab === 'Clientes Registrados' || tab === 'cupones') 
    ? '1HaqEU4SnWdEDldvZTs0-hQUE6SBL2e7Zsy7X7dXOZ0Q' 
    : process.env.GOOGLE_SHEET_ID;

  return { sheets, spreadsheetId };
};

// --- LEER (GET) ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab'); 
    if (!tab) return NextResponse.json({ success: false, error: 'Falta la pestaña' });

    // Pasamos el tab para elegir el archivo correcto
    const { sheets, spreadsheetId } = getSheetsParams(tab);

    // Leemos un rango amplio
    // IMPORTANTE: Ponemos comillas simples '' al nombre del tab por si tiene espacios
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tab}'!A2:I100`, // Aumenté el rango hasta la columna I para cubrir todos los campos de cupones
    });

    const rows = response.data.values || [];
    
    const data = rows.map((row, i) => {

        if (!row || (!row[0] && !row[1])) return null; // Validación básica

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
        if (tab === 'Ventas') {
          return { ...baseObj, date: row[0], client: row[1], total: row[2], details: row[3] };
        }

         // --- CLIENTES REGISTRADOS ---
        // Columnas Actualizadas: A=Fecha, B=Email, C=Password, D=Nombre
        if (tab === 'Clientes Registrados') {
           return {
             ...baseObj,
             Email: row[0],    // Columna A
             Password: row[1], // Columna B
             Nombre: row[2]    // Columna C
           };
        }

        // --- CUPONES (NUEVO) ---
        // Estructura: Email, Titulo, Tipo, Valor, Target, BgColor, Text, Color, Imagen
        if (tab === 'cupones') {
            return {
              ...baseObj,
              Email: row[0],    // Columna A
              Titulo: row[1],   // Columna B
              Tipo: row[2],     // Columna C
              Valor: row[3],    // Columna D
              Target: row[4],   // Columna E (Individual/Masivo)
              BgColor: row[5],  // Columna F
              Text: row[6],     // Columna G (Mensaje)
              Color: row[7],    // Columna H (Color Texto)
              Imagen: row[8]    // Columna I
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
    const { tab, rowIndex, data } = body; 
    
    // Pasamos el tab para elegir el archivo correcto
    const { sheets, spreadsheetId } = getSheetsParams(tab);

    // Definimos hasta qué columna escribir según la pestaña
    let endCol = 'H'; 
    if (tab === 'Productos' || tab === 'Servicios') endCol = 'G';
    if (tab === 'Clientes Registrados') endCol = 'D'; // Se usa hasta D
    if (tab === 'cupones') endCol = 'I'; // Se usa hasta I

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tab}'!A${rowIndex}:${endCol}${rowIndex}`, // Comillas simples agregadas
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
    const { tab, data } = body; 
    
    // Pasamos el tab para elegir el archivo correcto
    const { sheets, spreadsheetId } = getSheetsParams(tab);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId, 
      range: `'${tab}'!A1`, // Comillas simples agregadas
      valueInputOption: 'USER_ENTERED', 
      requestBody: { values: [data] },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}