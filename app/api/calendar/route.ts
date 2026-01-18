// app/api/calendar/route.ts
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// --- CONFIGURACIÓN REUTILIZABLE ---
const getAuth = () => {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/spreadsheets'
    ],
  });
};

const getCalendarParams = () => {
  const auth = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  return { calendar, calendarId: process.env.GOOGLE_CALENDAR_ID };
};

const getSheetsParams = () => {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId: process.env.GOOGLE_SHEET_ID };
};

// 1. GET: LEER CITAS EXISTENTES (Para validación de disponibilidad)
export async function GET() {
  try {
    const { calendar, calendarId } = getCalendarParams();
    const { sheets, spreadsheetId } = getSheetsParams();
    
    // Obtener eventos del calendario
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 días
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    // Obtener citas de Google Sheets también
    let sheetsAppointments = [];
    if (spreadsheetId) {
      try {
        const sheetsResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: 'Citas!A:L', // Ajusta según tu estructura
        });
        
        const rows = sheetsResponse.data.values || [];
        if (rows.length > 1) {
          const headers = rows[0];
          sheetsAppointments = rows.slice(1).map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header: string, index: number) => {
              obj[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
            });
            return obj;
          });
        }
      } catch (sheetsError) {
        console.warn('No se pudieron cargar citas de Sheets:', sheetsError);
      }
    }

    // Procesar eventos del calendario para validación
    const calendarEvents = (response.data.items || []).map((event: any) => {
      // Extraer especialista del título o descripción
      let specialist = '';
      const title = event.summary || '';
      const desc = event.description || '';
      
      // Buscar especialista en el título
      const specialistMatch = title.match(/Especialista:\s*(.+)/i) || 
                             desc.match(/Especialista:\s*(.+)/i);
      
      if (specialistMatch) {
        specialist = specialistMatch[1].trim();
      } else {
        // Intentar extraer del título
        const titleParts = title.split('-');
        if (titleParts.length > 1) {
          specialist = titleParts[0].trim();
        }
      }
      
      // Obtener fecha y hora
      const startDate = event.start.dateTime || event.start.date;
      const dateObj = new Date(startDate);
      const date = dateObj.toISOString().split('T')[0];
      const time = dateObj.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }).replace('.', ':');
      
      return {
        id: event.id,
        specialist: specialist || 'Desconocido',
        date: date,
        time: time,
        client_name: title.split('(')[0]?.trim() || 'Cliente',
        service: desc.match(/Servicio:\s*(.+)/i)?.[1] || 'Servicio',
        status: event.status || 'confirmed'
      };
    });

    // Combinar datos de Calendar y Sheets
    const allAppointments = [...calendarEvents, ...sheetsAppointments];
    
    return NextResponse.json({ 
      success: true, 
      data: allAppointments,
      count: allAppointments.length,
      sources: {
        calendar: calendarEvents.length,
        sheets: sheetsAppointments.length
      }
    });
    
  } catch (error: any) {
    console.error('Error al cargar citas:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// 2. POST: CREAR CITA (Para el Cliente) - GUARDA EN AMBOS
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      phone, 
      note, 
      service, 
      date, 
      time, 
      specialist,
      paymentMethod,
      paymentRef,
      sheetName = "Citas" 
    } = body;
    
    const { calendar, calendarId } = getCalendarParams();
    const { sheets, spreadsheetId } = getSheetsParams();

    // Validar campos requeridos
    if (!name || !phone || !date || !time || !specialist) {
      return NextResponse.json({ 
        success: false, 
        error: 'Faltan campos requeridos (nombre, teléfono, fecha, hora, especialista)' 
      }, { status: 400 });
    }

    // Crear evento en Google Calendar
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hora

    const eventDescription = `
Cliente: ${name}
Teléfono: ${phone}
Servicio: ${service}
Especialista: ${specialist}
Nota: ${note || 'Ninguna'}
Método de Pago: ${paymentMethod || 'No especificado'}
Referencia: ${paymentRef || 'N/A'}
Fecha Reserva: ${new Date().toLocaleString('es-VE')}
    `.trim();

    const calendarEvent = {
      summary: `CITA: ${name} - ${service}`,
      description: eventDescription,
      start: { 
        dateTime: startDateTime.toISOString(), 
        timeZone: 'America/Caracas' 
      },
      end: { 
        dateTime: endDateTime.toISOString(), 
        timeZone: 'America/Caracas' 
      },
      colorId: '5', // Color amarillo
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 30 } // 30 minutos antes
        ]
      }
    };

    const calendarResponse = await calendar.events.insert({ 
      calendarId, 
      requestBody: calendarEvent,
      sendNotifications: true 
    });

    // Guardar en Google Sheets
    let sheetsResponse = null;
    if (spreadsheetId) {
      try {
        const timestamp = new Date().toLocaleString('es-VE');
        
        const newRow = [
          timestamp,           // Fecha Reserva
          name,               // Nombre Cliente
          phone,              // Teléfono
          service,            // Servicio
          specialist,         // Especialista
          date,               // Fecha Cita
          time,               // Hora Cita
          note || '',         // Nota
          paymentMethod || '', // Método Pago
          paymentRef || '',   // Referencia Pago
          calendarResponse.data.id, // ID Evento Calendar
          'Confirmada'        // Estado
        ];

        sheetsResponse = await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:L`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: [newRow]
          }
        });
      } catch (sheetsError) {
        console.warn('No se pudo guardar en Sheets:', sheetsError);
        // No fallar la operación si solo falla Sheets
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cita creada exitosamente',
      data: {
        calendarEventId: calendarResponse.data.id,
        calendarLink: calendarResponse.data.htmlLink,
        savedToSheets: !!sheetsResponse,
        appointmentDetails: {
          client: name,
          specialist,
          date,
          time,
          service
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error al crear cita:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// 3. PUT: ACTUALIZAR CITA
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { eventId, date, time, specialist } = body;
    const { calendar, calendarId } = getCalendarParams();

    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID del evento no proporcionado' 
      }, { status: 400 });
    }

    // Obtener evento existente
    const existingEvent = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId,
    });

    // Recalcular hora inicio y fin
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    // Actualizar evento
    const updatedEvent = {
      ...existingEvent.data,
      start: { 
        dateTime: startDateTime.toISOString(), 
        timeZone: 'America/Caracas' 
      },
      end: { 
        dateTime: endDateTime.toISOString(), 
        timeZone: 'America/Caracas' 
      },
    };

    // Si se cambió el especialista, actualizar título
    if (specialist) {
      const titleMatch = updatedEvent.summary?.match(/CITA:\s*(.+?)\s*-/);
      if (titleMatch) {
        updatedEvent.summary = `CITA: ${titleMatch[1]} - ${specialist}`;
      }
    }

    await calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: updatedEvent,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Cita actualizada exitosamente' 
    });
    
  } catch (error: any) {
    console.error("Error al actualizar:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// 4. DELETE: ELIMINAR CITA
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    const { calendar, calendarId } = getCalendarParams();

    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID no proporcionado" 
      }, { status: 400 });
    }

    await calendar.events.delete({ 
      calendarId, 
      eventId 
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Cita eliminada exitosamente' 
    });
    
  } catch (error: any) {
    console.error("Error al eliminar:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
