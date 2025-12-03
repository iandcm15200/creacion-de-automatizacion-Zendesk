# 🚀 Instalación del Cloudflare Worker

Esta guía te llevará paso a paso para crear y deployar el Cloudflare Worker que actúa como middleware entre Zendesk y CXConnect.

## 📋 Requisitos Previos

- Una cuenta de correo electrónico válida
- **NO se requiere tarjeta de crédito** (el plan gratuito es suficiente)
- El plan gratuito incluye **100,000 requests por día** (más que suficiente para esta automatización)

---

## Paso 1: Crear Cuenta en Cloudflare

1. Ve a [cloudflare.com](https://www.cloudflare.com/)
2. Haz clic en **"Sign Up"** (Registrarse)
3. Ingresa tu correo electrónico y crea una contraseña
4. Verifica tu correo electrónico
5. Inicia sesión en tu cuenta

✅ **Listo!** Ya tienes acceso a Cloudflare Workers gratuito.

---

## Paso 2: Acceder a Workers & Pages

1. Una vez dentro del dashboard de Cloudflare, busca en el menú lateral izquierdo
2. Haz clic en **"Workers & Pages"**
3. Si es tu primera vez, verás un botón para empezar

![Workers & Pages](https://via.placeholder.com/800x400?text=Cloudflare+Workers+%26+Pages)

---

## Paso 3: Crear Nuevo Worker

1. Haz clic en el botón **"Create application"** (Crear aplicación)
2. Selecciona **"Create Worker"** (Crear Worker)
3. Cloudflare te mostrará un nombre auto-generado (ejemplo: `wandering-dew-1234`)
4. **Cambia el nombre** a algo descriptivo como: `zendesk-cxconnect-middleware`
5. Haz clic en **"Deploy"** (Deployar)

⚠️ **Importante:** Guarda este nombre, lo necesitarás después.

---

## Paso 4: Copiar y Pegar el Código

1. Después del deploy inicial, haz clic en **"Edit code"** (Editar código)
2. Se abrirá el editor de Cloudflare
3. **Elimina todo el código de ejemplo** que viene por defecto
4. Abre el archivo `cloudflare-worker.js` de este repositorio
5. **Copia todo el contenido** del archivo
6. **Pégalo** en el editor de Cloudflare

El código debería verse así al inicio:

```javascript
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
```

---

## Paso 5: Hacer Deploy

1. Haz clic en el botón **"Save and Deploy"** (Guardar y Deployar) en la esquina superior derecha
2. Espera unos segundos mientras Cloudflare despliega tu Worker
3. Verás un mensaje de confirmación: ✅ "Successfully deployed"

---

## Paso 6: Obtener la URL del Worker

1. En la parte superior del editor verás la URL de tu Worker
2. Se verá algo como: `https://zendesk-cxconnect-middleware.tu-usuario.workers.dev`
3. **Copia esta URL completa** - la necesitarás para configurar el webhook en Zendesk

📝 **Ejemplo de URL:**
```
https://zendesk-cxconnect-middleware.juan-perez.workers.dev
```

---

## Paso 7: Probar el Worker

Antes de conectarlo a Zendesk, vamos a probarlo manualmente:

### Opción A: Probar desde el navegador

1. En el editor de Cloudflare, haz clic en el botón **"Send"** en la sección de pruebas
2. Esto enviará una petición de prueba

### Opción B: Probar con cURL (más completo)

Abre una terminal y ejecuta:

```bash
curl -X POST https://tu-worker.tu-usuario.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "subdominio": "aplatam4961",
    "plantilla": "{\"destination\":{\"integrationId\":\"--integrationId--\",\"destinationId\":\"+52 55 1287 5673\"},\"author\":{\"role\":\"appMaker\"},\"messageSchema\":\"whatsapp\",\"message\":{\"type\":\"template\",\"template\":{\"namespace\":\"--namespace--\",\"name\":\"2566_m_intentocontacto_na_plantillasasesores\",\"language\":{\"policy\":\"deterministic\",\"code\":\"es\"}}}}",
    "producto_id": "1156221",
    "telefono": "+52 55 1287 5673",
    "nombre_plantilla": "2566_m_intentocontacto_na_plantillasasesores",
    "idusuario": "12345",
    "correousuario": "test@example.com",
    "assigneedMail": "agent@example.com",
    "assigneedId": "67890"
  }'
```

**Respuesta esperada:** El Worker debería procesar la petición y retornar la respuesta de CXConnect (puede ser un error si los IDs no son válidos, pero eso es esperado en pruebas).

---

## 📊 Cómo Ver Logs y Debugging

### Ver logs en tiempo real:

1. Ve al dashboard de Cloudflare
2. Navega a **"Workers & Pages"**
3. Haz clic en tu worker (`zendesk-cxconnect-middleware`)
4. Haz clic en la pestaña **"Logs"**
5. Selecciona **"Begin log stream"**

Aquí verás en tiempo real:
- 📨 Payloads recibidos de Zendesk
- 📞 Números de teléfono antes y después de limpiarlos
- 📋 Plantillas parseadas
- 🚀 Peticiones enviadas a CXConnect
- 📥 Respuestas de CXConnect
- ❌ Errores si algo sale mal

### Logs típicos que verás:

```
📨 Payload recibido de Zendesk: {...}
📞 Teléfono original: +52 55 1287 5673 → Limpio: 525512875673
📋 Plantilla parseada correctamente
✅ destinationId actualizado: 525512875673
📤 Payload preparado para CXConnect (form-urlencoded): ...
🚀 Enviando petición a CXConnect: https://cxconnectav-aol...
📥 Respuesta de CXConnect [200]: ...
```

---

## 💰 Plan Gratuito de Cloudflare Workers

El plan **gratuito** incluye:

| Característica | Plan Gratuito |
|---|---|
| **Requests por día** | 100,000 |
| **CPU time por request** | 10ms |
| **Workers** | Ilimitados |
| **Costo** | $0 USD |

Para esta automatización:
- **Promedio:** 100-500 requests por día
- **Uso estimado:** < 0.5% del límite gratuito

⚡ **Conclusión:** El plan gratuito es más que suficiente.

---

## 🔄 Actualizar el Worker

Si necesitas actualizar el código en el futuro:

1. Ve a **"Workers & Pages"** en Cloudflare
2. Haz clic en tu worker
3. Haz clic en **"Edit code"**
4. Haz los cambios necesarios
5. Haz clic en **"Save and Deploy"**

Los cambios se aplican **inmediatamente** - no hay downtime.

---

## ✅ Checklist de Instalación

- [ ] Cuenta de Cloudflare creada
- [ ] Worker creado con nombre descriptivo
- [ ] Código de `cloudflare-worker.js` copiado y pegado
- [ ] Worker desplegado (deployed)
- [ ] URL del Worker copiada
- [ ] Worker probado con cURL (opcional pero recomendado)
- [ ] Logs verificados en el dashboard

---

## ➡️ Siguiente Paso

Ahora que tu Worker está funcionando, el siguiente paso es configurar el webhook en Zendesk.

👉 **Continúa con:** [CONFIGURACION_WEBHOOK_ZENDESK.md](./CONFIGURACION_WEBHOOK_ZENDESK.md)

---

## 🆘 ¿Problemas?

Si tienes algún problema durante la instalación, consulta:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solución de problemas comunes
- Logs del Worker en Cloudflare Dashboard
- [Documentación oficial de Cloudflare Workers](https://developers.cloudflare.com/workers/)
