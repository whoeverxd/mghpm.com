# Explore Stays — Subproyecto A: catálogo público

Fecha: 2026-11-07 · Pantalla de referencia: `design_handoff_mghpm/prototypes/Master 29 - Explore Stays.dc.html`

## Objetivo

Un catálogo público y bilingüe (ES/EN) de unidades para estancias cortas: búsqueda con filtros, ficha con cotización y un formulario de solicitud que el staff atiende desde el panel. Sin reservas ni pagos.

## Alcance

**Incluye**
- Configuración de estancia corta por unidad en el panel de staff.
- Páginas públicas `/[lang]/stays` (búsqueda) y `/[lang]/stays/[propertyId]/[unitId]` (ficha).
- Ruta pública de imágenes.
- API pública de solicitudes y bandeja del staff `/stay-inquiries`.
- Enlace "Explore stays" en la landing.
- Pruebas e2e `scripts/e2e/stays.mjs`.

**No incluye (subproyectos posteriores)**
- B: reservas, disponibilidad real por fechas, calendario, cuenta del huésped.
- C: pago, Mis estadías, check-out.
- Notificación por correo (SMTP de Google Workspace, pendiente de revisar).
- Vista de mapa, impuestos en la cotización, reglas de la casa, política de cancelación, valoraciones/reseñas, asistente, descripción por idioma.

## Decisiones

| Tema | Decisión |
|---|---|
| Fuente del catálogo | Una sola organización: `PUBLIC_CATALOG_ORGANIZATION_ID` |
| Qué se publica | Cada unidad por separado; la propiedad aporta lo común |
| Cotización | Noches × tarifa + limpieza; sin impuestos, con nota "Impuestos y cargos aplicables se confirman al reservar" |
| Botón final | Formulario de solicitud guardado en Firestore |
| Idioma | Bilingüe ES/EN con prefijo de ruta; descripción en un solo campo |
| Mapa | No en A |
| Lectura de datos | Directa en el servidor con un mapeador público único; sin colección de proyección |

## 1. Datos y configuración del staff

### Campos nuevos en la unidad

`unit.stay`, opcional en `unitDocumentSchema` para que los registros existentes sigan siendo válidos:

| Campo | Tipo | Regla |
|---|---|---|
| `published` | boolean | — |
| `nightlyRateMinor` | entero ≥ 0, nullable | En la moneda de la propiedad (`financialReference.currency`) |
| `maxGuests` | entero 1–30, nullable | — |
| `beds` | entero 0–30 | — |
| `minNights` | entero 1–365 | ≤ `maxNights` |
| `maxNights` | entero 1–365 | — |

`published: true` exige `nightlyRateMinor` y `maxGuests` no nulos.

### Datos que se reutilizan de la propiedad

Nombre, descripción, `city`/`state`/`country`, tipo, amenidades (`pet_friendly` decide si se aceptan mascotas), `utilities` (luz, agua, internet), `financialReference.cleaningFeeMinor` y moneda, fotos y portada.

### Regla de visibilidad (`isPublishable`)

Una unidad es publicable si se cumple todo:
- propiedad `status = active`, `archived = false`, `rentalCategory ∈ {short_term, both}` y `financialReference.currency` definida;
- unidad `archived = false`, `status = available`, sin `activeLeaseId`;
- `stay.published = true` con tarifa y capacidad.

La regla vive en una función pura compartida por el catálogo, la ruta de imágenes y la API de solicitudes.

### Panel de staff

- [unit-form.tsx](../../../src/components/properties/unit-form.tsx): sección "Estancias cortas" (solo si la propiedad es `short_term` o `both`) con los campos y el interruptor "Publicar en el catálogo".
- La API de unidades valida `stay` con zod. Si se pide `published: true` y la propiedad no cumple la regla, responde 409 con un mensaje claro, por ejemplo "La propiedad debe estar activa y ser de corto plazo".
- Detalle de propiedad: etiqueta "Publicada" en las unidades publicables.

## 2. Páginas públicas

### Estructura del código

- `src/lib/stays/public-listing.ts` (server-only): carga las propiedades de la organización pública y sus unidades, aplica `isPublishable` y devuelve `PublicListing[]` mediante `toPublicListing`.
  - **Campos de `PublicListing`:** `propertyId`, `unitId`, título ("Propiedad — Unidad X"), tipo, `city`, `state`, `country`, descripción, habitaciones, camas, baños, `maxGuests`, `min/maxNights`, `nightlyRateMinor`, `cleaningFeeMinor`, moneda, `petsAllowed`, amenidades, `utilities` (solo los booleanos de incluido), `coverImageId` e `imageIds`.
  - **Campos que nunca se exponen:** dirección, `location`, código interno, medidores, depósito, renta mensual, `activeLeaseId`, auditoría.
  - **Caché:** el resultado se cachea unos minutos, con el mecanismo de caché de la versión de Next.js instalada (se revisa la guía en `node_modules/next/dist/docs/` antes de implementar).
- `src/lib/stays/search.ts` (pura): parseo de parámetros, filtros, orden y separación disponible / no disponible.
- `src/lib/stays/quote.ts` (pura): `noches × tarifa + limpieza`, con la validación de las fechas y de la estancia mínima y máxima.
- `src/lib/stays/i18n.ts`: diccionarios ES/EN y formato de moneda y fechas con `Intl`.

### Rutas e idioma

- `/es/stays`, `/en/stays` y sus fichas, siguiendo la guía de internacionalización de la versión de Next.js instalada.
- `/stays` redirige según `Accept-Language` (ES si empieza por `es`; si no, EN).
- El selector ES/EN cambia el prefijo y conserva la consulta.
- La landing agrega "Explore stays" en la navegación y en el hero.

### Búsqueda

- Formulario `GET`; los parámetros van en la URL: `area`, `checkIn`, `checkOut`, `guests`, `pets`, `maxPrice`, `type`, `bedrooms`, `baths`, `amenities`, `sort`.
- **Zona:** ciudades con unidades publicables, más la opción "Todas".
- **Orden:** recomendado (por nombre), precio ascendente, precio descendente, habitaciones y capacidad.
- **Exclusiones:** quedan fuera las unidades con `maxGuests < guests`, con `pets > 0` sin `petsAllowed`, o que no cumplen los filtros.
- **Con fechas válidas:** las unidades cuyo rango de noches no encaja pasan a "No disponible para tus fechas", con el motivo (estancia mínima o máxima). Las demás muestran el total.
- **Tarjeta:** portada, zona, título, tipo, habitaciones, camas, baños, huéspedes, hasta 4 amenidades, precio por noche y total.
- **Estado vacío:** mensaje y botón "Limpiar filtros".

### Ficha

- Contenido: galería, título, datos básicos, descripción, servicios incluidos y amenidades.
- La cotización se pide con `GET` a la misma página (fechas, huéspedes, mascotas) y la calcula el servidor. Lleva la nota de impuestos y muestra errores claros si las fechas son inválidas o pasadas, o si no se cumple la estancia, la capacidad o la política de mascotas.
- Debajo va el formulario de solicitud, que solo se habilita con una cotización válida.
- Si la unidad no es publicable: `notFound()`, con una página 404 bilingüe y enlace a la búsqueda.

### Imágenes públicas

- Ruta: `GET /api/public/stays/images/[propertyId]/[imageId]?variant=original|thumbnail`.
- Lee del almacenamiento local (`readPropertyImageFile`). Solo sirve la imagen si la propiedad tiene al menos una unidad publicable; si no, devuelve 404.
- Cabeceras: `Cache-Control: public, max-age=3600` y `X-Content-Type-Options: nosniff`.

## 3. Solicitudes

### API pública

`POST /api/public/stays/inquiries` (JSON):
- **Cuerpo:** `propertyId`, `unitId`, `checkIn`, `checkOut`, `guests`, `pets`, `name`, `email`, `phone`, `message` (opcional, máximo 1000), `consent: true`, `locale` y un campo trampa `website`.
- **Orden de comprobaciones:**
  1. `isSameOriginRequest`;
  2. honeypot: si está lleno, responde 201 sin guardar;
  3. validación zod;
  4. límite de 5 solicitudes por hora por hash SHA-256 de la IP, en `organizations/{org}/inquiryRateLimits/{hash}`, dentro de una transacción;
  5. `isPublishable`;
  6. el servidor recalcula la cotización e ignora cualquier total enviado.
- **Errores:** 400 validación · 403 origen · 404 unidad no publicable · 409 estancia, capacidad o mascotas · 429 límite · 500 genérico. Todos con mensaje traducido según `locale`.

### Documento

`organizations/{org}/stayInquiries/{id}`:
- `propertyId`, `unitId`, `listingTitle` (copia del título);
- `checkIn`, `checkOut`, `nights`, `guests`, `pets`;
- `quote { currency, nightlyRateMinor, nights, cleaningFeeMinor, totalMinor }`;
- `name`, `email`, `phone`, `message`, `locale`;
- `status: new | contacted | closed`, `createdAt`, `updatedAt` y `updatedBy`.

### Bandeja del staff

- **Ubicación:** `/stay-inquiries`, con entrada en [admin-shell.tsx](../../../src/components/layout/admin-shell.tsx) y contador de solicitudes `new`.
- **Lista:** filtro por estado. Cada fila muestra la fecha, el anuncio (con enlace a la propiedad), las fechas de la estancia, los huéspedes, el contacto (`mailto:` y `tel:`), el total y el mensaje.
- **Estado:** `PATCH /api/stay-inquiries/[id]` cambia el estado y registra el evento en `auditEvents` (`stay_inquiry.status_changed`).
- **Permisos:** `getPropertyWriteAccess`.

### Confirmación al visitante

Mensaje en su idioma ("Recibimos tu solicitud. Te contactaremos pronto") con un resumen de la unidad, las fechas y el total.

## 4. Errores

- Si `PUBLIC_CATALOG_ORGANIZATION_ID` falta o no existe, el catálogo muestra el estado vacío y deja un error en el log; no responde 500.
- Un documento inválido se omite del catálogo y se registra en el log.
- Los parámetros de URL inválidos se ignoran. Si son las fechas, se muestra un aviso.

## 5. Pruebas

`scripts/e2e/stays.mjs`, contra los emuladores y siguiendo el patrón de los scripts existentes. Crea y limpia sus propios datos; no hay datos de demostración.

- **Visibilidad:**
  - una unidad sin publicar no aparece y, al publicarla, aparece;
  - archivar la propiedad o activar un contrato la oculta;
  - publicar en una propiedad de largo plazo da 409.
- **Búsqueda:**
  - los filtros de huéspedes, mascotas y precio funcionan;
  - las unidades que no cumplen la estancia mínima pasan a "No disponible".
- **Cotización:** noches × tarifa + limpieza da el total correcto.
- **Privacidad:** la respuesta pública no contiene dirección, ubicación, código ni renta mensual.
- **Imagen pública:** da 404 cuando la propiedad no tiene unidades publicables.
- **Solicitudes:**
  - una solicitud válida se guarda con la cotización recalculada;
  - un total manipulado se ignora;
  - el honeypot hace que no se guarde nada;
  - la sexta solicitud desde la misma IP recibe 429;
  - el staff cambia el estado y queda un evento de auditoría.
- Se agrega a `npm run test:e2e`, además de `typecheck` y `lint`.

## Configuración nueva

`.env.example`: `PUBLIC_CATALOG_ORGANIZATION_ID=`.
