# 🔗 Configuración del Webhook en Zendesk

Esta guía te mostrará cómo configurar el webhook en Zendesk que enviará los datos a tu Cloudflare Worker.

## 📋 Requisitos Previos

- ✅ Cloudflare Worker instalado y funcionando
- ✅ URL del Worker copiada (ejemplo: `https://zendesk-cxconnect-middleware.tu-usuario.workers.dev`)
- ✅ Acceso de administrador a Zendesk

---

## Paso 1: Acceder a la Configuración de Webhooks

1. Inicia sesión en tu cuenta de Zendesk
2. Haz clic en el ícono de **"Admin"** (⚙️) en la barra lateral izquierda
3. En el **Admin Center**, navega a:
   - **Apps y integraciones** → **Webhooks**
4. Haz clic en el botón **"Crear webhook"**

![Navegación a Webhooks](https://via.placeholder.com/800x400?text=Admin+Center+%3E+Apps+y+integraciones+%3E+Webhooks)

---

## Paso 2: Seleccionar Tipo de Webhook

En la pantalla de creación:

1. Selecciona **"Disparador o automatización"** como tipo de webhook
2. Haz clic en **"Siguiente"**

⚠️ **Importante:** Debe ser "Disparador o automatización", NO "HTTP target".

---

## Paso 3: Configurar los Campos del Webhook

Completa los siguientes campos:

### 📝 Nombre del Webhook

```
CXConnect WhatsApp Automatico
```

### 📄 Descripción

```
Webhook que envía mensajes de WhatsApp automáticamente a través de CXConnect cuando un ticket se marca como Resuelto y tiene la etiqueta no_contesto_whatsapp. Este webhook envía los datos al Cloudflare Worker que convierte el formato de JSON a form-urlencoded y limpia el número de teléfono.
```

### 🔗 URL de extremo (Endpoint URL)

Pega aquí la URL de tu Cloudflare Worker:

```
https://zendesk-cxconnect-middleware.tu-usuario.workers.dev
```

⚠️ **Reemplaza** `tu-usuario` con tu nombre de usuario real de Cloudflare Workers.

**Ejemplo real:**
```
https://zendesk-cxconnect-middleware.juan-perez.workers.dev
```

### 🔀 Método de solicitud

Selecciona: **`POST`**

### 📋 Formulario de solicitud

Selecciona: **`JSON`**

### 🔐 Autenticación

Selecciona: **`Ninguno`**

(No es necesaria autenticación para este Worker)

---

## Paso 4: Configurar el Cuerpo JSON

En el campo **"Cuerpo JSON"**, copia y pega exactamente el siguiente contenido:

```json
{
  "subdominio": "aplatam4961",
  "plantilla": "{\"destination\":{\"integrationId\":\"--integrationId--\",\"destinationId\":\"{{ticket.requester.phone}}\"},\"author\":{\"role\":\"appMaker\"},\"messageSchema\":\"whatsapp\",\"message\":{\"type\":\"template\",\"template\":{\"namespace\":\"--namespace--\",\"name\":\"2566_m_intentocontacto_na_plantillasasesores\",\"language\":{\"policy\":\"deterministic\",\"code\":\"es\"}}}}",
  "producto_id": "1156221",
  "telefono": "{{ticket.requester.phone}}",
  "nombre_plantilla": "2566_m_intentocontacto_na_plantillasasesores",
  "idusuario": "{{ticket.requester.id}}",
  "correousuario": "{{ticket.requester.email}}",
  "assigneedMail": "{{ticket.assignee.email}}",
  "assigneedId": "{{ticket.assignee.id}}"
}
```

### 📖 Explicación de los Placeholders

Los valores entre `{{...}}` son **placeholders de Zendesk** que se reemplazan automáticamente cuando se ejecuta el webhook:

| Placeholder | Descripción | Ejemplo |
|---|---|---|
| `{{ticket.requester.phone}}` | Teléfono del solicitante | `+52 55 1287 5673` |
| `{{ticket.requester.id}}` | ID del solicitante | `123456789` |
| `{{ticket.requester.email}}` | Email del solicitante | `cliente@example.com` |
| `{{ticket.assignee.email}}` | Email del agente asignado | `agente@empresa.com` |
| `{{ticket.assignee.id}}` | ID del agente asignado | `987654321` |

⚠️ **Importante:** NO modifiques los valores fijos como `"aplatam4961"`, `"1156221"`, o el nombre de la plantilla. Estos son valores específicos de tu configuración de CXConnect.

---

## Paso 5: Activar el Webhook

1. Asegúrate de que el toggle **"Estado"** esté en **ACTIVADO** (verde) ✅
2. Haz clic en **"Crear"** o **"Guardar"**

![Webhook Activado](https://via.placeholder.com/400x200?text=Estado:+ACTIVADO)

---

## Paso 6: Verificar la Configuración

Después de crear el webhook, verifica que:

- ✅ El webhook aparece en la lista de webhooks
- ✅ El estado es "Activo"
- ✅ La URL apunta a tu Cloudflare Worker
- ✅ El método es POST
- ✅ El formato es JSON

---

## Paso 7: Probar el Webhook Manualmente

Zendesk permite probar webhooks manualmente antes de conectarlos a un trigger:

1. En la lista de webhooks, haz clic en tu webhook **"CXConnect WhatsApp Automatico"**
2. Haz clic en el botón **"Probar"** o **"Test webhook"**
3. Zendesk enviará una petición de prueba usando datos de ejemplo
4. Revisa la respuesta:
   - ✅ **Código 200-299:** El Worker recibió y procesó la petición
   - ❌ **Código 400-499:** Error en el formato de datos
   - ❌ **Código 500-599:** Error en el Worker o en CXConnect

### 🔍 Interpretar los Resultados

**Respuesta exitosa (200):**
```json
{
  "status": "success",
  "message": "Mensaje enviado"
}
```

**Error común (400):**
```json
{
  "error": "Missing required field",
  "field": "telefono"
}
```

Si recibes un error, revisa:
1. El cuerpo JSON del webhook
2. Los logs del Cloudflare Worker
3. Que todos los placeholders estén correctos

---

## 📊 Ver Logs de Ejecución del Webhook

Para ver las ejecuciones del webhook:

1. Ve a **Admin Center** en Zendesk
2. Navega a **"Actividad"** → **"Registros de activación"**
3. Filtra por tu webhook: **"CXConnect WhatsApp Automatico"**
4. Verás todas las ejecuciones con:
   - Fecha y hora
   - Código de respuesta HTTP
   - Tiempo de respuesta
   - Ticket que lo activó

---

## 🔄 Actualizar el Webhook

Si necesitas modificar el webhook en el futuro:

1. Ve a **Admin Center** → **Apps y integraciones** → **Webhooks**
2. Haz clic en **"CXConnect WhatsApp Automatico"**
3. Haz clic en **"Editar"**
4. Realiza los cambios necesarios
5. Haz clic en **"Guardar"**

---

## ✅ Checklist de Configuración

- [ ] Webhook creado con nombre "CXConnect WhatsApp Automatico"
- [ ] Tipo: "Disparador o automatización"
- [ ] URL del Cloudflare Worker configurada correctamente
- [ ] Método: POST
- [ ] Formato: JSON
- [ ] Autenticación: Ninguno
- [ ] Cuerpo JSON copiado exactamente
- [ ] Webhook activado (toggle verde)
- [ ] Webhook probado manualmente
- [ ] Sin errores en la prueba

---

## ⚠️ Errores Comunes

### Error: "Invalid URL"
- **Causa:** La URL del Worker es incorrecta o inaccesible
- **Solución:** Verifica que la URL del Worker funcione (ábrela en el navegador)

### Error: "Timeout"
- **Causa:** El Worker tardó más de 30 segundos en responder
- **Solución:** Revisa los logs del Worker en Cloudflare

### Error: "400 Bad Request"
- **Causa:** Falta algún campo requerido o el formato es incorrecto
- **Solución:** Revisa que el cuerpo JSON esté completo y correcto

---

## ➡️ Siguiente Paso

Ahora que el webhook está configurado, el siguiente paso es crear el trigger que lo ejecutará cuando se cumplan las condiciones.

👉 **Continúa con:** [CONFIGURACION_TRIGGER_ZENDESK.md](./CONFIGURACION_TRIGGER_ZENDESK.md)

---

## 🆘 ¿Problemas?

Si tienes algún problema durante la configuración, consulta:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solución de problemas comunes
- Logs del webhook en Zendesk (Admin Center → Actividad → Registros de activación)
- Logs del Worker en Cloudflare Dashboard
