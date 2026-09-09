# Plantilla de confirmación

En Supabase ve a **Authentication > Email Templates > Confirm signup**.

- Subject recomendado: `Confirm your MesuMacros account / Confirma tu cuenta`
- Copia el contenido de `confirm-signup.html` en el editor HTML.
- En **Authentication > URL Configuration**, configura la Site URL y las Redirect URLs.
- Desarrollo: Site URL `http://localhost:5173` y Redirect URL `http://localhost:5173/**`.
- Producción: usa el dominio oficial y agrega exactamente `/auth/callback` y `/reset-password`.

La plantilla usa la variable oficial `{{ .ConfirmationURL }}`. No la reemplaces por tokens ni por una URL fija.
