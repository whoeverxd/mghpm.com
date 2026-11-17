# Guía de pruebas manuales — MGHPM (estado al 15 nov 2026)

Objetivo: recorrer **cada flujo, uno por uno**, verificar que funciona y anotar mejoras de UI/UX.

**Cómo usarla**
- Marca `[x]` cada paso que funcione como dice "→ Esperado".
- Si algo falla o se puede mejorar, anótalo en la tabla **Hallazgos** al final (con su número de flujo, p. ej. `5.3`).
- Tipos de hallazgo: **Bug** (no funciona), **UX** (funciona pero confunde o cuesta), **UI** (visual: espacios, colores, textos), **Idea** (algo nuevo).
- Prueba cada pantalla en **escritorio** y, al final de cada sección, en **móvil** (DevTools → modo dispositivo, ~390 px de ancho).
- Orden recomendado: de arriba hacia abajo. Cada sección crea los datos que usa la siguiente.
- Haz el recorrido en **español** (idioma por defecto). El inglés solo está completo en la barra, acceso y portales (ver 3.5); el resto se traduce en las próximas tandas.

**Qué incluye esta versión**
- Todo lo construido hasta el commit `74f52ad` (propiedades, unidades, imágenes, personas, titularidades, contratos, estadías, usuarios, portales, permisos).
- Lo nuevo sin commitear: menú por secciones y migas de pan (4A), listado de **Titularidades** y visor de **Auditoría** (4A), botón **"+ Nuevo"** (4B), **buscador global** (4C) y **selector de idioma ES | EN** (4E-1).

**Antes de empezar**
- [ ] El código de 4A, 4B, 4C y 4E-1 está desplegado (o corres `npm run dev` en local contra el proyecto real).
- [ ] Después del despliegue corriste `npm run migrate:audit-area -- --yes` (ver PLAN, paso 4A).
- [ x] Los índices de Firestore están en `READY` (`gcloud firestore indexes composite list --project=property-management-a8d5f`).
- [ ] Para probar roles y portales necesitas **otros correos que controles**. Opción simple: alias de Gmail (`tucorreo+admin@gmail.com`, `tucorreo+gerente@gmail.com`, `tucorreo+ops@gmail.com`, `tucorreo+propietario@gmail.com`, `tucorreo+inquilino@gmail.com`). Llegan a tu misma bandeja.
- [ ] Ten a mano: una foto o dos de una propiedad (JPG/PNG), una dirección real para el buscador de Google.

---

## 1. Sitio público

### 1.1 Página de inicio `/`
- [ ] Abrir `/` sin sesión → carga la landing, sin errores, imágenes y animación de portada visibles.
- [ ] Los botones de la landing llevan a donde dicen (iniciar sesión, estancias).
- [ ] Móvil: el texto no se corta, no hay desplazamiento horizontal.

### 1.2 Catálogo de estancias `/estancias` (ES) y `/stays` (EN)
- [ ] `/estancias` muestra las unidades publicadas para estancias cortas (si no hay ninguna, se ve un estado vacío claro). *(Para tener datos, primero haz 6.5.)*
- [ ] Cambiar idioma ES ↔ EN con el selector del encabezado → cambia a `/stays` y todos los textos cambian.
- [ ] Buscador del catálogo: fechas de llegada/salida, huéspedes (contadores + y −) → los resultados respetan capacidad.
- [ ] Marcar y desmarcar **favoritos** (corazón) → se conserva al recargar la página.
- [ ] Móvil: tarjetas en una columna, encabezado y pie bien.

### 1.3 Detalle de una estancia
- [ ] Abrir una tarjeta → detalle con fotos, descripción, capacidad, tarifa por noche.
- [ ] Panel de cotización: elegir fechas y huéspedes → muestra noches, subtotal, limpieza/cargos y total en la moneda de la unidad.
- [ ] Fechas inválidas (salida antes de llegada, más huéspedes que el máximo) → mensaje claro, no cotiza.
- [ ] Enviar **solicitud** (nombre, correo, teléfono, mensaje) → confirmación visible.
- [ ] Enviar el formulario vacío o con correo mal escrito → errores por campo.
- [ ] La solicitud aparece en el admin (ver 10.1).

---

## 2. Acceso y sesión

### 2.1 Inicio de sesión
- [ ] `/acceder` (y `/login`) → formulario de acceso.
- [ ] Contraseña incorrecta → mensaje claro, sin revelar si el correo existe.
- [ ] Login correcto → te lleva al admin (o a `/espacios` si tienes varios espacios).
- [ ] "Olvidé mi contraseña" → llega el correo de Firebase en español con tu dominio.

### 2.2 Protección de rutas
- [ ] Sin sesión, abrir `/admin/properties` → redirige a `/acceder`.
- [ ] Rutas viejas: `/dashboard`, `/properties`, `/people`, `/leases` → redirigen a `/admin/...`.
- [ ] Cerrar sesión (botón en la barra superior) → vuelve al acceso; el botón "atrás" del navegador no muestra datos.

### 2.3 Organización y espacios
- [ ] Usuario nuevo sin organización → `/onboarding` para crear la organización (nombre, moneda, zona horaria). *(Solo si pruebas con una cuenta nueva.)*
- [ ] `/espacios` lista tus espacios (admin y portales que tengas) → elegir uno abre el correcto.
- [ ] Selector de organización en la barra superior → cambia de organización y se refleja en los datos.
- [ ] El cambio de espacio queda en Auditoría ("Cambio de espacio de trabajo", ver 12).

---

## 3. Barra superior y navegación del admin

### 3.1 Menú lateral
- [ ] Secciones visibles: **Inicio · Cartera · Arrendamiento · Administración**, con Titularidades y Auditoría.
- [ ] La entrada de la página actual se ve resaltada.
- [ ] Botón contraer → menú solo con íconos, separadores entre secciones, nombre al pasar el cursor.
- [ ] Móvil: botón ☰ abre el cajón; tocar fuera o elegir una opción lo cierra.

### 3.2 Migas de pan
- [ ] En cada página se ve `Inicio › … › página actual` con **nombres reales** (p. ej. `Inicio › Propiedades › Torre A › Editar unidad 101`).
- [ ] Cada miga (menos la última) lleva a su página.
- [ ] Móvil: se ve `… › penúltimo › último`; nombres largos con "…".

### 3.3 Botón "+ Nuevo"
- [ ] Clic → menú con Nueva propiedad, Nueva persona, Nuevo contrato, Nueva titularidad, Nuevo usuario.
- [ ] Dentro de una propiedad → aparece **Nueva unidad**; "Nuevo contrato" y "Nueva titularidad" abren con esa propiedad ya elegida.
- [ ] Teclado: Esc cierra, flechas ↑/↓ recorren; clic fuera cierra.
- [ ] Móvil: el botón se ve como "+".

### 3.4 Buscador global
- [ ] Clic en "Buscar…" o `Ctrl+K` / `/` → el cursor queda en la caja.
- [ ] Escribir 1 letra → no busca; 2 o más → resultados agrupados (Propiedades, Personas, Contratos).
- [ ] Buscar sin tildes ("arbol" encuentra "Árbol"), por código de propiedad, por correo de persona, por código de contrato, por nombre del inquilino.
- [ ] ↑/↓ y Enter abren el resultado; Enter sin selección abre "Ver todos los resultados".
- [ ] `/admin/buscar?q=...` → grupos con hasta 25 resultados y "Ver en la lista" abre la lista filtrada.
- [ ] Texto sin coincidencias → "Sin resultados".
- [ ] Móvil: la lupa abre la caja a lo ancho; la X la cierra.

### 3.5 Idioma ES | EN (tanda 4E-1)
- [ ] El selector ES | EN aparece en la barra del admin, en los portales, en `/acceder` y en el inicio de sesión.
- [ ] Cambiar a EN → la página se recarga en inglés **sin cambiar la URL**: menú, migas, "+ New", buscador, botón "Sign out".
- [ ] Cerrar sesión y volver a entrar → sigue en inglés (la preferencia se guarda en tu perfil).
- [ ] Entrar desde otro navegador o en modo incógnito → al iniciar sesión vuelve tu idioma guardado.
- [ ] Sin preferencia, un navegador en inglés abre `/acceder` en inglés.
- [ ] Móvil: el selector se ve y funciona.
- [ ] Nota: el contenido de Propiedades, Personas, Contratos, etc. **todavía está en español**; se traduce en las tandas 4E-2 a 4E-6. Anota textos raros o traducciones que no te gusten.

---

## 4. Panel principal `/admin`
- [ ] Carga sin errores y muestra el resumen de la organización.
- [ ] Los números coinciden con lo que hay (propiedades, unidades, ocupación) — revísalo de nuevo al final del día.
- [ ] Anota qué indicadores te gustaría ver aquí (entra al bloque 8 "Panel y avisos").

---

## 5. Propiedades

### 5.1 Asistente "Nueva propiedad" (4 pasos)
- [ ] Abrir desde "+ Nuevo" o desde la lista.
- [ ] Paso de ubicación: escribir una dirección → sugerencias de **Google Places**; elegir una → se llenan dirección, ciudad, provincia, código postal y país.
- [ ] El **pin del mapa** se puede arrastrar y la ubicación se guarda.
- [ ] Sin clave de Google (si aplica) → se puede escribir la dirección a mano.
- [ ] Avanzar sin campos obligatorios → errores por campo, no avanza.
- [ ] Paso **Unidades**: generar unidades al crear (prefijo, cantidad, número inicial) → se crean junto con la propiedad.
- [ ] Guardar → abre el detalle de la propiedad nueva.
- [ ] Crear otra con el **mismo código** → error "código ya existe".

### 5.2 Lista de propiedades
- [ ] Búsqueda por nombre, código, dirección, ciudad (prefijo, sin tildes).
- [ ] Filtros: estado, ocupación, tipo; "Limpiar" los quita.
- [ ] Incluir archivadas.
- [ ] Paginación (si tienes más de una página): siguiente/anterior.
- [ ] Móvil: la tabla se desplaza de lado dentro de su tarjeta.

### 5.3 Detalle y edición
- [ ] Pestañas: **Resumen, Unidades, Imágenes, Propietarios**.
- [ ] Editar la propiedad (nombre, tipo, estado, dirección) → se guarda y se ve en la lista y en las migas.
- [ ] Cambiar el código a uno usado por otra propiedad → error.

---

## 6. Unidades
- [ ] 6.1 Nueva unidad (desde la pestaña Unidades o "+ Nuevo" dentro de la propiedad): etiqueta, piso, habitaciones, baños, estado, renta de mercado y moneda → aparece en la lista.
- [ ] 6.2 Etiqueta repetida en la misma propiedad → error.
- [ ] 6.3 **Generar unidades** en lote → sugiere el siguiente número; las repetidas se avisan; respeta el límite por propiedad.
- [ ] 6.4 Editar una unidad → cambios guardados; la ocupación de la propiedad se recalcula.
- [ ] 6.5 **Estancias cortas** (si la propiedad las acepta): tarifa por noche, huéspedes máx., camas, **Publicado** → la unidad aparece en `/estancias` (vuelve a 1.2).
- [ ] 6.6 Archivar una unidad → sale de la lista activa; restaurarla → vuelve.
- [ ] 6.7 Unidad con contrato **activo** → no se puede archivar ni cambiar a "disponible" (está bloqueada por el contrato).

## 7. Imágenes de la propiedad
- [ ] Subir varias fotos → se ven miniaturas.
- [ ] Elegir **portada** → se usa en la lista y en el catálogo.
- [ ] **Reordenar** fotos → el orden se mantiene al recargar.
- [ ] Eliminar una foto → desaparece.
- [ ] Archivo no imagen o demasiado grande → error claro.

---

## 8. Personas

### 8.1 Crear
- [ ] Persona **individual**: nombre, correo, teléfono, estado y relaciones (propietario / inquilino).
- [ ] **Entidad** (empresa): nombre y contacto.
- [ ] Correo ya usado por otra persona activa → error.
- [ ] Sin relaciones marcadas → ¿lo permite? Anota si el comportamiento te parece bien.

### 8.2 Lista
- [ ] Pestañas/filtros por relación (propietarios, inquilinos) y estado.
- [ ] Búsqueda por nombre, correo, teléfono.
- [ ] Incluir archivadas.

### 8.3 Detalle, edición y vistas
- [ ] Detalle con insignias de relaciones y **actividad** (historial).
- [ ] Editar datos y relaciones → la actividad registra "Relación agregada/finalizada".
- [ ] **Vista de propietario** (`/propietario` dentro de la persona): sus propiedades y porcentajes.
- [ ] **Vista de inquilino** (`/inquilino`): su unidad y contrato. Solo existe si la persona es inquilina.
- [ ] Archivar → sale de la lista; el correo queda libre para otra persona. Restaurar → vuelve.
- [ ] Archivar un inquilino con contrato activo → debe impedirlo o avisar.

---

## 9. Titularidades (quién es dueño de qué)

### 9.1 Crear
- [ ] Desde "+ Nuevo", desde la lista `/admin/ownerships` o desde la pestaña **Propietarios** de la propiedad.
- [ ] Elegir persona, propiedad, porcentaje, fecha de inicio y datos del título (opcional).
- [ ] Dos titularidades que sumen **más de 100 %** → error que dice cuánto queda disponible.
- [ ] Misma persona dos veces en la misma propiedad → error.
- [ ] Propiedad archivada → no permite agregar dueños.

### 9.2 Revisión y estados
- [ ] Estado inicial **Sin iniciar**. Recorrer: Sin iniciar → Documentos pendientes → En revisión → **Verificada**.
- [ ] Rechazar desde "En revisión" **exige motivo** (mín. 3 caracteres).
- [ ] Lista de verificación (escritura en archivo, registro coincide, identidad, etc.) se guarda.
- [ ] Quien creó la titularidad no puede verificar su propio registro (prueba con otro usuario admin si lo tienes).
- [ ] **Finalizar** titularidad (fecha de fin) → queda como Finalizada y no se puede editar.

### 9.3 Lista `/admin/ownerships`
- [ ] Filtro por estado: Activas, Sin iniciar, Documentos pendientes, En revisión, Verificadas, Rechazadas, Finalizadas.
- [ ] Columnas propiedad, titular, %, estado, inicio, fin; clic abre el detalle.

---

## 10. Solicitudes de estadía `/admin/stay-inquiries`
- [ ] 10.1 La solicitud enviada en 1.3 aparece como **Nueva** con fechas, huéspedes, contacto y total.
- [ ] 10.2 Cambiar estado: Nueva → Contactada → Cerrada; filtro por estado.
- [ ] 10.3 Enlaces de correo y teléfono abren tu correo/marcador.

---

## 11. Contratos

### 11.1 Crear
- [ ] Desde "+ Nuevo" o desde una propiedad (propiedad precargada).
- [ ] Elegir propiedad → unidad → inquilino (solo personas con relación de inquilino o la opción de marcarla).
- [ ] Fechas (inicio, fin, posesión, entrada), renovación, aviso en días.
- [ ] Renta, moneda, día de pago, días de gracia, regla de mora.
- [ ] Depósitos (seguridad, adicional, mascota), renta adelantada, otro cargo.
- [ ] Servicios (electricidad, agua, internet, gas, mantenimiento): quién paga.
- [ ] Guardar como **borrador** → recibe código consecutivo.
- [ ] **Enviar a activación** → exige los campos completos; errores claros si faltan.

### 11.2 Ciclo de vida
- [ ] **Activar** → la unidad pasa a ocupada y la propiedad recalcula ocupación; el inquilino queda activo en esa unidad.
- [ ] No se puede activar un segundo contrato en la misma unidad.
- [ ] **Editar** un contrato (lo que permita según su estado).
- [ ] **Terminar** con fecha → unidad liberada.
- [ ] **Vencer** → estado vencido.
- [ ] **Cancelar** un borrador/pendiente → exige motivo.
- [ ] Renovar (si aparece la opción) → nuevo contrato ligado al anterior.

### 11.3 Lista
- [ ] Vistas por estado y **"Por vencer"** (próximos 90 días).
- [ ] Totales de renta y depósitos **por moneda** (USD y DOP no se mezclan).
- [ ] Búsqueda por código, inquilino, propiedad, unidad.

---

## 12. Auditoría `/admin/audit`
- [ ] Todo lo que hiciste hoy aparece, del más reciente al más antiguo, con fecha/hora de tu zona.
- [ ] Usuario: tu nombre (o correo), no un código.
- [ ] Filtro por área: Propiedades, Personas, Contratos, Titularidades, Usuarios y accesos, Estadías.
- [ ] "Detalle" muestra de → a y motivo (p. ej. rechazo de titularidad).
- [ ] "Abrir" lleva al registro correcto.

---

## 13. Usuarios y accesos `/admin/users`
- [ ] 13.1 **Nuevo usuario de staff**: correo, nombre, rol (Administrador, Gerente, Operaciones) → se crea y llega el **correo de acceso** en español.
- [ ] 13.2 **Usuario con portal**: marcar portal Propietario y/o Inquilino y vincularlo a la persona correspondiente.
- [ ] 13.3 Editar: cambiar rol, agregar/quitar portales → queda en Auditoría.
- [ ] 13.4 **Suspender** → esa persona ya no puede entrar. **Reactivar** → vuelve a entrar.
- [ ] 13.5 Un rol no puede asignar un rol superior al suyo (prueba con el admin).

## 14. Roles (con las cuentas de 13)
Entra con cada cuenta y comprueba:

| Rol | Debe poder | No debe poder |
|---|---|---|
| Administrador | Todo, incluida Auditoría y Usuarios | Crear dueños de la organización |
| Gerente | Operar propiedades, personas, contratos, titularidades, estadías; ver usuarios | Gestionar usuarios, ver Auditoría, verificar titularidades |
| Operaciones | Ver todo; cambiar estado de solicitudes de estadía | Crear o editar; no ve "+ Nuevo" |

- [ ] El menú solo muestra lo permitido.
- [ ] Abrir a mano una URL no permitida (p. ej. `/admin/users/new` como Gerente) → pantalla "Sin acceso", no un error.
- [ ] El buscador global solo devuelve módulos permitidos.

## 15. Portales
- [ ] 15.1 **Propietario** (`/propietario`): inicio, **Mis propiedades** (solo las suyas), perfil.
- [ ] 15.2 **Inquilino** (`/inquilino`): inicio, **Mi contrato** (solo el suyo), perfil.
- [ ] 15.3 Solicitante y huésped: por ahora son pantallas base (se completan en los bloques 3 y 5) — anota qué esperarías ver.
- [ ] 15.4 Usuario con staff + portal → `/espacios` le deja elegir; puede cambiar de espacio.
- [ ] 15.5 Un usuario de portal que abre `/admin` → "Sin acceso".
- [ ] 15.6 Móvil en cada portal.

---

## 16. Revisión general de UI/UX (al final)
- [ ] Textos: ortografía, tono, mensajes de error claros y en español.
- [ ] Consistencia: botones, colores de estados, títulos, espacios entre secciones.
- [ ] Velocidad: anota pantallas que se sientan lentas.
- [ ] Estados vacíos: cada lista sin datos explica qué hacer.
- [ ] Teclado: Tab recorre en orden lógico; el foco se ve.
- [ ] Móvil: ninguna pantalla con desplazamiento horizontal ni botones tapados.
- [ ] Lo que más te molestó y lo que más te gustó (para priorizar).

---

## Hallazgos

| # | Flujo | Tipo (Bug/UX/UI/Idea) | Severidad (Alta/Media/Baja) | Qué pasó / qué propones | Captura |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

Cuando termines, pásame esta tabla (o el archivo) y armamos el lote de correcciones antes de seguir con el siguiente bloque.
