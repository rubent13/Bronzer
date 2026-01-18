import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

// MOVIDO ARRIBA: Ahora es accesible globalmente para try y catch
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
    
    // Leemos la hoja 'CONFIG'
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.NEXT_PUBLIC_SHEET_ID,
      range: 'CONFIG!A:E',
    });

    const rows = response.data.values;

    if (rows && rows.length > 0) {
      // Tomamos la última fila válida
      const lastRow = rows[rows.length - 1];
      
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

    return NextResponse.json({ success: true, data: defaultConfig });

  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({
      success: true,
      data: defaultConfig
    });
  }
}
