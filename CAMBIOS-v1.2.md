# MesuMacros v1.2

Preparación técnica para una beta instalable:

- Se añadió el manifiesto PWA y metadata para instalación en dispositivos móviles.
- Se añadieron iconos de 192 px y 512 px basados en el favicon de MesuMacros.
- Se añadió un service worker con navegación tolerante a desconexiones y caché de recursos locales.
- Se añadió la regla de rutas para Netlify, incluyendo callbacks de autenticación y recuperación de contraseña.
- El almacenamiento local ya no rompe la interfaz si el navegador bloquea o llena su cuota.
- La carpeta temporal local de Supabase queda excluida de futuras copias y commits.

## Validación

- `npm run lint`: correcto.
- `npm test`: correcto; 110 alimentos válidos y 110 IDs únicos.
- `npm run build`: correcto.
- Auditoría de dependencias de producción: 0 vulnerabilidades conocidas.

## Pendiente antes de invitar testers

- Publicar términos de uso y política de privacidad reales, y enlazarlos desde el registro.
- Configurar el dominio final en las variables de producción y en Supabase Authentication.
- Probar registro, confirmación de correo, recuperación de contraseña y búsqueda MESU contra el proyecto Supabase de producción.
- Completar una prueba manual en iPhone y Android.
