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

  try {
    const { searchParams } = new URL(request.url);
    // decodeURIComponent asegura que espacios como %20 se conviertan a espacios reales
    tabName = decodeURIComponent(searchParams.get('tab') || '').trim();

    if (!tabName) {
      return NextResponse.json({ success: false, error: 'Falta el nombre de la pestaña (tab)' });
    }

    const sheets = await getSheets();
    
    // 2. Selección Inteligente del ID de la Hoja
    spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID || process.env.GOOGLE_SHEET_ID || "";

    if (!spreadsheetId) {
      return NextResponse.json({ success: false, error: 'No se encontró el ID de la hoja (NEXT_PUBLIC_SHEET_ID) en .env' });
    }

    // 3. Manejo de Espacios: Si tiene espacios, debe ir entre comillas simples 'Nombre Hoja'
    const safeTabName = tabName.includes(' ') && !tabName.startsWith("'") ? `'${tabName}'` : tabName;

    console.log(`📡 Conectando a Sheet: ${spreadsheetId.substring(0, 5)}... | Tab: ${safeTabName}`);

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
    const data = rows.slice(1).map((row, rowIndex) => {
      const obj: any = { rowIndex: rowIndex + 2 }; // Índice real en Excel (1-based, saltando header)
      headers.forEach((header, index) => {
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
    
    // Manejo específico de errores comunes para ayudar al usuario
    if (error.code === 403) {
        return NextResponse.json({ 
            success: false, 
            error: `PERMISO DENEGADO. Comparte tu hoja con: ${process.env.GOOGLE_CLIENT_EMAIL}` 
        });
    }
    
    if (error.code === 404 || error.message.includes('Unable to parse range')) {
        return NextResponse.json({ 
            success: false, 
            error: `NO ENCONTRADO. Revisa: 1. Nombre de pestaña "${tabName}" sea exacto. 2. ID hoja "${spreadsheetId}" sea correcto.` 
        });
    }

    // Devolvemos el error detallado para ver qué pasa en el frontend
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

    // Manejo de comillas para pestañas con espacios
    const safeTabName = tab.includes(' ') && !tab.startsWith("'") ? `'${tab}'` : tab;

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

    // Manejo de comillas para pestañas con espacios
    const safeTabName = tab.includes(' ') && !tab.startsWith("'") ? `'${tab}'` : tab;

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
