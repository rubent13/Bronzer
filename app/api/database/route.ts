import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const getSheetsParams = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId: process.env.GOOGLE_SHEET_ID };
};

// --- LEER (GET) ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab'); 
    if (!tab) return NextResponse.json({ success: false, error: 'Falta la pestaña' });

    const { sheets, spreadsheetId } = getSheetsParams();

    // Leemos un rango amplio
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A2:H100`, 
    });

    const rows = response.data.values || [];
    
    const data = rows.map((row, i) => {
        if (!row || !row[1]) return null;
        const baseObj = { rowIndex: i + 2 }; 

        // --- PRODUCTOS ---
        if (tab === 'Productos') {
          return { 
            ...baseObj, id: row[0], name: row[1], price: Number(row[2]) || 0, 
            stock: Number(row[3]) || 0, img: row[4], description: row[5] || '', promotion: row[6] || ''    
          };
        }

        // --- SERVICIOS (NUEVO) ---
        // A:ID, B:Nombre, C:Precio, D:Duracion, E:Categoria, F:Descripcion, G:Imagen
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
    const { sheets, spreadsheetId } = getSheetsParams();

    // Definimos hasta qué columna escribir según la pestaña
    let endCol = 'H'; 
    if (tab === 'Productos' || tab === 'Servicios') endCol = 'G';

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A${rowIndex}:${endCol}${rowIndex}`,
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
    const { sheets, spreadsheetId } = getSheetsParams();
    await sheets.spreadsheets.values.append({
      spreadsheetId, range: `${tab}!A1`, valueInputOption: 'USER_ENTERED', requestBody: { values: [data] },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}