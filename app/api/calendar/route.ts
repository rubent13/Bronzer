import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// --- CONFIGURACIÓN REUTILIZABLE ---
const getCalendarParams = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
  });
  const calendar = google.calendar({ version: 'v3', auth });
  return { calendar, calendarId: process.env.GOOGLE_CALENDAR_ID };
};

// 1. GET: LEER CITAS (Para el Admin)
export async function GET() {
  try {
    const { calendar, calendarId } = getCalendarParams();
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const appointments = (response.data.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      description: event.description || "",
      link: event.htmlLink
    }));
    return NextResponse.json({ success: true, data: appointments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. POST: CREAR CITA (Para el Cliente)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, note, service, date, time, specialist } = body;
    const { calendar, calendarId } = getCalendarParams();

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `CITA: ${name} (${service})`,
      description: `Cliente: ${name}\nTeléfono: ${phone}\nServicio: ${service}\nEspecialista: ${specialist}\nNota: ${note || 'Ninguna'}`,
      start: { dateTime: startDateTime.toISOString(), timeZone: 'America/Caracas' },
      end: { dateTime: endDateTime.toISOString(), timeZone: 'America/Caracas' },
    };

    const response = await calendar.events.insert({ calendarId, requestBody: event });
    return NextResponse.json({ success: true, link: response.data.htmlLink });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 3. PUT: ACTUALIZAR CITA (Nuevo para Admin)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { eventId, date, time } = body;
    const { calendar, calendarId } = getCalendarParams();

    // Recalcular hora inicio y fin
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: {
        start: { dateTime: startDateTime.toISOString(), timeZone: 'America/Caracas' },
        end: { dateTime: endDateTime.toISOString(), timeZone: 'America/Caracas' },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al actualizar:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 4. DELETE: ELIMINAR CITA (Nuevo para Admin)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    const { calendar, calendarId } = getCalendarParams();

    if (!eventId) throw new Error("ID no proporcionado");

    await calendar.events.delete({ calendarId, eventId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al eliminar:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}