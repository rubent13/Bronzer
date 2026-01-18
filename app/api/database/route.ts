import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

// Función Helper para Autenticación
async function getSheets() {
  // 1. Verificación de Credenciales
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Faltan credenciales de Google (GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY) en .env');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
  return google.sheets({ auth, version: 'v4' });
}

export async function GET(request: Request) {
  let spreadsheetId = "";
  let tabName = "";
  let sheets: any = null;

  try {
    const { searchParams } = new URL(request.url);
    // decodeURIComponent asegura que espacios como %20 se conviertan a espacios reales
    tabName = decodeURIComponent(searchParams.get('tab') || '').trim();

    if (!tabName) {
      return NextResponse.json({ success: false, error: 'Falta el nombre de la pestaña (tab)' });
    }

    sheets = await getSheets();
    
    // 2. Selección Inteligente del ID de la Hoja
    spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID || process.env.GOOGLE_SHEET_ID || "";

    if (!spreadsheetId) {
      return NextResponse.json({ success: false, error: 'No se encontró el ID de la hoja (NEXT_PUBLIC_SHEET_ID) en .env' });
    }

    // 3. Manejo de Espacios: Si tiene espacios, debe ir entre comillas simples 'Nombre Hoja'
    const safeTabName = `'${tabName.replace(/'/g, '')}'`; 

    console.log(`📡 Intentando leer: ${spreadsheetId.substring(0, 5)}... | Pestaña: ${safeTabName}`);

    // Leemos un rango amplio para detectar todo
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${safeTabName}!A:Z`, 
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // --- MAGIA: CONVERTIR FILAS A OBJETOS ---
    // Usamos la primera fila como "Claves" (Headers) para crear el objeto JSON
    const headers = rows[0]; 
    const data = rows.slice(1).map((row: any[], rowIndex: number) => {
      const obj: any = { rowIndex: rowIndex + 2 }; // Índice real en Excel (1-based, saltando header)
      headers.forEach((header: string, index: number) => {
        // Limpiamos el header y lo usamos como clave
        if (header) {
            const key = header.trim();
            // Asignamos el valor o string vacío si no existe
            obj[key] = row[index] || ''; 
        }
      });
      return obj;
    });

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error(`❌ Error Conexión Sheets (${request.url}):`, error.message);
    
    // DIAGNÓSTICO AVANZADO
    if (error.code === 403) {
        return NextResponse.json({ 
            success: false, 
            error: `PERMISO DENEGADO. Asegúrate de compartir tu hoja de Google Sheets con el correo: ${process.env.GOOGLE_CLIENT_EMAIL} (Editor)` 
        });
    }
    
    // Si no encuentra la pestaña o el rango es inválido, intentamos listar las pestañas disponibles
    if (error.code === 400 || error.code === 404 || error.message.includes('Unable to parse range') || error.message.includes('range')) {
        try {
            if (sheets && spreadsheetId) {
                const metadata = await sheets.spreadsheets.get({ spreadsheetId });
                const availableTabs = metadata.data.sheets?.map((s: any) => s.properties?.title).join(', ');
                
                return NextResponse.json({ 
                    success: false, 
                    error: `Error: No se encontró la pestaña "${tabName}". Pestañas disponibles en tu hoja: [ ${availableTabs} ]` 
                });
            }
        } catch (metaError) {
            return NextResponse.json({ 
                success: false, 
                error: `Error Crítico: No se pudo conectar a la hoja con ID "${spreadsheetId}". Verifica que el ID sea correcto en tu archivo .env` 
            });
        }
    }

    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tab, data } = body;

    const sheets = await getSheets();
    const spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID || process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) throw new Error("Falta Spreadsheet ID");

    // Manejo seguro de nombre de pestaña
    const cleanTab = tab.replace(/'/g, '');
    const safeTabName = `'${cleanTab}'`;

    // --- LÓGICA ESPECIAL PARA CONFIG ---
    // Si guardamos banner, limpiamos primero para evitar acumulación
    if (cleanTab === 'CONFIG') {
        try {
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: `${safeTabName}!A2:Z20`, // Borra contenido datos, mantiene headers
            });
        } catch (e) {
            console.warn("⚠️ No se pudo limpiar CONFIG (puede estar vacío):", e);
        }
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${safeTabName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [data],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ POST Error:', error.message);
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tab, rowIndex, data } = body;

    const sheets = await getSheets();
    const spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID || process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) throw new Error("Falta Spreadsheet ID");

    // Manejo seguro de nombre de pestaña
    const safeTabName = `'${tab.replace(/'/g, '')}'`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${safeTabName}!A${rowIndex}`, 
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [data],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ PUT Error:', error.message);
    return NextResponse.json({ success: false, error: error.message });
  }
}

// --- FUNCIÓN DELETE (PARA BORRAR CUPONES O FILAS) ---
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab');
        // 'index' es el rowIndex de Excel (ej: 2, 3, 4...)
        const rowIndex = Number(searchParams.get('index')); 

        if (!tab || isNaN(rowIndex)) return NextResponse.json({ success: false, error: 'Faltan parámetros (tab, index)' });

        const sheets = await getSheets();
        const spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID || process.env.GOOGLE_SHEET_ID;
        
        // 1. Obtener el sheetId (necesario para borrar filas enteras)
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const cleanTabName = tab.replace(/'/g, ''); 
        const sheet = metadata.data.sheets?.find(s => s.properties?.title === cleanTabName);
        
        if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
             return NextResponse.json({ success: false, error: `Hoja '${cleanTabName}' no encontrada para borrar.` });
        }

        // 2. Calcular índices API (0-based)
        // Excel Row 1 = Index 0.
        // Si rowIndex es 2 (primera fila de datos), startIndex debe ser 1.
        const startIndex = rowIndex - 1; 

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
        console.error('❌ DELETE Error:', error.message);
        return NextResponse.json({ success: false, error: error.message });
    }
}
