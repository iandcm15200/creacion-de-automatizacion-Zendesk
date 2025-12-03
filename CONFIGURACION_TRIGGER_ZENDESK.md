# ⚡ Configuración del Trigger en Zendesk

Esta guía te mostrará cómo configurar el trigger (disparador) que ejecutará el webhook automáticamente cuando un ticket cumpla las condiciones especificadas.

## 📋 Requisitos Previos

- ✅ Cloudflare Worker instalado y funcionando
- ✅ Webhook configurado en Zendesk
- ✅ Acceso de administrador a Zendesk

---

## ¿Qué es un Trigger?

Un **trigger** (disparador) en Zendesk es una regla automatizada que:
- **Monitorea** constantemente los cambios en los tickets
- **Evalúa** si se cumplen ciertas condiciones
- **Ejecuta** acciones automáticas cuando las condiciones se cumplen

En nuestro caso, el trigger detectará cuando un ticket:
1. ✅ Se marca como "Resuelto"
2. ✅ Tiene la etiqueta `no_contesto_whatsapp`
3. ✅ Tiene un número de teléfono

Y entonces ejecutará el webhook para enviar el WhatsApp.

---

## Paso 1: Acceder a los Disparadores

1. Inicia sesión en tu cuenta de Zendesk
2. Haz clic en el ícono de **"Admin"** (⚙️) en la barra lateral izquierda
3. En el **Admin Center**, navega a:
   - **Objetos y reglas** → **Reglas de negocio** → **Disparadores**
4. Haz clic en el botón **"Crear disparador"**

![Navegación a Disparadores](https://via.placeholder.com/800x400?text=Admin+Center+%3E+Objetos+y+reglas+%3E+Disparadores)

---

## Paso 2: Configurar la Información Básica

### 📝 Nombre del Disparador

```
Enviar WhatsApp al resolver ticket No Contesta
```

### 📄 Descripción

```
Automatización que envía mensajes de WhatsApp a través de CXConnect cuando un ticket se marca como Resuelto y tiene la etiqueta no_contesto_whatsapp. El mensaje se envía al número de teléfono del solicitante utilizando la plantilla configurada en CXConnect.
```

### 📂 Categoría (opcional)

Puedes crear una categoría llamada **"Automatizaciones WhatsApp"** para mantener organizados tus triggers.

---

## Paso 3: Configurar las Condiciones

Las condiciones determinan **cuándo** se ejecutará el trigger. Configura las siguientes condiciones para que cumplan **TODAS** (modo AND):

### 🎯 Condición 1: Estado del Ticket ha Cambiado a Resuelto

| Campo | Operador | Valor |
|---|---|---|
| **Ticket: Estado del ticket** | **Ha cambiado a** | **Resuelto** |

⚠️ **Importante:** Debe ser "Ha cambiado a", NO "Es". Esto asegura que el trigger solo se ejecute cuando el estado CAMBIA, no cuando ya está resuelto.

### 🏷️ Condición 2: Tiene la Etiqueta

| Campo | Operador | Valor |
|---|---|---|
| **Ticket: Etiquetas** | **Contiene al menos una de las siguientes** | `no_contesto_whatsapp` |

Escribe exactamente: `no_contesto_whatsapp` (sin espacios, todo en minúsculas)

### 📞 Condición 3: Tiene Número de Teléfono

| Campo | Operador | Valor |
|---|---|---|
| **Ticket: Teléfono del solicitante** | **No es** | `(vacío)` |

Esta condición previene errores al asegurar que siempre hay un número de teléfono antes de ejecutar el webhook.

### 📋 Resumen de Condiciones

El trigger se ejecutará cuando se cumplan **TODAS** estas condiciones:

```
✅ Ticket: Estado del ticket | Ha cambiado a | Resuelto
Y
✅ Ticket: Etiquetas | Contiene al menos una de las siguientes | no_contesto_whatsapp
Y
✅ Ticket: Teléfono del solicitante | No es | (vacío)
```

---

## Paso 4: Configurar las Acciones

Las acciones determinan **qué** sucederá cuando se cumplan las condiciones.

### 📤 Acción: Notificar Webhook

| Categoría | Acción | Webhook |
|---|---|---|
| **Notificaciones** | **Notificar webhook activo** | **CXConnect WhatsApp Automatico** |

1. En la sección "Acciones", haz clic en **"Agregar acción"**
2. Selecciona **"Notificaciones"** → **"Notificar webhook activo"**
3. En el dropdown, selecciona **"CXConnect WhatsApp Automatico"** (el webhook que creaste anteriormente)

⚠️ **Nota:** Si no ves tu webhook en la lista, verifica que:
- El webhook esté creado y activado
- Refrescaste la página después de crear el webhook

---

## Paso 5: Configurar Opciones Adicionales

### 🔄 Posición del Trigger

- **Recomendado:** Dejar en la posición por defecto
- Los triggers se ejecutan en orden de posición
- Si tienes otros triggers que también marcan tickets como resueltos, este debe estar DESPUÉS de ellos

### ⏱️ Ejecución

- **Modo:** En tiempo real (por defecto)
- El trigger se ejecutará inmediatamente cuando se cumplan las condiciones

---

## Paso 6: Activar el Trigger

1. Asegúrate de que el toggle **"Estado"** esté en **ACTIVADO** (verde) ✅
2. Haz clic en **"Crear"** o **"Guardar"**

![Trigger Activado](https://via.placeholder.com/400x200?text=Estado:+ACTIVADO)

---

## Paso 7: Verificar la Configuración

Después de crear el trigger, verifica que:

- ✅ El trigger aparece en la lista de disparadores
- ✅ El estado es "Activo"
- ✅ Las condiciones están configuradas correctamente
- ✅ La acción apunta al webhook correcto
- ✅ El webhook está activado

---

## 📖 Explicación de las Condiciones

### ¿Por qué "Ha cambiado a" en lugar de "Es"?

**Incorrecto ❌:**
```
Ticket: Estado del ticket | Es | Resuelto
```
Esto se ejecutaría cada vez que se actualice cualquier cosa en un ticket ya resuelto.

**Correcto ✅:**
```
Ticket: Estado del ticket | Ha cambiado a | Resuelto
```
Esto se ejecuta SOLO cuando el estado CAMBIA de otro estado (Nuevo, Abierto, Pendiente) a Resuelto.

### ¿Por qué verificar que el teléfono no esté vacío?

Si no validamos esto, el webhook se ejecutaría incluso sin número de teléfono, causando errores en CXConnect y logs innecesarios.

### ¿Por qué "Contiene al menos una de las siguientes"?

Permite que el ticket tenga otras etiquetas además de `no_contesto_whatsapp`. Solo necesitamos que esta etiqueta específica esté presente.

---

## 🧪 Probar el Trigger

Para probar que el trigger funciona correctamente:

### Crear Ticket de Prueba

1. Ve a **Workspace** en Zendesk
2. Crea un nuevo ticket con:
   - **Solicitante:** Un contacto con número de teléfono
   - **Número de teléfono:** `+52 55 1287 5673` (formato de ejemplo)
   - **Asunto:** "Prueba de automatización WhatsApp"
   - **Descripción:** "Ticket de prueba para validar el envío automático de WhatsApp"

### Agregar la Etiqueta

1. En el ticket, busca el campo de **"Etiquetas"** (Tags)
2. Agrega la etiqueta: `no_contesto_whatsapp`
3. Haz clic en **"Aplicar"**

### Cambiar el Estado a Resuelto

1. En el mismo ticket, cambia el estado a **"Resuelto"**
2. Haz clic en **"Enviar como resuelto"**

### Verificar la Ejecución

El trigger debería ejecutarse inmediatamente. Para verificarlo:

1. Ve a **Admin Center** → **Actividad** → **Registros de activación**
2. Busca tu trigger: **"Enviar WhatsApp al resolver ticket No Contesta"**
3. Deberías ver una entrada con:
   - ✅ Ticket ID (el ticket de prueba)
   - ✅ Timestamp (hace unos segundos)
   - ✅ Acción ejecutada: "Notificar webhook activo"

---

## 📊 Ver Logs de Ejecución del Trigger

### En Zendesk:

1. **Admin Center** → **Actividad** → **Registros de activación**
2. Filtra por el nombre del trigger
3. Aquí verás:
   - Cuándo se ejecutó
   - Qué ticket lo activó
   - Qué acciones se realizaron
   - Si hubo errores

### En Cloudflare:

1. Ve al dashboard de Cloudflare Workers
2. Selecciona tu worker
3. Ve a la pestaña **"Logs"**
4. Verás el procesamiento detallado:
   ```
   📨 Payload recibido de Zendesk
   📞 Teléfono original: +52 55 1287 5673 → Limpio: 525512875673
   📋 Plantilla parseada correctamente
   ✅ destinationId actualizado: 525512875673
   🚀 Enviando petición a CXConnect
   📥 Respuesta de CXConnect [200]
   ```

---

## 🔄 Modificar el Trigger

Si necesitas modificar el trigger en el futuro:

1. Ve a **Admin Center** → **Objetos y reglas** → **Disparadores**
2. Haz clic en **"Enviar WhatsApp al resolver ticket No Contesta"**
3. Haz clic en **"Editar"**
4. Realiza los cambios necesarios
5. Haz clic en **"Guardar"**

---

## 🎯 Casos de Uso y Escenarios

### ✅ Caso 1: Ticket Resuelto con Etiqueta
```
Estado: Nuevo → Resuelto
Etiqueta: no_contesto_whatsapp
Teléfono: +52 55 1287 5673
Resultado: ✅ Webhook ejecutado, WhatsApp enviado
```

### ✅ Caso 2: Ticket con Múltiples Etiquetas
```
Estado: Abierto → Resuelto
Etiquetas: urgente, no_contesto_whatsapp, seguimiento
Teléfono: +52 55 1287 5673
Resultado: ✅ Webhook ejecutado (la etiqueta está presente)
```

### ❌ Caso 3: Ticket Resuelto sin Etiqueta
```
Estado: Nuevo → Resuelto
Etiqueta: (ninguna)
Teléfono: +52 55 1287 5673
Resultado: ❌ Trigger NO ejecutado (falta etiqueta)
```

### ❌ Caso 4: Ticket con Etiqueta pero sin Teléfono
```
Estado: Nuevo → Resuelto
Etiqueta: no_contesto_whatsapp
Teléfono: (vacío)
Resultado: ❌ Trigger NO ejecutado (falta teléfono)
```

### ❌ Caso 5: Ticket Ya Resuelto (sin cambio de estado)
```
Estado: Resuelto → Resuelto (actualización del ticket)
Etiqueta: no_contesto_whatsapp
Teléfono: +52 55 1287 5673
Resultado: ❌ Trigger NO ejecutado (el estado no cambió)
```

---

## ✅ Checklist de Configuración

- [ ] Trigger creado con nombre descriptivo
- [ ] Condición 1: Estado del ticket "Ha cambiado a" Resuelto
- [ ] Condición 2: Etiquetas contiene "no_contesto_whatsapp"
- [ ] Condición 3: Teléfono del solicitante "No es" vacío
- [ ] Acción: Notificar webhook "CXConnect WhatsApp Automatico"
- [ ] Trigger activado (toggle verde)
- [ ] Trigger probado con ticket de prueba
- [ ] Ejecución verificada en logs de Zendesk
- [ ] Webhook ejecutado correctamente (verificado en Cloudflare)

---

## ⚠️ Errores Comunes

### Error: "Trigger no se ejecuta"
- **Causa 1:** El trigger está desactivado
  - **Solución:** Verifica que el toggle esté en verde (ACTIVADO)
  
- **Causa 2:** Las condiciones no se cumplen
  - **Solución:** Verifica que el ticket tenga la etiqueta, teléfono, y que el estado CAMBIE a resuelto

- **Causa 3:** Hay otro trigger que interfiere
  - **Solución:** Revisa la posición de los triggers y su orden de ejecución

### Error: "Webhook no se encuentra"
- **Causa:** El webhook está desactivado o fue eliminado
- **Solución:** Verifica que el webhook esté activo en la lista de webhooks

### Error: "Trigger se ejecuta múltiples veces"
- **Causa:** Hay triggers duplicados o condiciones incorrectas
- **Solución:** Revisa que solo exista un trigger con estas condiciones

---

## ➡️ Siguiente Paso

¡Felicidades! Tu automatización está completa. Ahora es momento de probarla end-to-end.

👉 **Continúa con:** [TESTING.md](./TESTING.md)

---

## 🆘 ¿Problemas?

Si tienes algún problema durante la configuración, consulta:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solución de problemas comunes
- Logs del trigger en Zendesk (Admin Center → Actividad → Registros de activación)
- Logs del webhook en Zendesk
- Logs del Worker en Cloudflare Dashboard
