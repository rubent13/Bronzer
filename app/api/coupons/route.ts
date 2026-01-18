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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Leer cupones
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'CUPONES!A:H',
    });

    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      return NextResponse.json({ success: true, data: [] });
    }

    const headers = rows[0];
    const coupons = rows.slice(1).map((row, index) => {
      const coupon: any = {};
      headers.forEach((header: string, idx: number) => {
        coupon[header.toLowerCase().replace(/\s+/g, '_')] = row[idx] || '';
      });
      coupon.id = index + 1;
      return coupon;
    });

    // Filtrar por email si se especifica
    const filteredCoupons = email 
      ? coupons.filter((c: any) => c.email?.toLowerCase() === email.toLowerCase())
      : coupons;

    return NextResponse.json({ 
      success: true, 
      data: filteredCoupons,
      count: filteredCoupons.length
    });
    
  } catch (error: any) {
    console.error('Error al leer cupones:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      data: []
    }, { status: 500 });
  }
}