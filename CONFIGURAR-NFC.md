# Configurar las ocho etiquetas

Primero publicá la página en HTTPS. Un archivo local o `localhost` no sirve para los celulares de los visitantes.

1. Abrí la web publicada. Abajo, tocá **Organización**.
2. Ingresá con `benjaguerra192@gmail.com` y la contraseña que creaste en Supabase.
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
| Billie Jean | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=billie-jean` |
| Take on Me | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=take-on-me` |
| With or Without You | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=with-or-without-you` |
| Sweet Dreams (Are Made of This) | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=sweet-dreams` |
| Every Breath You Take | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=every-breath-you-take` |
| Bohemian Rhapsody | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=bohemian-rhapsody` |
| Sweet Child o’ Mine | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=sweet-child` |
| La Isla Bonita | `https://benjaguerra192.github.io/gallerynight26.github.io/?nfc=la-isla-bonita` |

## Qué pasa al escanear

El teléfono abre la URL. La web pide el nombre familiar si falta, guarda la canción y abre su ventana con un fragmento local de 30 segundos. Spotify queda como botón opcional.

Si el navegador bloquea el audio automático, tocá **Reproducir**. Podés pausar desde la misma ventana. El carrusel reproduce el álbum desbloqueado actual; la cuadrícula reproduce al pasar el mouse o tocar la tarjeta en celular. Al salir de la sección o esconder la pestaña, se pausa.

Los enlaces NFC existentes siguen funcionando mediante las equivalencias de abajo. Publicá también `audio.js`, `audio.css` y `assets/audio/`. Usá siempre el mismo navegador para conservar la colección.

La sesión de Organización se conserva al recargar y se cierra con **Cerrar sesión**. Los permisos se verifican en Supabase. Los enlaces pueden compartirse y no demuestran presencia física.

Las ocho URLs de Spotify están en `app.js`. Se verificaron título y artista en Spotify; algunas ediciones son remasterizaciones o compilaciones y pueden diferir de las tapas aportadas. Para otra edición: Spotify → Compartir → Copiar enlace y reemplazá el campo `spotify` de esa canción. https://support.spotify.com/us/article/share-from-spotify/

## Etiquetas anteriores

No hace falta regrabar las etiquetas existentes. Las canciones que siguen en el catálogo conservan su enlace. Las retiradas abren estas nuevas canciones:

| Enlace anterior | Canción actual |
| --- | --- |
| `war-pigs` | Billie Jean |
| `tratame-suavemente` | With or Without You |
| `te-para-tres` | Sweet Dreams |
| `ruta-66` | Every Breath You Take |
| `post-crucifixion` | Bohemian Rhapsody |
| `kiss` | La Isla Bonita |

Actualizá los rótulos físicos si tenían los títulos anteriores. La competencia comienza desde un registro nuevo; el avance local del demo no se importa porque carece de horarios verificables.

## Desbloqueo desde Organización

Entrá con tu cuenta administradora, registrá una familia de prueba y tocá **Desbloquear todas las canciones**. Quedan guardadas en Supabase y esa familia queda fuera del premio. En el leaderboard podés borrar desbloqueos, reiniciar tiempo y avance o eliminar esa familia, siempre con confirmación.

El registro inicia el reloj. Cada escaneo guarda la primera hora de desbloqueo; repetirlo no la modifica. Al completar ocho se congela el tiempo final. Cerrado el recorrido, no se admiten registros ni desbloqueos nuevos; se puede escuchar lo conseguido. Los horarios y la clasificación se administran desde Organización, sin salir de la web.
