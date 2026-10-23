# Gallery Night · Back to the 80s

Sitio estático en GitHub Pages con competencia y autenticación en Supabase. Para probarlo localmente, usá un servidor HTTP.

## Publicación desde GitHub

Repositorio: https://github.com/benjaguerra192/gallerynight26.github.io

GitHub Pages: publicar la rama `main`, carpeta raíz. Las rutas relativas también funcionan bajo `/gallerynight26.github.io/`. Cada push ejecuta las pruebas del flujo `Verify website`.

El hosting actual es GitHub Pages. La configuración histórica de Netlify no se usa para publicar.

Prueba local del paquete: `node build.cjs`, luego `python -m http.server 8765 --directory dist` y abrir `http://localhost:8765/`.

- Sin simulador. Un enlace NFC desbloquea la canción y reproduce un fragmento local en el diálogo. Si el navegador bloquea el inicio automático, ofrece Reproducir. Spotify queda como botón opcional.
- El registro y los desbloqueos se guardan en Supabase con hora del servidor. El navegador conserva la sesión de la familia.
- Los reinicios y borrados se gestionan desde Organización, con confirmación.
- Para NFC reales: publicá el paquete completo generado en `dist/`. En **Organización** (pie de página), ingresá con tu cuenta administradora y copiá los enlaces. Instrucciones completas en [CONFIGURAR-NFC.md](CONFIGURAR-NFC.md).
- Ejemplo: `https://tu-sitio.com/?nfc=billie-jean`. El teléfono abre la URL y la página desbloquea la canción. No se usa Web NFC.
- Usá el mismo navegador y dominio en todos los escaneos. En incógnito, otro navegador o al borrar sus datos, la colección no se conserva. No hay sincronización entre dispositivos.
- Los enlaces son compartibles: el sistema registra tiempos, pero no demuestra presencia física ante una etiqueta NFC.

Catálogo editable en `app.js`: ocho clásicos internacionales con portadas de sus álbumes. Estética ochentosa inspirada en los ejemplos, con verde, amarillo, blanco y rojo.

Escudo escolar repetido en cabecera, panel del recorrido, tarjetas, detalle de canción y pie. Favicon SVG aportado por el usuario. Copias en `assets/`; originales conservados en `Ejemplos para la pagina web/`. Los afiches de referencia no se publican.

Fuentes de Google Fonts opcionales; hay alternativas locales si no hay Internet. Spotify requiere conexión.

## Versión móvil

- Una tapa grande por vez. Flechas a izquierda y derecha, deslizamiento horizontal y teclas de dirección. El carrusel vuelve al principio después del último álbum.
- Secciones públicas: Inicio, Álbumes y Cómo jugar. Organización usa Supabase Auth y permisos comprobados en el servidor. Menú superior en escritorio y celular horizontal; menú lateral desplegable con ☰ en celular vertical.
- Al entrar por primera vez se pide nombre familiar. Puede editarse tocándolo en la cabecera sin reiniciar el reloj. Se asocia a una cuenta anónima de este navegador.
- Si la primera visita viene de un NFC, la canción se desbloquea después de ingresar el nombre.
- Con competencia activa, el visitante no puede reiniciar su tiempo; Organización administra los reinicios.
- Catálogo: Billie Jean, Take on Me, With or Without You, Sweet Dreams, Every Breath You Take, Bohemian Rhapsody, Sweet Child o’ Mine y La Isla Bonita. Los NFC anteriores tienen equivalencias documentadas en CONFIGURAR-NFC.md. La competencia comienza con un registro nuevo; el avance del demo no se importa porque no tiene horarios verificables.
- Una tapa bloqueada se oculta completamente tras un fondo gris y un candado. Aparece al desbloquearla.

## Transiciones

Entradas de secciones, desplazamiento direccional de álbumes, apertura de menú lateral, aparición de diálogos y revelado de tapas. Respuesta visual al tocar botones. Animaciones nativas de 160–460 ms, sin dependencias ni descarga adicional. Los clics rápidos cancelan la animación anterior; no retrasan el cambio de álbum. Respeta `prefers-reduced-motion`, incluso si cambia durante la sesión. Sin API de animación, las acciones siguen funcionando.

Investigación: [artículo de campusMVP](https://www.campusmvp.es/recursos/post/bibliotecas-de-animaciones-con-css-y-javascript.aspx), [Animate.css](https://animate.style/), [Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) y [movimiento reducido](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion). Se tomaron patrones de interacción como referencia; no se incorporaron bibliotecas completas.

Verificación lógica: `node verify.cjs`. Incluye navegación, cambios rápidos del carrusel, cancelación de animaciones, preferencia de movimiento reducido y alternativa sin API de animación. No sustituye una revisión visual en un teléfono real.

## Fragmentos de audio

`assets/audio/` contiene ocho previews MP3 públicos de aproximadamente 30 segundos proporcionados por Deezer. Portadas de los álbumes en `assets/albums/`; procedencia y fecha en `assets/media-sources.json`. El diálogo incluye un enlace a Deezer. Son previews, no canciones completas; el fragmento lo elige el proveedor. Los originales aportados permanecen en `Audios/`, fuera del repositorio.

Para refrescar los previews: `python prepare-audio.py` (Python estándar, conexión a Internet). Las URLs temporales se consultan a Deezer al ejecutar el script y no se usan en la reproducción del sitio.

Un reproductor compartido evita superposición. Pausa/Reproducir disponible en el diálogo y debajo del visor. Carrusel: reproduce al cambiar a una canción desbloqueada. Cuadrícula: mouse, teclado o toque en celular. Cambiar sección, esconder pestaña o reiniciar detiene la reproducción. Las canciones bloqueadas no se reproducen desde el visor.

## Competencia y administración

- Organización: email `benjaguerra192@gmail.com` y la contraseña creada en Supabase. La sesión persiste hasta cerrar sesión o borrar los datos del navegador. Se usa almacenamiento del SDK, no cookies HttpOnly; las sesiones de administrador y visitante están separadas.
- El reloj comienza al registrar la familia. Se detiene al conseguir las ocho canciones. El ranking ordena a quienes completaron por menor duración; muestra registro, finalización y horario de cada desbloqueo en hora argentina.
- Actualización automática: leaderboard cada 10 segundos; visitante cada 15 segundos. Los relojes avanzan cada segundo. **Actualizar** permite refrescar el leaderboard manualmente.
- Abrir, cerrar, cerrar hasta una fecha o programar una ventana desde Organización. Fechas en hora argentina. Cerrar bloquea registros y desbloqueos nuevos; permite escuchar lo conseguido. El tiempo transcurrido sigue contando durante el cierre.
- Se puede borrar un desbloqueo, todos los de una familia conservando su reloj, reiniciar tiempo y avance, eliminar una familia o eliminar todos los participantes. Siempre se actualiza el leaderboard antes de pedir confirmación; el borrado global exige escribir `BORRAR`.
- Desbloquear todas para probar marca esa familia **fuera del premio**. Reiniciar tiempo y avance permite volver a empezar como participante normal.

`config.js` contiene únicamente URL y clave publicable. Nunca colocar una clave `service_role` o secreta. SDK oficial v2.118.0 incluido con licencia en `assets/vendor/` (fuente: jsDelivr, paquete `@supabase/supabase-js@2.118.0/dist/umd/supabase.js`). Tablas con RLS y sin acceso directo del cliente; RPC con controles de identidad y permisos. Los administradores se autorizan en `gn_admins`, no por datos editables del usuario. La migración aplicada está en `supabase/migrations/`.

Se requiere Internet para registrar o desbloquear. Mantener Anonymous Sign-Ins activado. Antes del evento, revisar los límites de autenticación anónima de Supabase para muchos teléfonos compartiendo el WiFi escolar y hacer una prueba de carga. No borrar los datos del navegador de una familia durante el recorrido: perdería su acceso anónimo.

Sin configuración de Supabase existe un modo demo local, sin ranking real; su contraseña histórica no otorga permisos en la base de datos.

Pruebas SQL aisladas (nunca producción): `npm install --prefix output/testdeps --no-save --package-lock=false --ignore-scripts @electric-sql/pglite@0.3.14`, después `node verify-database.cjs output/testdeps/node_modules/@electric-sql/pglite/dist/index.cjs`. Cubren aislamiento, permisos, horarios, primeros desbloqueos, cierre, ranking y borrados. Prueba de interfaz con API simulada: servir el sitio en puerto 8770 y ejecutar `npx --package @playwright/cli playwright-cli -s=competition run-code --filename=tests/cloud-browser.js` tras abrir la sesión. No sustituye una prueba NFC física ni una prueba de carga.
