# 🧪 Testing - Guía de Pruebas End-to-End

Esta guía te ayudará a probar toda la automatización de principio a fin para asegurarte de que todo funciona correctamente.

---

## 📋 Requisitos Previos

Antes de comenzar las pruebas, asegúrate de tener:

- ✅ Cloudflare Worker desplegado y funcionando
- ✅ Webhook de Zendesk configurado y activo
- ✅ Trigger de Zendesk configurado y activo
- ✅ Acceso a Zendesk como administrador
- ✅ Acceso a Cloudflare Dashboard para ver logs
- ✅ Un número de teléfono de prueba con WhatsApp activo

---

## 🎯 Objetivo de las Pruebas

Vamos a validar que:

1. El trigger detecta correctamente las condiciones
2. El webhook se ejecuta cuando el trigger se activa
3. El Cloudflare Worker limpia el teléfono correctamente
4. El Worker convierte el JSON a form-urlencoded
5. CXConnect recibe la petición en el formato correcto
6. El mensaje de WhatsApp se envía (o se reporta el error apropiado)

---

## 📝 Preparación del Test

### Paso 1: Abrir las Ventanas Necesarias

Abre estas pestañas en tu navegador ANTES de crear el ticket de prueba:

1. **Zendesk - Workspace:** Para crear y modificar el ticket
2. **Zendesk - Registros de Activación:** Admin Center → Actividad → Registros de activación
3. **Cloudflare - Worker Logs:** Dashboard → Workers & Pages → tu-worker → Logs → Begin log stream

Esto te permitirá ver en tiempo real qué sucede cuando ejecutes la automatización.

### Paso 2: Datos de Prueba

Utiliza estos datos para el test:

| Campo | Valor de Prueba |
|---|---|
| **Teléfono** | `+52 55 1287 5673` |
| **Etiqueta** | `no_contesto_whatsapp` |
| **Asunto** | "Test Automatización WhatsApp #[FECHA]" |
| **Solicitante** | Contacto de prueba con email válido |

💡 **Tip:** Incluye la fecha en el asunto para identificar fácilmente este ticket en los logs.

---

## 🚀 Test 1: Caso Exitoso (Happy Path)

Este test valida el flujo completo cuando todo funciona correctamente.

### Paso 1: Crear Contacto de Prueba (si no existe)

1. En Zendesk, ve a **Clientes** en la barra lateral
2. Haz clic en **"Agregar cliente"**
3. Completa:
   - **Nombre:** Test Automation User
   - **Email:** test-automation@example.com
   - **Teléfono:** `+52 55 1287 5673`
4. Haz clic en **"Agregar"**

### Paso 2: Crear Ticket de Prueba

1. En Zendesk Workspace, haz clic en **"Nuevo ticket"**
2. Configura el ticket:
   - **Solicitante:** Test Automation User (el que creaste)
   - **Asunto:** `Test Automatización WhatsApp 2024-12-03`
   - **Descripción:** 
     ```
     Este es un ticket de prueba para validar que la automatización
     de WhatsApp funciona correctamente. 
     
     Test ID: TEST-001
     Fecha: 2024-12-03
     ```
   - **Estado:** Nuevo (NO lo marques como resuelto todavía)
   - **Tipo:** Pregunta
   - **Prioridad:** Normal

3. En el campo **"Etiquetas"**:
   - Escribe: `no_contesto_whatsapp`
   - Presiona Enter para añadir la etiqueta

4. Haz clic en **"Enviar"** (esto crea el ticket en estado "Nuevo")

### Paso 3: Verificar Datos del Ticket

Antes de continuar, verifica que el ticket tenga:

- ✅ Estado: Nuevo (o Abierto)
- ✅ Etiqueta: `no_contesto_whatsapp` visible
- ✅ Solicitante con teléfono: `+52 55 1287 5673`

### Paso 4: Cambiar Estado a Resuelto

1. Abre el ticket que acabas de crear
2. En el campo de respuesta, escribe algo como: "Ticket de prueba resuelto"
3. **Cambia el estado a "Resuelto"**
4. Haz clic en **"Enviar como resuelto"**

⏱️ **Tiempo esperado:** La automatización debería ejecutarse inmediatamente (1-5 segundos).

### Paso 5: Verificar Ejecución en Zendesk

1. Ve a la pestaña de **Registros de Activación** que abriste previamente
2. Haz clic en **"Actualizar"** o refresca la página
3. Deberías ver una nueva entrada:
   - **Trigger:** Enviar WhatsApp al resolver ticket No Contesta
   - **Ticket:** El ID de tu ticket de prueba
   - **Estado:** Ejecutado ✅
   - **Acciones:** Notificar webhook activo: CXConnect WhatsApp Automatico

### Paso 6: Verificar Logs del Worker

1. Ve a la pestaña de **Cloudflare Worker Logs**
2. Deberías ver una secuencia de logs como esta:

```
📨 Payload recibido de Zendesk: {...telefono: "***5673"...}

📞 Teléfono original: ***5673 → Limpio: ***5673

📋 Plantilla parseada correctamente

✅ destinationId actualizado: ***5673

📤 Payload preparado para CXConnect con teléfono: ***5673

🚀 Enviando petición a CXConnect: https://cxconnectav-aol.cxclatam.com/api/v2/play-one-to-one-proactive

📥 Respuesta de CXConnect [200]: {"status":"success","messageId":"..."}
```

⚠️ **Nota de Seguridad:** Los logs muestran solo los últimos 4 dígitos del teléfono para proteger datos sensibles.

### Paso 7: Interpretar los Resultados

#### ✅ Test EXITOSO si:

- El trigger se ejecutó
- El webhook se llamó
- El Worker procesó los datos correctamente
- El teléfono se limpió: `+52 55 1287 5673` → `525512875673` (solo verás `***5673` en logs)
- CXConnect retornó código 200
- La respuesta contiene `"status":"success"`

#### ❌ Test FALLIDO si:

- El trigger no aparece en los logs
- El webhook no se ejecutó
- El Worker retornó error 400/500
- CXConnect retornó error 400/500

Si el test falla, consulta [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## 🧪 Test 2: Sin Etiqueta (Debe Fallar)

Este test valida que el trigger NO se ejecute cuando falta la etiqueta.

### Paso 1: Crear Ticket sin Etiqueta

1. Crea un nuevo ticket con los mismos datos del Test 1
2. **NO agregues la etiqueta `no_contesto_whatsapp`**
3. Cambia el estado a "Resuelto"

### Paso 2: Verificar que NO se Ejecuta

1. Ve a los Registros de Activación
2. **NO debería aparecer una nueva ejecución del trigger** para este ticket
3. Los logs del Worker en Cloudflare **NO deberían mostrar nueva actividad**

### Resultado Esperado:

- ✅ El trigger NO se ejecuta (comportamiento correcto)
- ✅ El webhook NO se llama

---

## 🧪 Test 3: Sin Teléfono (Debe Fallar)

Este test valida que el trigger NO se ejecute cuando falta el teléfono.

### Paso 1: Crear Contacto sin Teléfono

1. Crea un nuevo contacto: "Test No Phone"
2. Email: test-no-phone@example.com
3. **NO agregues teléfono**

### Paso 2: Crear Ticket sin Teléfono

1. Crea un nuevo ticket para este contacto
2. Agrega la etiqueta: `no_contesto_whatsapp`
3. Cambia el estado a "Resuelto"

### Paso 3: Verificar que NO se Ejecuta

1. El trigger NO debería ejecutarse
2. Los logs deberían estar vacíos

### Resultado Esperado:

- ✅ El trigger NO se ejecuta (comportamiento correcto)
- ✅ Protege contra errores cuando falta el teléfono

---

## 🧪 Test 4: Ticket Ya Resuelto (Debe Fallar)

Este test valida que el trigger NO se ejecute cuando el estado no CAMBIA.

### Paso 1: Crear Ticket Ya Resuelto

1. Crea un nuevo ticket
2. Agrégale la etiqueta `no_contesto_whatsapp`
3. Marca el ticket como "Resuelto" inmediatamente
4. Una vez resuelto, **actualiza algún campo** (por ejemplo, prioridad)

### Paso 2: Verificar que NO se Ejecuta

1. El trigger NO debería ejecutarse para la actualización
2. Solo se ejecutaría si el estado CAMBIARA de Nuevo/Abierto a Resuelto

### Resultado Esperado:

- ✅ El trigger NO se ejecuta en la actualización
- ✅ Solo se ejecuta cuando el estado CAMBIA a Resuelto

---

## 🧪 Test 5: Formato de Teléfono Variado

Este test valida que el Worker limpia correctamente diferentes formatos de teléfono.

### Casos de Prueba:

| Formato Original | Formato Esperado Limpio | Resultado |
|---|---|---|
| `+52 55 1287 5673` | `525512875673` | ✅ |
| `52 55 1287 5673` | `525512875673` | ✅ |
| `+52-55-1287-5673` | `525512875673` | ✅ |
| `(52) 55 1287 5673` | `525512875673` | ✅ |
| `525512875673` | `525512875673` | ✅ |

### Paso 1: Para Cada Formato

1. Actualiza el teléfono del contacto de prueba con cada formato
2. Crea un nuevo ticket con la etiqueta
3. Marca como resuelto
4. Verifica en los logs del Worker que el teléfono se limpie correctamente

### Paso 2: Verificar en Logs

```
📞 Teléfono original: [formato original] → Limpio: 525512875673
```

### Resultado Esperado:

- ✅ Todos los formatos se limpian a `525512875673`
- ✅ No hay errores de formato

---

## 📊 Checklist de Validación Completa

Usa esta checklist después de completar todos los tests:

### Configuración

- [ ] Cloudflare Worker desplegado
- [ ] URL del Worker es accesible
- [ ] Webhook de Zendesk creado y activo
- [ ] Webhook apunta a la URL correcta del Worker
- [ ] Trigger de Zendesk creado y activo
- [ ] Trigger tiene las condiciones correctas
- [ ] Trigger está conectado al webhook correcto

### Test 1: Caso Exitoso

- [ ] Ticket creado con todos los datos correctos
- [ ] Etiqueta `no_contesto_whatsapp` agregada
- [ ] Estado cambiado de Nuevo a Resuelto
- [ ] Trigger ejecutado (visible en logs de Zendesk)
- [ ] Webhook llamado (visible en logs de Zendesk)
- [ ] Worker procesó la petición (visible en logs de Cloudflare)
- [ ] Teléfono limpiado correctamente
- [ ] CXConnect retornó 200 OK
- [ ] Respuesta contiene "status":"success"

### Test 2: Sin Etiqueta

- [ ] Ticket creado sin etiqueta
- [ ] Estado cambiado a Resuelto
- [ ] Trigger NO ejecutado (comportamiento correcto)

### Test 3: Sin Teléfono

- [ ] Ticket creado sin teléfono en el solicitante
- [ ] Etiqueta agregada
- [ ] Estado cambiado a Resuelto
- [ ] Trigger NO ejecutado (comportamiento correcto)

### Test 4: Ticket Ya Resuelto

- [ ] Ticket ya estaba en estado Resuelto
- [ ] Se actualizó otro campo del ticket
- [ ] Trigger NO ejecutado (comportamiento correcto)

### Test 5: Formatos de Teléfono

- [ ] Formato con `+` y espacios: ✅ Limpio correctamente
- [ ] Formato con guiones: ✅ Limpio correctamente
- [ ] Formato con paréntesis: ✅ Limpio correctamente
- [ ] Formato sin caracteres especiales: ✅ Sin cambios

---

## 🔍 Cómo Interpretar los Logs

### Logs de Zendesk - Registros de Activación

**Ejemplo de ejecución exitosa:**
```
Trigger: Enviar WhatsApp al resolver ticket No Contesta
Ticket: #46356
Ejecutado: 2024-12-03 10:30:15
Acciones:
  ✓ Notificar webhook activo: CXConnect WhatsApp Automatico
```

**Ejemplo de NO ejecución (falta condición):**
```
(No aparece ninguna entrada para el ticket)
```

### Logs del Worker en Cloudflare

**Ejemplo de procesamiento exitoso:**
```
[2024-12-03 10:30:15] 📨 Payload recibido de Zendesk: {...telefono: "***5673"...}
[2024-12-03 10:30:15] 📞 Teléfono original: ***5673 → Limpio: ***5673
[2024-12-03 10:30:15] 📋 Plantilla parseada correctamente
[2024-12-03 10:30:15] ✅ destinationId actualizado: ***5673
[2024-12-03 10:30:15] 📤 Payload preparado para CXConnect con teléfono: ***5673
[2024-12-03 10:30:15] 🚀 Enviando petición a CXConnect: https://...
[2024-12-03 10:30:16] 📥 Respuesta de CXConnect [200]: {"status":"success"}
```

**Ejemplo de error (campo faltante):**
```
[2024-12-03 10:30:15] 📨 Payload recibido de Zendesk: {...}
[2024-12-03 10:30:15] ❌ Campo requerido faltante: telefono
```

**Ejemplo de error (teléfono vacío):**
```
[2024-12-03 10:30:15] 📨 Payload recibido de Zendesk: {...}
[2024-12-03 10:30:15] 📞 Teléfono original: ***() → Limpio: 
[2024-12-03 10:30:15] ❌ El teléfono limpio está vacío
```

---

## 🎯 Ejemplos de Respuestas

### Respuesta Exitosa de CXConnect (200)

```json
{
  "status": "success",
  "messageId": "wamid.HBgNNTI1NTEyODc1NjczFQIAERgSN...",
  "timestamp": "2024-12-03T10:30:16Z"
}
```

### Respuesta de Error de CXConnect (400)

```json
{
  "error": "Invalid phone number",
  "message": "The phone number format is invalid",
  "code": "INVALID_PHONE"
}
```

### Respuesta de Error del Worker (400)

```json
{
  "error": "Missing required field",
  "field": "telefono"
}
```

### Respuesta de Error del Worker (500)

```json
{
  "error": "Internal server error",
  "message": "Unexpected token < in JSON at position 0"
}
```

---

## 📈 Métricas de Éxito

Después de completar todos los tests, deberías tener:

| Métrica | Objetivo | Tu Resultado |
|---|---|---|
| Test 1: Caso exitoso | ✅ Pasa | [ ] |
| Test 2: Sin etiqueta | ✅ No ejecuta | [ ] |
| Test 3: Sin teléfono | ✅ No ejecuta | [ ] |
| Test 4: Ya resuelto | ✅ No ejecuta | [ ] |
| Test 5: Formatos variados | ✅ Todos limpios | [ ] |
| Tiempo de respuesta | < 3 segundos | [ ] |
| Tasa de error | 0% | [ ] |

---

## 🚨 Qué Hacer si un Test Falla

1. **No entrar en pánico** - es normal encontrar problemas en las pruebas
2. **Identifica el test que falló** - usa la checklist
3. **Lee el mensaje de error** en los logs
4. **Consulta TROUBLESHOOTING.md** para soluciones comunes
5. **Revisa las configuraciones** del componente que falla
6. **Prueba manualmente** ese componente individual
7. **Ejecuta el test nuevamente** después de hacer correcciones

---

## ✅ Aprobación Final

Cuando todos los tests pasen, tu automatización está lista para producción.

**Última verificación:**

- [ ] Todos los tests de esta guía pasaron exitosamente
- [ ] No hay errores en los logs de Cloudflare
- [ ] No hay errores en los logs de Zendesk
- [ ] La configuración está documentada
- [ ] El equipo está entrenado en cómo usar la automatización
- [ ] Sabes cómo acceder a los logs para monitoreo

---

## 📞 Soporte Post-Implementación

Después de implementar en producción:

### Monitoreo Regular

- Revisa los logs de Cloudflare semanalmente
- Revisa los logs de Zendesk semanalmente
- Monitorea el número de ejecuciones exitosas vs fallidas

### Mantenimiento

- Mantén actualizada la documentación
- Actualiza el Worker si hay cambios en CXConnect
- Actualiza el webhook/trigger si cambian los requisitos

### Recursos

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solución de problemas
- [README.md](./README.md) - Documentación completa
- Logs de Cloudflare y Zendesk

---

## 🎉 ¡Felicidades!

Si llegaste hasta aquí y todos los tests pasaron, has implementado exitosamente la automatización Zendesk → CXConnect WhatsApp. 

Tu sistema ahora puede enviar mensajes de WhatsApp automáticamente cuando los tickets se resuelven. 🚀📱✨
