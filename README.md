# Gallery Night · Back to the 80s — Demo

Abrí `index.html` en el navegador. No requiere instalación.

## Publicación desde GitHub

Repositorio: https://github.com/benjaguerra192/gallerynight26.github.io

GitHub Pages: publicar la rama `main`, carpeta raíz. Las rutas relativas también funcionan bajo `/gallerynight26.github.io/`. Cada push ejecuta las pruebas del flujo `Verify website`.

Netlify: conectar este repositorio al sitio existente `gallerynight2026.netlify.app`, rama `main`. `netlify.toml` ejecuta `node verify.cjs && node build.cjs` y publica `dist/`, sin instalar dependencias. Conservar ese sitio y su nombre mantiene válidos los enlaces NFC ya grabados.

Prueba local del paquete: `node build.cjs`, luego `python -m http.server 8765 --directory dist` y abrir `http://localhost:8765/`.

- Sin simulador. Un enlace NFC desbloquea la canción y reproduce un fragmento local en el diálogo. Si el navegador bloquea el inicio automático, ofrece Reproducir. Spotify queda como botón opcional.
- El avance queda guardado en este navegador mediante localStorage.
- **Reiniciar** pide confirmación y borra solo el avance de este demo.
- Para NFC reales: publicá `index.html`, todos los archivos `.css`, `app.js`, `audio.js` y la carpeta `assets/` completa en un hosting HTTPS. En **Organización** (pie de página), ingresá la contraseña y copiá los enlaces. Instrucciones completas en [CONFIGURAR-NFC.md](CONFIGURAR-NFC.md).
- Ejemplo: `https://tu-sitio.com/?nfc=war-pigs`. El teléfono abre la URL y la página desbloquea la canción. No se usa Web NFC.
- Usá el mismo navegador y dominio en todos los escaneos. En incógnito, otro navegador o al borrar sus datos, la colección no se conserva. No hay sincronización entre dispositivos.
- Los enlaces son compartibles. Esto es una experiencia de colección, no un control de acceso seguro.

Catálogo editable en `app.js`: solo las ocho canciones con fotos aportadas. Estética ochentosa inspirada en los ejemplos, con verde, amarillo, blanco y rojo.

Escudo escolar repetido en cabecera, panel del recorrido, tarjetas, detalle de canción y pie. Favicon SVG aportado por el usuario. Copias en `assets/`; originales conservados en `Ejemplos para la pagina web/`. Los afiches de referencia no se publican.

Fuentes de Google Fonts opcionales; hay alternativas locales si no hay Internet. Spotify requiere conexión.

## Versión móvil

- Una tapa grande por vez. Flechas a izquierda y derecha, deslizamiento horizontal y teclas de dirección. El carrusel vuelve al principio después del último álbum.
- Secciones públicas: Inicio, Álbumes y Cómo jugar. Etiquetas NFC está detrás del acceso de Organización con contraseña `nadielaadivina`. Protección visual local, no autenticación de servidor. Menú superior en escritorio y celular horizontal; menú lateral desplegable con ☰ en celular vertical.
- Al entrar por primera vez se pide nombre familiar. Se guarda localmente y puede editarse tocándolo en la cabecera. No es una cuenta ni sincroniza dispositivos.
- Si la primera visita viene de un NFC, la canción se desbloquea después de ingresar el nombre.
- Reiniciar está debajo de los álbumes: borra el recorrido y conserva el nombre.
- Ocho canciones de la carpeta de fotos. Las seis originales se retiraron del catálogo. Sus enlaces antiguos ya no desbloquean canciones; los avances válidos se conservan. Fotos originales preservadas; tapas copiadas a `assets/albums/`.
- Una tapa bloqueada se oculta completamente tras un fondo gris y un candado. Aparece al desbloquearla.

## Transiciones

Entradas de secciones, desplazamiento direccional de álbumes, apertura de menú lateral, aparición de diálogos y revelado de tapas. Respuesta visual al tocar botones. Animaciones nativas de 160–460 ms, sin dependencias ni descarga adicional. Los clics rápidos cancelan la animación anterior; no retrasan el cambio de álbum. Respeta `prefers-reduced-motion`, incluso si cambia durante la sesión. Sin API de animación, las acciones siguen funcionando.

Investigación: [artículo de campusMVP](https://www.campusmvp.es/recursos/post/bibliotecas-de-animaciones-con-css-y-javascript.aspx), [Animate.css](https://animate.style/), [Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) y [movimiento reducido](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion). Se tomaron patrones de interacción como referencia; no se incorporaron bibliotecas completas.

Verificación lógica: `node verify.cjs`. Incluye navegación, cambios rápidos del carrusel, cancelación de animaciones, preferencia de movimiento reducido y alternativa sin API de animación. No sustituye una revisión visual en un teléfono real.

## Fragmentos de audio

`assets/audio/` contiene ocho MP3 de 30 segundos con entrada y salida suaves. Originales preservados en `Audios/`. `prepare-audio.py` define los puntos iniciales elegidos para riffs/estribillos; son una primera selección ajustable, no una medición de popularidad. Para cambiarlos, editar los segundos y ejecutar `python prepare-audio.py` (requiere FFmpeg).

Un reproductor compartido evita superposición. Pausa/Reproducir disponible en el diálogo y debajo del visor. Carrusel: reproduce al cambiar a una canción desbloqueada. Cuadrícula: mouse, teclado o toque en celular. Cambiar sección, esconder pestaña o reiniciar detiene la reproducción. Las canciones bloqueadas no se reproducen desde el visor.
