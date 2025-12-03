# 🔧 Troubleshooting - Solución de Problemas

Esta guía te ayudará a resolver los problemas más comunes que puedes encontrar al configurar y usar la automatización Zendesk → CXConnect WhatsApp.

---

## 📋 Índice de Problemas

1. [El Trigger no se Ejecuta](#problema-1-el-trigger-no-se-ejecuta)
2. [Error 400 de CXConnect](#problema-2-error-400-de-cxconnect)
3. [Webhook no se Ejecuta](#problema-3-webhook-no-se-ejecuta)
4. [El Teléfono tiene Formato Incorrecto](#problema-4-el-teléfono-tiene-formato-incorrecto)
5. [Error 500 del Cloudflare Worker](#problema-5-error-500-del-cloudflare-worker)
6. [Timeout en el Webhook](#problema-6-timeout-en-el-webhook)
7. [El WhatsApp no Llega al Cliente](#problema-7-el-whatsapp-no-llega-al-cliente)

---

## Problema 1: El Trigger no se Ejecuta

### 🔍 Síntomas
- Cambias el ticket a "Resuelto" con la etiqueta `no_contesto_whatsapp`
- No aparece ninguna ejecución en los logs de Zendesk
- El webhook nunca se llama

### ✅ Soluciones

#### Verificación 1: Trigger Activo
1. Ve a **Admin Center** → **Objetos y reglas** → **Disparadores**
2. Busca tu trigger: **"Enviar WhatsApp al resolver ticket No Contesta"**
3. Verifica que el toggle esté en **ACTIVADO** (verde) ✅
4. Si está desactivado, actívalo y guarda

#### Verificación 2: Condiciones del Trigger
Revisa que las condiciones estén configuradas EXACTAMENTE así:

```
✅ Ticket: Estado del ticket | Ha cambiado a | Resuelto
Y
✅ Ticket: Etiquetas | Contiene al menos una de las siguientes | no_contesto_whatsapp
Y
✅ Ticket: Teléfono del solicitante | No es | (vacío)
```

**Errores comunes:**
- ❌ Usar "Es" en lugar de "Ha cambiado a"
- ❌ Escribir mal la etiqueta: `no_contesto_whatsapp` (debe ser exacta, sin espacios)
- ❌ No validar el teléfono

#### Verificación 3: El Estado DEBE Cambiar
El trigger solo se ejecuta cuando el estado **CAMBIA** de otro estado a "Resuelto".

**NO funciona:**
```
Ticket ya está en Resuelto → Se actualiza algo → Sigue en Resuelto
```

**SÍ funciona:**
```
Ticket está en Nuevo/Abierto/Pendiente → Se cambia a Resuelto
```

**Solución:** Si el ticket ya estaba resuelto, cambia el estado a "Abierto" primero, y luego a "Resuelto" nuevamente.

#### Verificación 4: Revisar Logs de Activación
1. Ve a **Admin Center** → **Actividad** → **Registros de activación**
2. Busca el ticket que estás probando
3. Si no aparece tu trigger, verifica las condiciones nuevamente
4. Si aparece pero no ejecuta el webhook, verifica el webhook

#### Verificación 5: Teléfono del Solicitante
1. Abre el ticket de prueba
2. Verifica que el **solicitante** tenga un número de teléfono
3. El campo debe estar en el perfil del solicitante (no solo en el ticket)
4. Formato aceptable: `+52 55 1287 5673` o `525512875673`

---

## Problema 2: Error 400 de CXConnect

### 🔍 Síntomas
- El trigger se ejecuta
- El webhook se llama
- Pero CXConnect retorna error 400 (Bad Request)

### ✅ Soluciones

#### Verificación 1: Formato del Teléfono
1. Ve a los logs del Cloudflare Worker
2. Busca la línea: `📞 Teléfono original: ... → Limpio: ...`
3. Verifica que el teléfono limpio sea correcto: `525512875673`

**Ejemplos correctos:**
```
+52 55 1287 5673  →  525512875673  ✅
52 55 1287 5673   →  525512875673  ✅
+52-55-1287-5673  →  525512875673  ✅
```

**Ejemplos incorrectos:**
```
1287 5673         →  12875673      ❌ (falta código de país)
(vacío)           →  (vacío)       ❌ (sin teléfono)
```

#### Verificación 2: Campos Requeridos
Revisa los logs del Worker para verificar que todos los campos lleguen:

```javascript
{
  "subdominio": "aplatam4961",           // ✅ Debe estar presente
  "plantilla": "{...}",                  // ✅ Debe ser un JSON string válido
  "producto_id": "1156221",              // ✅ Debe estar presente
  "telefono": "+52 55 1287 5673",        // ✅ Debe estar presente
  "nombre_plantilla": "2566_...",        // ✅ Debe estar presente
  "idusuario": "123456",                 // ⚠️ Opcional
  "correousuario": "user@example.com",   // ⚠️ Opcional
  "assigneedMail": "agent@example.com",  // ⚠️ Opcional
  "assigneedId": "789"                   // ⚠️ Opcional
}
```

#### Verificación 3: Estructura del Cuerpo JSON en Zendesk
1. Ve al webhook en Zendesk
2. Revisa que el cuerpo JSON esté exactamente como se especifica en [CONFIGURACION_WEBHOOK_ZENDESK.md](./CONFIGURACION_WEBHOOK_ZENDESK.md)
3. Presta especial atención a:
   - Las comillas escapadas en el campo `plantilla`: `\"`
   - Los placeholders: `{{ticket.requester.phone}}`
   - Los IDs y nombres correctos

#### Verificación 4: IDs de CXConnect
Verifica que los valores de CXConnect sean correctos:

```
subdominio: aplatam4961
producto_id: 1156221
nombre_plantilla: 2566_m_intentocontacto_na_plantillasasesores
```

Si alguno de estos es incorrecto, CXConnect rechazará la petición.

---

## Problema 3: Webhook no se Ejecuta

### 🔍 Síntomas
- El trigger se ejecuta (aparece en logs)
- Pero el webhook nunca se llama (no aparece en logs de Cloudflare)

### ✅ Soluciones

#### Verificación 1: Webhook Activo
1. Ve a **Admin Center** → **Apps y integraciones** → **Webhooks**
2. Busca tu webhook: **"CXConnect WhatsApp Automatico"**
3. Verifica que el toggle esté en **ACTIVADO** (verde) ✅

#### Verificación 2: URL del Cloudflare Worker
1. Abre el webhook en Zendesk
2. Verifica la **URL de extremo**
3. Cópiala y ábrela en un navegador
4. Deberías ver un error 405 (Method Not Allowed) con el mensaje:
   ```json
   {
     "error": "Method not allowed",
     "message": "Este endpoint solo acepta peticiones POST"
   }
   ```
5. Si ves esto, el Worker está funcionando ✅

**Si no carga:**
- ❌ La URL es incorrecta
- ❌ El Worker no está desplegado
- ❌ El Worker fue eliminado

#### Verificación 3: Conexión del Trigger con el Webhook
1. Ve al trigger en Zendesk
2. En la sección de **Acciones**, verifica que la acción sea:
   ```
   Notificaciones → Notificar webhook activo → CXConnect WhatsApp Automatico
   ```
3. Si el webhook no aparece en la lista, significa que está desactivado

#### Verificación 4: Probar el Webhook Manualmente
1. En la lista de webhooks, haz clic en tu webhook
2. Haz clic en **"Probar"**
3. Revisa la respuesta
4. Si funciona aquí pero no desde el trigger, el problema está en el trigger

---

## Problema 4: El Teléfono tiene Formato Incorrecto

### 🔍 Síntomas
- El Worker limpia el teléfono, pero el formato sigue siendo incorrecto
- CXConnect rechaza la petición por formato de teléfono inválido

### ✅ Soluciones

#### Verificación 1: Logs del Worker
1. Ve a Cloudflare Dashboard → Workers → tu-worker → Logs
2. Busca la línea que muestra el teléfono:
   ```
   📞 Teléfono original: ***5673 → Limpio: ***5673
   ```
3. Verifica que los últimos 4 dígitos coincidan con el teléfono esperado

⚠️ **Nota:** Los logs muestran solo los últimos 4 dígitos por seguridad.

#### Verificación 2: Código de Limpieza
El Worker elimina estos caracteres: `+`, espacios, `-`, `(`, `)`

**Si el teléfono tiene otros caracteres** (ejemplo: `.`, `/`, etc.), necesitarás actualizar el Worker:

```javascript
// En cloudflare-worker.js, línea ~57
// Código actual (limpia +, espacios, -, (, ))
cleanPhone = cleanPhone.replace(/[\s+\-()]/g, '');

// Si necesitas limpiar también puntos y barras:
cleanPhone = cleanPhone.replace(/[\s+\-().\/]/g, '');
```

#### Verificación 3: Formato del Teléfono en Zendesk
1. Verifica que el teléfono en Zendesk tenga el formato correcto
2. Formato recomendado: `+52 55 1287 5673`
3. El código de país (52 para México) debe estar incluido

#### Verificación 4: Validación del Teléfono Limpio
El Worker valida que el teléfono limpio no esté vacío. Si lo está, retorna error 400.

Revisa los logs:
```
❌ El teléfono limpio está vacío
```

Esto puede pasar si:
- El teléfono original solo contenía caracteres especiales: `+----()`
- El campo telefono es null o undefined

---

## Problema 5: Error 500 del Cloudflare Worker

### 🔍 Síntomas
- El webhook se ejecuta
- Pero el Worker retorna error 500 (Internal Server Error)

### ✅ Soluciones

#### Verificación 1: Logs del Worker
1. Ve a Cloudflare Dashboard → Workers → tu-worker → Logs
2. Busca la línea: `❌ Error en el Worker:`
3. Lee el mensaje de error y el stack trace

#### Verificación 2: Error al Parsear Plantilla
Error común:
```
❌ Error al parsear plantilla: Unexpected token ...
```

**Causa:** El campo `plantilla` en el webhook de Zendesk no es un JSON válido.

**Solución:**
1. Ve al webhook en Zendesk
2. Verifica que el campo `plantilla` tenga las comillas escapadas correctamente: `\"`
3. Usa un validador JSON para verificar la sintaxis

#### Verificación 3: Error de Red a CXConnect
Error común:
```
❌ Error en el Worker: fetch failed
```

**Causa:** No se puede conectar a CXConnect.

**Solución:**
1. Verifica que la URL de CXConnect sea correcta:
   ```
   https://cxconnectav-aol.cxclatam.com/api/v2/play-one-to-one-proactive
   ```
2. Intenta hacer una petición manual con cURL para verificar que el endpoint esté disponible

#### Verificación 4: Código del Worker
Si el error persiste, revisa el código del Worker:
1. Ve a Cloudflare Dashboard → Workers → tu-worker
2. Haz clic en "Edit code"
3. Verifica que el código sea exactamente el de `cloudflare-worker.js`
4. Si hiciste modificaciones, revisa que no haya errores de sintaxis

---

## Problema 6: Timeout en el Webhook

### 🔍 Síntomas
- El webhook se ejecuta
- Pero tarda mucho y eventualmente da timeout (30 segundos)

### ✅ Soluciones

#### Verificación 1: Tiempo de Respuesta de CXConnect
1. Revisa los logs del Worker
2. Busca el tiempo entre estas dos líneas:
   ```
   🚀 Enviando petición a CXConnect: ...
   📥 Respuesta de CXConnect [200]: ...
   ```
3. Si tarda más de 25 segundos, CXConnect está lento

**Solución:** Contacta al soporte de CXConnect para reportar el problema de rendimiento.

#### Verificación 2: Worker en Límite de CPU
Los Workers gratuitos tienen límite de 10ms de CPU por request.

**Solución:** Este Worker es muy simple y no debería alcanzar el límite. Si lo hace, revisa que no haya loops infinitos en el código.

---

## Problema 7: El WhatsApp no Llega al Cliente

### 🔍 Síntomas
- El trigger se ejecuta ✅
- El webhook se ejecuta ✅
- El Worker procesa correctamente ✅
- CXConnect retorna 200 OK ✅
- Pero el cliente no recibe el WhatsApp ❌

### ✅ Soluciones

#### Verificación 1: Respuesta de CXConnect
1. Revisa los logs del Worker
2. Busca la respuesta de CXConnect:
   ```
   📥 Respuesta de CXConnect [200]: {"status":"success","messageId":"..."}
   ```
3. Si el status es "success" pero no llega el mensaje, el problema está en CXConnect

#### Verificación 2: Número de Teléfono Válido
1. Verifica que el número sea válido y esté activo en WhatsApp
2. Prueba enviar un WhatsApp manual al número para verificar que exista

#### Verificación 3: Plantilla de WhatsApp
1. Verifica que la plantilla exista en CXConnect:
   ```
   2566_m_intentocontacto_na_plantillasasesores
   ```
2. Verifica que la plantilla esté aprobada por WhatsApp
3. Verifica que el namespace y el integrationId sean correctos

#### Verificación 4: Límites de CXConnect
CXConnect puede tener límites de:
- Mensajes por día
- Mensajes por hora
- Mensajes al mismo número

**Solución:** Contacta al soporte de CXConnect para verificar estos límites.

---

## 🔍 Cómo Ver Logs

### En Zendesk

#### Registros de Activación del Trigger
1. **Admin Center** → **Actividad** → **Registros de activación**
2. Filtra por tu trigger: **"Enviar WhatsApp al resolver ticket No Contesta"**
3. Información visible:
   - Fecha y hora de ejecución
   - Ticket que lo activó
   - Condiciones evaluadas
   - Acciones ejecutadas

#### Registros del Webhook
1. **Admin Center** → **Apps y integraciones** → **Webhooks**
2. Haz clic en tu webhook
3. Haz clic en la pestaña **"Registros"** o **"Logs"**
4. Información visible:
   - Fecha y hora de la petición
   - Código de respuesta HTTP
   - Tiempo de respuesta
   - Body de respuesta

### En Cloudflare

#### Logs en Tiempo Real
1. Ve a **Workers & Pages** en Cloudflare Dashboard
2. Haz clic en tu worker
3. Haz clic en la pestaña **"Logs"**
4. Haz clic en **"Begin log stream"**
5. Información visible:
   ```
   📨 Payload recibido de Zendesk: {...}
   📞 Teléfono original: +52 55 1287 5673 → Limpio: 525512875673
   📋 Plantilla parseada correctamente
   ✅ destinationId actualizado: 525512875673
   📤 Payload preparado para CXConnect (form-urlencoded): ...
   🚀 Enviando petición a CXConnect: ...
   📥 Respuesta de CXConnect [200]: ...
   ```

#### Logs Históricos
1. En la pestaña **"Logs"** del worker
2. Puedes ver logs de las últimas 24 horas
3. Usa los filtros para buscar logs específicos

---

## 🧪 Cómo Probar Manualmente

### Crear Ticket de Prueba

#### Paso 1: Crear el Ticket
1. Ve a **Workspace** en Zendesk
2. Haz clic en **"Nuevo ticket"**
3. Configura:
   - **Solicitante:** Contacto existente o crea uno nuevo
   - **Asunto:** "Prueba de automatización WhatsApp"
   - **Descripción:** "Ticket de prueba para validar el envío automático de WhatsApp"
   - **Estado:** "Nuevo" (no resuelto todavía)

#### Paso 2: Configurar el Teléfono
1. Haz clic en el **solicitante**
2. En el perfil del solicitante, agrega el teléfono: `+52 55 1287 5673`
3. Guarda el perfil

#### Paso 3: Agregar la Etiqueta
1. En el ticket, busca el campo **"Etiquetas"**
2. Escribe: `no_contesto_whatsapp`
3. Presiona Enter para agregar la etiqueta

#### Paso 4: Resolver el Ticket
1. Cambia el estado a **"Resuelto"**
2. Haz clic en **"Enviar como resuelto"**

#### Paso 5: Verificar
1. Ve a los logs de Zendesk (Registros de activación)
2. Ve a los logs de Cloudflare (Worker logs)
3. Verifica que todo se ejecutó correctamente

---

## 📊 Tabla de Códigos de Respuesta HTTP

| Código | Significado | Causa Común | Solución |
|---|---|---|---|
| **200** | OK | Todo correcto ✅ | - |
| **400** | Bad Request | Datos incorrectos o faltantes | Revisa el formato de los datos |
| **404** | Not Found | URL incorrecta | Verifica la URL del Worker o de CXConnect |
| **405** | Method Not Allowed | Método HTTP incorrecto | Debe ser POST, no GET |
| **500** | Internal Server Error | Error en el Worker | Revisa los logs del Worker |
| **502** | Bad Gateway | Worker no puede conectar a CXConnect | Verifica la URL de CXConnect |
| **504** | Gateway Timeout | CXConnect tardó más de 30 segundos | Reporta a soporte de CXConnect |

---

## 🆘 Checklist de Debugging

Usa este checklist cuando tengas un problema:

- [ ] ¿El trigger está activo?
- [ ] ¿El webhook está activo?
- [ ] ¿El Worker está desplegado y la URL es correcta?
- [ ] ¿El ticket tiene la etiqueta `no_contesto_whatsapp`?
- [ ] ¿El ticket tiene un número de teléfono?
- [ ] ¿El estado del ticket CAMBIÓ a Resuelto?
- [ ] ¿El trigger aparece en los logs de Zendesk?
- [ ] ¿El webhook aparece en los logs de Zendesk?
- [ ] ¿El Worker aparece en los logs de Cloudflare?
- [ ] ¿El teléfono se limpió correctamente? (sin +, espacios, etc.)
- [ ] ¿CXConnect retornó 200 OK?
- [ ] ¿La respuesta de CXConnect tiene status "success"?

---

## 📞 Contacto y Soporte

Si después de seguir esta guía el problema persiste:

1. **Recopila esta información:**
   - Ticket ID que estás probando
   - Screenshots de las configuraciones
   - Logs de Zendesk (Registros de activación)
   - Logs de Cloudflare (Worker logs)
   - Mensaje de error exacto

2. **Recursos adicionales:**
   - [Documentación de Zendesk Webhooks](https://support.zendesk.com/hc/es/articles/4408839108378)
   - [Documentación de Cloudflare Workers](https://developers.cloudflare.com/workers/)
   - [Documentación de CXConnect](https://cxconnectav-aol.cxclatam.com/docs)

3. **Verifica nuevamente:**
   - [INSTALACION_CLOUDFLARE.md](./INSTALACION_CLOUDFLARE.md)
   - [CONFIGURACION_WEBHOOK_ZENDESK.md](./CONFIGURACION_WEBHOOK_ZENDESK.md)
   - [CONFIGURACION_TRIGGER_ZENDESK.md](./CONFIGURACION_TRIGGER_ZENDESK.md)
   - [TESTING.md](./TESTING.md)
