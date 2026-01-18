import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

// DEFINICIÓN GLOBAL: Disponible para try y catch
const defaultConfig = {
  active: true,
  text: "Envíos Gratis en compras mayores a $50 ✨",
  bgColor: "#96765A",
  textColor: "#FFFFFF",
  animation: "marquee"
};

export async function GET() {
  try {
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

    const sheets = google.sheets({ auth, version: 'v4' });
    
    // Intentamos leer la hoja 'CONFIG'
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.NEXT_PUBLIC_SHEET_ID,
      range: 'CONFIG!A:E', // Leemos las columnas A a E
    });

    const rows = response.data.values;

    if (rows && rows.length > 0) {
      // Tomamos la última fila válida (asumiendo que los nuevos cambios se agregan al final)
      const lastRow = rows[rows.length - 1];
      
      // Mapeamos los valores de la hoja a nuestro objeto de configuración
      // Estructura esperada desde Admin: [Active, Text, BgColor, TextColor, Animation]
      if (lastRow.length > 0) {
          return NextResponse.json({
            success: true,
            data: {
              active: lastRow[0] === 'TRUE',
              text: lastRow[1] || defaultConfig.text,
              bgColor: lastRow[2] || defaultConfig.bgColor,
              textColor: lastRow[3] || defaultConfig.textColor,
              animation: lastRow[4] || defaultConfig.animation
            }
          });
      }
    }

    // Si no hay datos, devolvemos el default
    return NextResponse.json({ success: true, data: defaultConfig });

  } catch (error) {
    console.error('Error fetching config:', error);
    // Ahora defaultConfig es accesible aquí
    return NextResponse.json({
      success: true,
      data: defaultConfig
    });
  }
}
