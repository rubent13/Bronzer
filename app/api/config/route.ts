import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const getAuth = () => {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
};

export async function GET() {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Leer configuración del banner
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'CONFIG!A:E',
    });

    const rows = response.data.values || [];
    
    // Configuración por defecto
    const defaultConfig = {
      active: false,
      text: "Envíos Gratis en compras mayores a $50 ✨",
      bgColor: "#96765A",
      textColor: "#FFFFFF",
      animation: "none"
    };

    if (rows.length > 1) {
      const [active, text, bgColor, textColor, animation] = rows[1];
      return NextResponse.json({
        success: true,
        data: {
          active: active === "TRUE",
          text: text || defaultConfig.text,
          bgColor: bgColor || defaultConfig.bgColor,
          textColor: textColor || defaultConfig.textColor,
          animation: animation || defaultConfig.animation
        }
      });
    }

    return NextResponse.json({ success: true, data: defaultConfig });
    
  } catch (error: any) {
    console.error('Error al leer configuración:', error);
    return NextResponse.json({
      success: true,
      data: defaultConfig
    });
  }
}