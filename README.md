# 🤖 Automatización Zendesk → CXConnect WhatsApp

Sistema automatizado que envía mensajes de WhatsApp a través de CXConnect cuando un ticket de Zendesk se marca como "Resuelto" y tiene la etiqueta "no_contesto_whatsapp".

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![Zendesk](https://img.shields.io/badge/Zendesk-Integration-green)](https://www.zendesk.com/)
[![CXConnect](https://img.shields.io/badge/CXConnect-WhatsApp-blue)](https://cxclatam.com/)

---

## 📋 Índice

- [Descripción del Problema](#-descripción-del-problema)
- [Solución Implementada](#-solución-implementada)
- [Diagrama de Flujo](#-diagrama-de-flujo)
- [Arquitectura](#-arquitectura)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Datos Técnicos](#-datos-técnicos)
- [Ejemplo de Uso](#-ejemplo-de-uso)
- [Costos](#-costos)
- [FAQ](#-faq)
- [Troubleshooting](#-troubleshooting)
- [Licencia](#-licencia)

---

## 🎯 Descripción del Problema

### Problema Original

Zendesk solo permite enviar webhooks en formato JSON, pero CXConnect requiere datos en formato `application/x-www-form-urlencoded`. Además:

- **Formato de teléfono en Zendesk:** `+52 55 1287 5673` (con + y espacios)
- **Formato requerido por CXConnect:** `525512875673` (sin + ni espacios)

### Objetivo

Crear una automatización completa que:
1. ✅ Detecte cuando un ticket se marca como "Resuelto"
2. ✅ Verifique que tenga la etiqueta `no_contesto_whatsapp`
3. ✅ Convierta el formato de los datos de JSON a form-urlencoded
4. ✅ Limpie el número de teléfono (elimine +, espacios, guiones, paréntesis)
5. ✅ Envíe el mensaje de WhatsApp automáticamente a través de CXConnect

---

## 💡 Solución Implementada

La solución utiliza un **Cloudflare Worker** como middleware entre Zendesk y CXConnect:

```
Zendesk Webhook (JSON)
        ↓
Cloudflare Worker (Middleware)
  • Limpia el número de teléfono
  • Convierte JSON → form-urlencoded
        ↓
CXConnect API (form-urlencoded)
        ↓
WhatsApp del Cliente
```

### Ventajas de esta Solución

- ✅ **Sin servidor que mantener:** Cloudflare Workers es serverless
- ✅ **Gratuito:** Plan gratuito incluye 100,000 requests/día
- ✅ **Rápido:** Ejecución en menos de 1 segundo
- ✅ **Confiable:** Infraestructura global de Cloudflare
- ✅ **Fácil de actualizar:** Cambios se aplican inmediatamente
- ✅ **Logs completos:** Debugging fácil con logs detallados

---

## 🔄 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│  TICKET ZENDESK                                                 │
│  • Estado: Resuelto                                             │
│  • Etiqueta: no_contesto_whatsapp                               │
│  • Teléfono: +52 55 1287 5673                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER ZENDESK                                                │
│  Verifica condiciones:                                          │
│  ✓ Estado ha cambiado a Resuelto                                │
│  ✓ Tiene etiqueta no_contesto_whatsapp                          │
│  ✓ Tiene número de teléfono                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  WEBHOOK ZENDESK                                                │
│  Envía JSON con placeholders:                                   │
│  {                                                              │
│    "telefono": "{{ticket.requester.phone}}",                   │
│    "plantilla": "{...}",                                        │
│    "subdominio": "aplatam4961",                                 │
│    ...                                                          │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE WORKER (Middleware)                                 │
│  1. Recibe JSON de Zendesk                                      │
│  2. Limpia teléfono: +52 55 1287 5673 → 525512875673 (sanitizado en logs)  │
│  3. Actualiza destinationId en plantilla                        │
│  4. Convierte a form-urlencoded:                                │
│     telefono=525512875673&plantilla=...&subdominio=...          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  CXCONNECT API                                                  │
│  POST https://cxconnectav-aol.cxclatam.com/api/v2/...          │
│  Content-Type: application/x-www-form-urlencoded                │
│  Body: telefono=525512875673&plantilla=...                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  ✅ WHATSAPP DEL CLIENTE                                        │
│  Mensaje enviado usando plantilla:                              │
│  2566_m_intentocontacto_na_plantillasasesores                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitectura

### Componentes

1. **Zendesk Trigger**
   - Monitorea cambios en tickets
   - Evalúa condiciones definidas
   - Ejecuta webhook cuando se cumplen

2. **Zendesk Webhook**
   - Envía datos del ticket en formato JSON
   - Usa placeholders dinámicos ({{ticket.requester.phone}})
   - Apunta al Cloudflare Worker

3. **Cloudflare Worker**
   - Middleware serverless
   - Transforma datos de JSON a form-urlencoded
   - Limpia número de teléfono
   - Hace logging para debugging

4. **CXConnect API**
   - Recibe datos en formato form-urlencoded
   - Envía mensaje de WhatsApp usando plantilla
   - Retorna confirmación o error

### Tecnologías

| Componente | Tecnología | Versión |
|---|---|---|
| Middleware | Cloudflare Workers | Latest |
| Lenguaje | JavaScript | ES2020+ |
| Plataforma Tickets | Zendesk | - |
| Plataforma WhatsApp | CXConnect | API v2 |

---

## 📦 Requisitos Previos

Antes de instalar, necesitas:

- [ ] Cuenta de Zendesk con permisos de administrador
- [ ] Cuenta de Cloudflare (gratuita, no requiere tarjeta de crédito)
- [ ] Acceso a CXConnect con:
  - [ ] Subdominio: `aplatam4961`
  - [ ] Producto ID: `1156221`
  - [ ] Plantilla aprobada: `2566_m_intentocontacto_na_plantillasasesores`

---

## 🚀 Instalación

Sigue estos pasos en orden:

### 1. Instalar Cloudflare Worker

📖 **Guía completa:** [INSTALACION_CLOUDFLARE.md](./INSTALACION_CLOUDFLARE.md)

**Resumen:**
- Crear cuenta en Cloudflare (gratuita)
- Crear nuevo Worker
- Copiar código de `cloudflare-worker.js`
- Deployar
- Copiar URL del Worker

⏱️ **Tiempo estimado:** 10-15 minutos

### 2. Configurar Webhook en Zendesk

📖 **Guía completa:** [CONFIGURACION_WEBHOOK_ZENDESK.md](./CONFIGURACION_WEBHOOK_ZENDESK.md)

**Resumen:**
- Admin Center → Apps y integraciones → Webhooks
- Crear webhook tipo "Disparador o automatización"
- Configurar URL del Cloudflare Worker
- Copiar cuerpo JSON con placeholders
- Activar webhook

⏱️ **Tiempo estimado:** 5-10 minutos

### 3. Configurar Trigger en Zendesk

📖 **Guía completa:** [CONFIGURACION_TRIGGER_ZENDESK.md](./CONFIGURACION_TRIGGER_ZENDESK.md)

**Resumen:**
- Admin Center → Objetos y reglas → Disparadores
- Crear trigger con condiciones:
  - Estado ha cambiado a Resuelto
  - Tiene etiqueta `no_contesto_whatsapp`
  - Tiene teléfono
- Acción: Notificar webhook
- Activar trigger

⏱️ **Tiempo estimado:** 5-10 minutos

### 4. Probar la Automatización

📖 **Guía completa:** [TESTING.md](./TESTING.md)

**Resumen:**
- Crear ticket de prueba
- Agregar etiqueta `no_contesto_whatsapp`
- Marcar como Resuelto
- Verificar en logs de Zendesk y Cloudflare

⏱️ **Tiempo estimado:** 5 minutos

---

## 📊 Datos Técnicos

### Información del Sistema

| Parámetro | Valor |
|---|---|
| **Subdominio Zendesk** | `aplatam4961` |
| **Endpoint CXConnect** | `https://cxconnectav-aol.cxclatam.com/api/v2/play-one-to-one-proactive` |
| **Producto ID** | `1156221` |
| **Plantilla WhatsApp** | `2566_m_intentocontacto_na_plantillasasesores` |
| **Etiqueta del Trigger** | `no_contesto_whatsapp` |

### Estructura del Payload de CXConnect

**Formato requerido:** `application/x-www-form-urlencoded`

```
subdominio=aplatam4961
plantilla={"destination":{"integrationId":"--integrationId--","destinationId":"525512875673"},"author":{"role":"appMaker"},"messageSchema":"whatsapp","message":{"type":"template","template":{"namespace":"--namespace--","name":"2566_m_intentocontacto_na_plantillasasesores","language":{"policy":"deterministic","code":"es"}}}}
producto_id=1156221
telefono=525512875673
nombre_plantilla=2566_m_intentocontacto_na_plantillasasesores
idusuario=123456789
correousuario=cliente@example.com
assigneedMail=agente@empresa.com
assigneedId=987654321
```

### Placeholders de Zendesk

Los siguientes placeholders se reemplazan automáticamente:

| Placeholder | Descripción | Ejemplo |
|---|---|---|
| `{{ticket.requester.phone}}` | Teléfono del solicitante | `+52 55 1287 5673` |
| `{{ticket.requester.id}}` | ID del solicitante | `123456789` |
| `{{ticket.requester.email}}` | Email del solicitante | `cliente@example.com` |
| `{{ticket.assignee.email}}` | Email del agente | `agente@empresa.com` |
| `{{ticket.assignee.id}}` | ID del agente | `987654321` |

---

## 💼 Ejemplo de Uso

### Caso Real: Ticket #46356

**Datos del ticket:**
- **Solicitante:** Juan Pérez
- **Teléfono:** `+52 55 1287 5673`
- **Estado:** Nuevo → **Resuelto**
- **Etiqueta:** `no_contesto_whatsapp`

**Flujo de ejecución:**

1️⃣ **Agente marca el ticket como Resuelto**
```
Estado: Nuevo → Resuelto
Etiqueta: no_contesto_whatsapp ✓
```

2️⃣ **Trigger se activa automáticamente**
```
✓ Estado ha cambiado a Resuelto
✓ Tiene etiqueta no_contesto_whatsapp
✓ Tiene teléfono: +52 55 1287 5673
→ Ejecutar webhook
```

3️⃣ **Webhook envía datos al Worker**
```json
{
  "telefono": "+52 55 1287 5673",
  "subdominio": "aplatam4961",
  "producto_id": "1156221",
  ...
}
```

4️⃣ **Worker procesa los datos**
```
📞 Limpiando teléfono (solo últimos 4 dígitos en logs por seguridad)
📤 Convirtiendo a form-urlencoded
🚀 Enviando a CXConnect
```

5️⃣ **CXConnect envía WhatsApp**
```
✅ Mensaje enviado a 525512875673
Plantilla: 2566_m_intentocontacto_na_plantillasasesores
```

6️⃣ **Cliente recibe WhatsApp**
```
Juan Pérez recibe el mensaje automático en WhatsApp
```

**Tiempo total:** < 3 segundos ⚡

---

## 💰 Costos

### Cloudflare Workers - Plan Gratuito

| Característica | Plan Gratuito | Suficiente para |
|---|---|---|
| **Requests por día** | 100,000 | ✅ Sí |
| **CPU time por request** | 10ms | ✅ Sí |
| **Workers** | Ilimitados | ✅ Sí |
| **Costo mensual** | $0 USD | ✅ Gratis |

### Estimación de Uso

**Escenario típico:**
- 200 tickets resueltos por día con la etiqueta
- 200 execuciones del Worker por día
- **Uso del plan gratuito:** 0.2% (200 / 100,000)

**Escenario intensivo:**
- 1,000 tickets resueltos por día con la etiqueta
- 1,000 execuciones del Worker por día
- **Uso del plan gratuito:** 1% (1,000 / 100,000)

✅ **Conclusión:** El plan gratuito es más que suficiente para cualquier escenario realista.

### Otros Servicios

| Servicio | Costo |
|---|---|
| **Zendesk** | Ya incluido en tu plan |
| **CXConnect** | Según tu contrato existente |

**Total adicional:** $0 USD/mes 🎉

---

## ❓ FAQ

### ¿Qué pasa si el teléfono está en formato incorrecto?

El Worker limpia automáticamente el teléfono eliminando `+`, espacios, guiones, y paréntesis. Ejemplos:

- `+52 55 1287 5673` → `525512875673` ✅
- `52-55-1287-5673` → `525512875673` ✅
- `(52) 55 1287 5673` → `525512875673` ✅

### ¿Qué pasa si el ticket no tiene teléfono?

El trigger no se ejecutará. Una de las condiciones es que el teléfono no esté vacío, protegiendo contra errores.

### ¿Puedo usar múltiples etiquetas en el ticket?

Sí. El trigger se ejecuta si el ticket contiene la etiqueta `no_contesto_whatsapp`, incluso si tiene otras etiquetas.

### ¿El WhatsApp se envía cada vez que actualizo el ticket?

No. El trigger solo se ejecuta cuando el estado **CAMBIA** a Resuelto. Si el ticket ya estaba resuelto y lo actualizas, el trigger no se ejecutará nuevamente.

### ¿Puedo ver el historial de WhatsApps enviados?

Sí, en tres lugares:
1. **Zendesk:** Admin Center → Actividad → Registros de activación
2. **Cloudflare:** Workers → tu-worker → Logs
3. **CXConnect:** Panel de mensajes enviados

### ¿Qué pasa si CXConnect está caído?

El Worker intentará enviar la petición y retornará el error de CXConnect a Zendesk. Verás el error en los logs para que puedas reenviar manualmente si es necesario.

### ¿Puedo personalizar el mensaje de WhatsApp?

El mensaje está definido en la plantilla de CXConnect: `2566_m_intentocontacto_na_plantillasasesores`. Para cambiar el mensaje, necesitas crear/modificar la plantilla en CXConnect y actualizar el webhook.

### ¿Puedo usar esto para enviar a múltiples números?

El sistema actual envía a un solo número: el del solicitante del ticket. Para enviar a múltiples números, necesitarías modificar el Worker.

### ¿Cómo actualizo el Worker si necesito hacer cambios?

1. Ve a Cloudflare Dashboard → Workers
2. Haz clic en tu worker
3. Haz clic en "Edit code"
4. Haz los cambios
5. Haz clic en "Save and Deploy"

Los cambios se aplican inmediatamente sin downtime.

### ¿Funciona con otros proveedores de WhatsApp?

Este Worker está diseñado específicamente para CXConnect. Para otros proveedores, necesitarías modificar el Worker para usar su formato específico.

---

## 🔧 Troubleshooting

¿Tienes problemas? Consulta la guía completa de solución de problemas:

📖 **Guía completa:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Problemas Comunes

1. **El trigger no se ejecuta**
   - ✓ Verifica que el trigger esté activado
   - ✓ Verifica que el estado CAMBIE a Resuelto (no que ya esté resuelto)
   - ✓ Verifica que tenga la etiqueta `no_contesto_whatsapp`

2. **Error 400 de CXConnect**
   - ✓ Revisa los logs del Worker
   - ✓ Verifica el formato del teléfono limpio
   - ✓ Verifica que todos los campos requeridos estén presentes

3. **Webhook no se ejecuta**
   - ✓ Verifica que el webhook esté activado
   - ✓ Verifica la URL del Worker
   - ✓ Prueba el webhook manualmente

### Ver Logs

**En Zendesk:**
Admin Center → Actividad → Registros de activación

**En Cloudflare:**
Workers → tu-worker → Logs → Begin log stream

---

## 📝 Licencia

Este proyecto está disponible para uso libre en tu organización. No se requiere atribución.

---

## 🤝 Contribuciones y Soporte

### Reportar Problemas

Si encuentras un problema:
1. Revisa [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Revisa los logs de Zendesk y Cloudflare
3. Documenta el problema con capturas de pantalla
4. Contacta al equipo técnico

### Mejoras Sugeridas

Ideas para futuras mejoras:
- [ ] Soporte para múltiples plantillas de WhatsApp
- [ ] Envío a números adicionales (CC)
- [ ] Reintentos automáticos en caso de error
- [ ] Dashboard de métricas
- [ ] Notificaciones por email cuando falla el envío

---

## 📚 Documentación Adicional

- [INSTALACION_CLOUDFLARE.md](./INSTALACION_CLOUDFLARE.md) - Instalación del Worker
- [CONFIGURACION_WEBHOOK_ZENDESK.md](./CONFIGURACION_WEBHOOK_ZENDESK.md) - Configuración del Webhook
- [CONFIGURACION_TRIGGER_ZENDESK.md](./CONFIGURACION_TRIGGER_ZENDESK.md) - Configuración del Trigger
- [TESTING.md](./TESTING.md) - Guía de pruebas end-to-end
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solución de problemas
- [cloudflare-worker.js](./cloudflare-worker.js) - Código del Worker

---

## 🎉 Créditos

Desarrollado para automatizar el envío de mensajes de WhatsApp desde Zendesk usando CXConnect.

**Última actualización:** Diciembre 2024

---

<div align="center">

**¿Listo para empezar?**

👉 [Comienza con la instalación del Cloudflare Worker](./INSTALACION_CLOUDFLARE.md)

</div>
