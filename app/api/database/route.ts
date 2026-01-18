import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

// Función Helper para Autenticación
async function getSheets() {
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
  try {
    const { searchParams } = new URL(request.url);
    const tabName = searchParams.get('tab');

    if (!tabName) {
      return NextResponse.json({ success: false, error: 'Falta el nombre de la pestaña (tab)' });
    }

    const sheets = await getSheets();
    // USAMOS SIEMPRE LA VARIABLE DE ENTORNO CORRECTA
    const spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A:Z`, // Leemos un rango amplio para detectar todo
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // --- MAGIA: CONVERTIR FILAS A OBJETOS ---
    // Usamos la primera fila como "Claves" (Headers) para crear el objeto JSON
    const headers = rows[0]; 
    const data = rows.slice(1).map((row, rowIndex) => {
      const obj: any = { rowIndex: rowIndex + 2 }; // Índice real en Excel (1-based)
      headers.forEach((header, index) => {
        // Limpiamos el header y lo usamos como clave
        const key = header.trim();
        obj[key] = row[index] || ''; 
      });
      return obj;
    });

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error(`Database API Error (${request.url}):`, error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tab, data } = body;

    const sheets = await getSheets();
    const spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID;

    // Lógica especial para CONFIG: Limpiar antes de escribir para mantenerlo limpio (opcional)
    // O simplemente añadir al final y que el GET lea el último (más seguro y rápido)
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tab}!A:A`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [data],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST Error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tab, rowIndex, data } = body;

    const sheets = await getSheets();
    const spreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A${rowIndex}`, 
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [data],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
