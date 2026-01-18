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
  
  // Lógica Inteligente de IDs:
  // - Clientes, Cupones y Configuración -> Archivo NUEVO (Privado)
  // - Productos, Servicios, etc. -> Archivo ORIGINAL (Público/General)
  const isPrivateData = tab === 'Clientes Registrados' || tab === 'CUPONES' || tab === 'CONFIG';
  
  const spreadsheetId = isPrivateData
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

    const { sheets, spreadsheetId } = getSheetsParams(tab);

    // Leemos un rango amplio (A2:J100 para cubrir todas las columnas posibles)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tab}'!A2:J100`, 
    });

    const rows = response.data.values || [];
    
    const data = rows.map((row, i) => {
        // Validación básica (excepto para CONFIG que puede tener 1 fila)
        if (tab !== 'CONFIG' && (!row || !row[0])) return null;

        const baseObj = { rowIndex: i + 2 }; // i=0 es la fila 2 de Excel

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
            id: row[0], name: row[1], price: Number(row[2]) || 0, duration: row[3] || '60 min',
            category: row[4] || 'General', description: row[5] || '', img: row[6] || '', specialists: row[7] || ''
          };
        }

        // --- ESPECIALISTAS ---
        if (tab === 'ESPECIALISTAS') {
          return { 
            ...baseObj, id: row[0], name: row[1], role: row[2], img: row[3],          
            schedule: row[4] || '', specialty: row[5] || '', experience: row[6] || '', certified: row[7] || '', services: row[8] || ''
          };
        }

        // --- VENTAS ---
        if (tab === 'Ventas' || tab === 'VENTAS') {
          return { ...baseObj, date: row[0], client: row[1], total: row[2], details: row[3] };
        }

        // --- CLIENTES REGISTRADOS ---
        // A=Fecha, B=Email, C=Password, D=Nombre
        if (tab === 'Clientes Registrados') {
           return {
             ...baseObj,
             Fecha: row[0],
             Email: row[1],
             Password: row[2],
             Nombre: row[3]
           };
        }

        // --- CUPONES (MARKETING) ---
        // A=Email, B=Titulo, C=Tipo, D=Valor, E=Target, F=BgColor, G=TextColor, H=Imagen
        if (tab === 'CUPONES') {
            return {
                ...baseObj,
                sheetRowId: i, // ID virtual para borrar (índice del array)
                Email: row[0],
                Titulo: row[1],
                Tipo: row[2],
                Valor: row[3],
                Target: row[4],
                BgColor: row[5],
                TextColor: row[6],
                Imagen: row[7]
            };
        }

        // --- CONFIGURACIÓN BANNER ---
        // A=Active, B=Text, C=BgColor, D=TextColor, E=Animation
        if (tab === 'CONFIG') {
            return {
                active: row[0],
                text: row[1],
                bgColor: row[2],
                textColor: row[3],
                animation: row[4]
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
    
    const { sheets, spreadsheetId } = getSheetsParams(tab);

    // Definimos rango dinámico
    let range = `'${tab}'!A${rowIndex}:H${rowIndex}`;
    
    // Si es CONFIG, siempre sobreescribimos la fila 2 (la 1 son headers)
    if (tab === 'CONFIG') {
        range = `'${tab}'!A2:E2`;
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
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
    
    const { sheets, spreadsheetId } = getSheetsParams(tab);
    
    // CASO ESPECIAL: Si es CONFIG (Banner), limpiamos antes de escribir para tener solo 1 config activa
    if (tab === 'CONFIG') {
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `'CONFIG'!A2:E10`,
        });
    }

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

// --- BORRAR (DELETE) - NUEVO PARA USAR CUPONES ---
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab');
        // 'index' aquí se refiere al índice visual del array (0, 1, 2...), no al número de fila de Excel
        const index = Number(searchParams.get('index')); 

        if (!tab || isNaN(index)) return NextResponse.json({ success: false, error: 'Faltan parámetros' });

        const { sheets, spreadsheetId } = getSheetsParams(tab);
        
        // 1. Obtener el sheetId (necesario para borrar filas enteras)
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = metadata.data.sheets?.find(s => s.properties?.title === tab);
        
        if (!sheet?.properties?.sheetId) return NextResponse.json({ success: false, error: 'Hoja no encontrada' });

        // 2. Calcular el índice real.
        // Si hay headers en fila 1, el dato 0 del array está en la fila 2 (índice 1 para la API de batchUpdate).
        const startIndex = index + 1; 

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: startIndex,
                            endIndex: startIndex + 1
                        }
                    }
                }]
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
