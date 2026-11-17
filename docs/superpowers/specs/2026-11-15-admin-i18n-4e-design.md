# Paso 4E — Idioma ES/EN del área privada (spec y plan)

Fecha: 15 nov 2026 · Estado: diseño aprobado (preferencia guardada sin cambiar URLs; alcance: todo lo que ve un usuario con sesión).

## Decisiones

- **Preferencia:** selector ES | EN guarda el idioma en la cookie `mghpm_locale` y en `users/{uid}.locale`. Primera visita: idioma del navegador (`Accept-Language`); si no, español. Las URLs no cambian.
- **Alcance:** admin, portales, `/acceder`, `/login`, `/espacios`, onboarding y mensajes de las APIs; fechas, montos y números según idioma. No se traduce lo que escriben los usuarios ni los correos de Firebase (bloque 8). El catálogo público mantiene su sistema propio.
- **Mecanismo:** diccionarios TypeScript propios (`src/lib/i18n/dictionaries/es.ts` fuente, `en.ts` con el mismo tipo `Dictionary`: si falta una clave, el typecheck falla). Sin dependencias nuevas.

## Arquitectura

| Pieza | Archivo | Rol |
|---|---|---|
| Idiomas | `src/lib/i18n/locales.ts` (puro) | `locales`, `Locale`, `LOCALE_COOKIE`, `pickLocale(cookie, acceptLanguage)`, `intlLocales` (`es-DO`, `en-US`), `interpolate` |
| Formatos | `src/lib/i18n/format.ts` (puro) | `createFormatter(locale, timeZone?)`: `date`, `dateTime`, `money`, `number` |
| Diccionarios | `src/lib/i18n/dictionaries/{es,en}.ts` | Por área: `common`, `access`, `lanes`, `nav`, `routes` (etiqueta de cada página del manifiesto, por patrón), `createMenu`, `search`, `portal`, `org`… |
| Servidor | `src/lib/i18n/server.ts` | `getLocale()` (cookie → navegador → es), `getI18n()` → `{ locale, t, format }` |
| Cliente | `src/components/i18n/i18n-provider.tsx` | `I18nProvider` en el layout raíz; `useI18n()` → `{ locale, t, format }` |
| Selector | `src/components/i18n/locale-switch.tsx` | Botones ES · EN (`aria-pressed`) → `POST /api/preferences/locale` → `router.refresh()` |
| API | `src/app/api/preferences/locale/route.ts` | CSRF; fija la cookie; con sesión guarda `users/{uid}.locale` (no staff: en `nonStaffApis`) |
| Inicio de sesión | `src/app/api/auth/session/route.ts` | Si `users/{uid}.locale` existe, fija la cookie |

- El manifiesto deja de tener textos: el menú y las migas usan `t.routes[patrón]`; las secciones del menú y las acciones de "+ Nuevo" tienen una clave (`key`/`name`) que se traduce en el diccionario. El buscador devuelve solo el módulo; la interfaz pone el nombre.
- `laneLabels` pasa a `t.lanes`.
- Zod: los esquemas devuelven códigos (`"date_invalid"`) traducidos con `t.errors` (tanda 4E-6).

## Entrega por tandas

Estado al 15 nov 2026: **4E-1 terminada** (13 suites e2e en verde). Siguiente: 4E-2.

Nota de implementación (4E-1): al cliente no se manda el diccionario entero. `baseNamespaces` (layout raíz) y `adminNamespaces` (layout de `/admin`) en `src/components/i18n/client-texts.tsx`; cada página con formularios cliente agrega los suyos con `<ClientTexts namespaces={[...]}>`. `useI18n()` lanza un error claro si se pide un namespace no entregado.

| Tanda | Contenido |
|---|---|
| 4E-1 | Infraestructura, selector, layout raíz, barra superior, menú, migas, "+ Nuevo", buscador (caja y página), `/acceder`, `/login`, `/espacios`, onboarding, pantallas de acceso denegado, marco de portales, inicio y perfil de portales |
| 4E-2 | Propiedades, asistente, unidades, imágenes |
| 4E-3 | Personas (vistas propietario/inquilino) y titularidades |
| 4E-4 | Contratos |
| 4E-5 | Usuarios y accesos, solicitudes de estadía, auditoría, panel principal, páginas de contenido de portales |
| 4E-6 | Validación (zod con códigos) y mensajes de las APIs |

## Pruebas

- Typecheck: claves faltantes en `en.ts`.
- `src/lib/i18n/dictionaries.test.ts`: ES y EN tienen exactamente las mismas claves; `routes` cubre exactamente las páginas del manifiesto; los marcadores `{x}` coinciden entre idiomas.
- `src/lib/i18n/no-hardcoded-text.test.ts`: en los archivos cubiertos (lista que crece por tanda) no hay texto JSX visible, ni `placeholder`/`aria-label`/`title`/`alt` con letras, ni cadenas con letras acentuadas o `¿¡`, salvo excepciones explícitas.
- Unitarias de `pickLocale`, `interpolate` y formatos.
- e2e `scripts/e2e/i18n.mjs`: con `mghpm_locale=en` las páginas cubiertas responden `<html lang="en">` y textos en inglés; la API de preferencia fija la cookie y `users/{uid}.locale`; al iniciar sesión se restaura; sin cookie y con navegador en inglés → inglés. Las suites existentes siguen en español (idioma por defecto).
