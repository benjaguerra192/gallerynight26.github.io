# Configurar las ocho etiquetas

Primero publicá la página en HTTPS. Un archivo local o `localhost` no sirve para los celulares de los visitantes.

1. Abrí la web publicada. Abajo, tocá **Organización**.
2. Contraseña: `nadielaadivina`.
3. Ingresá la dirección pública completa, por ejemplo `https://benjaguerra192.github.io/gallerynight26.github.io/`.
4. Copiá el enlace de una canción.
5. En **NFC Tools**: **Escribir → Añadir registro → URL/URI**. Pegá el enlace, validá y tocá **Escribir**.
6. Acercá una etiqueta grabable al celular y esperá la confirmación. Dejá un único registro URL por etiqueta.
7. Repetí con otra canción y otra etiqueta. Probá cada una con el celular desbloqueado.

Guía oficial: https://www.wakdev.com/en/knowledge-base/how-to-guides/how-to-write-a-link-url-on-an-nfc-chip.html

## Enlaces a grabar

Estos enlaces corresponden a la página publicada en GitHub Pages. No grabes el enlace de Spotify directamente: se saltearía el desbloqueo en la colección.

| Canción | Enlace NFC |
| --- | --- |
| War Pigs | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=war-pigs` |
| Trátame suavemente | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=tratame-suavemente` |
| Té para tres | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=te-para-tres` |
| Sweet Child o’ Mine | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=sweet-child` |
| Ruta 66 | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=ruta-66` |
| Post-crucifixión | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=post-crucifixion` |
| I Was Made for Lovin’ You | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=kiss` |
| Take on Me | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=take-on-me` |

## Qué pasa al escanear

El teléfono abre la URL. La web pide el nombre familiar si falta, guarda la canción y abre su ventana con un fragmento local de 30 segundos. Spotify queda como botón opcional.

Si el navegador bloquea el audio automático, tocá **Reproducir**. Podés pausar desde la misma ventana. El carrusel reproduce el álbum desbloqueado actual; la cuadrícula reproduce al pasar el mouse o tocar la tarjeta en celular. Al salir de la sección o esconder la pestaña, se pausa.

Los enlaces NFC existentes siguen funcionando. Publicá también `audio.js`, `audio.css` y `assets/audio/`. Usá siempre el mismo navegador para conservar la colección.

El acceso de Organización se cierra al recargar o con **Cerrar acceso**. Es una barrera visual del sitio estático, no autenticación segura: la contraseña puede verse en el código. Los enlaces pueden compartirse y no demuestran presencia física.

Las ocho URLs de Spotify están en `app.js`. Se verificaron título y artista en Spotify; algunas ediciones son remasterizaciones o compilaciones y pueden diferir de las tapas aportadas. Para otra edición: Spotify → Compartir → Copiar enlace y reemplazá el campo `spotify` de esa canción. https://support.spotify.com/us/article/share-from-spotify/
