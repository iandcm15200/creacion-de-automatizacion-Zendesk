/**
 * Cloudflare Worker: Zendesk → CXConnect WhatsApp Middleware
 * 
 * Este Worker actúa como middleware entre Zendesk y CXConnect:
 * 1. Recibe peticiones JSON de Zendesk
 * 2. Limpia el número de teléfono (elimina +, espacios, guiones, paréntesis)
 * 3. Convierte el payload a formato application/x-www-form-urlencoded
 * 4. Envía la petición a CXConnect
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Solo acepta peticiones POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      message: 'Este endpoint solo acepta peticiones POST'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parsear el JSON recibido de Zendesk
    const body = await request.json();
    
    // Log sanitizado (oculta información sensible)
    const sanitizedBody = {
      ...body,
      telefono: body.telefono ? '***' + body.telefono.slice(-4) : undefined,
      correousuario: body.correousuario ? body.correousuario.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined
    };
    console.log('📨 Payload recibido de Zendesk:', JSON.stringify(sanitizedBody, null, 2));

    // Validar campos requeridos
    const requiredFields = ['subdominio', 'plantilla', 'producto_id', 'telefono', 'nombre_plantilla'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`❌ Campo requerido faltante: ${field}`);
        return new Response(JSON.stringify({
          error: 'Missing required field',
          field: field
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Limpiar el número de teléfono: eliminar +, espacios, guiones, paréntesis
    let cleanPhone = body.telefono;
    if (typeof cleanPhone === 'string') {
      cleanPhone = cleanPhone.replace(/[\s+\-()]/g, '');
      console.log(`📞 Teléfono original: ***${body.telefono.slice(-4)} → Limpio: ***${cleanPhone.slice(-4)}`);
    } else {
      console.error('❌ El campo telefono no es una cadena de texto');
      return new Response(JSON.stringify({
        error: 'Invalid phone format',
        message: 'El campo telefono debe ser una cadena de texto'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar que el teléfono limpio no esté vacío
    if (!cleanPhone || cleanPhone.length === 0) {
      console.error('❌ El teléfono limpio está vacío');
      return new Response(JSON.stringify({
        error: 'Invalid phone',
        message: 'El número de teléfono resultó vacío después de limpiarlo'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar el campo plantilla con el teléfono limpio
    let plantillaObj;
    try {
      plantillaObj = JSON.parse(body.plantilla);
      console.log('📋 Plantilla parseada correctamente');
    } catch (e) {
      console.error('❌ Error al parsear plantilla:', e.message);
      return new Response(JSON.stringify({
        error: 'Invalid plantilla format',
        message: 'El campo plantilla no es un JSON válido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar destinationId con el teléfono limpio
    if (plantillaObj.destination && plantillaObj.destination.destinationId) {
      plantillaObj.destination.destinationId = cleanPhone;
      console.log(`✅ destinationId actualizado: ${cleanPhone}`);
    } else {
      console.error('❌ Estructura de plantilla inválida: falta destination.destinationId');
      return new Response(JSON.stringify({
        error: 'Invalid plantilla structure',
        message: 'La plantilla no contiene destination.destinationId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convertir la plantilla de vuelta a string
    const plantillaStr = JSON.stringify(plantillaObj);

    // Crear el payload en formato application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('subdominio', body.subdominio);
    formData.append('plantilla', plantillaStr);
    formData.append('producto_id', body.producto_id);
    formData.append('telefono', cleanPhone);
    formData.append('nombre_plantilla', body.nombre_plantilla);
    
    // Campos opcionales
    if (body.idusuario) formData.append('idusuario', body.idusuario);
    if (body.correousuario) formData.append('correousuario', body.correousuario);
    if (body.assigneedMail) formData.append('assigneedMail', body.assigneedMail);
    if (body.assigneedId) formData.append('assigneedId', body.assigneedId);

    console.log('📤 Payload preparado para CXConnect con teléfono: ***' + cleanPhone.slice(-4));

    // Endpoint de CXConnect
    const cxconnectUrl = 'https://cxconnectav-aol.cxclatam.com/api/v2/play-one-to-one-proactive';

    // Enviar petición a CXConnect
    console.log(`🚀 Enviando petición a CXConnect: ${cxconnectUrl}`);
    const cxconnectResponse = await fetch(cxconnectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    // Leer la respuesta de CXConnect
    const responseText = await cxconnectResponse.text();
    console.log(`📥 Respuesta de CXConnect [${cxconnectResponse.status}]:`, responseText);

    // Retornar la respuesta de CXConnect a Zendesk
    return new Response(responseText, {
      status: cxconnectResponse.status,
      headers: {
        'Content-Type': cxconnectResponse.headers.get('Content-Type') || 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error en el Worker:', error.message);
    console.error('Stack trace:', error.stack);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
