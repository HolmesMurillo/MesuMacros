# Pasos finales de MesuMacros 1.1

No compartas capturas ni archivos que muestren tus claves.

## 1. Conservar la conexión existente

Copia tu `.env.local` de la versión anterior a esta carpeta. No necesitas cambiar la URL ni la clave pública de Supabase.

## 2. Activar inglés para cuentas nuevas

En Supabase > **SQL Editor**, abre y ejecuta una sola vez:

```text
supabase/migrations/202609030002_language_defaults.sql
```

La migración no cambia el idioma de cuentas existentes. Puedes cambiarlo en cualquier momento con el botón **EN/ES**.

## 3. Activar “Buscar alimentos MESU”

La aplicación ya incluye la función segura en:

```text
supabase/functions/mesu-food-search/index.ts
```

Para desplegarla desde la terminal:

```powershell
npx supabase login
npx supabase init
npx supabase link --project-ref TU_PROJECT_REF
npx supabase functions deploy mesu-food-search
```

Si ya existe `supabase/config.toml`, omite `npx supabase init`.

Encuentra `TU_PROJECT_REF` en la URL del panel de tu proyecto de Supabase. No es una clave secreta.

Después, en el panel de Supabase abre **Project Settings > Edge Functions > Secrets**, crea un secreto llamado exactamente `USDA_API_KEY` y pega allí tu clave USDA. No la agregues a ninguna variable que empiece por `VITE_`.

## 4. Instalar y comprobar

```powershell
npm install
npm run lint
npm test
npm run build
npm run dev -- --host 0.0.0.0
```

## 5. Prueba rápida

1. Abre la aplicación y comprueba que inicia en inglés en un navegador sin preferencia guardada.
2. Usa **EN/ES** para cambiar de idioma.
3. En **Log / Registrar**, busca **Cooked whole egg / Huevo entero cocido**.
4. Elige 2 huevos y confirma que el peso total sea 100 g.
5. Pulsa **Search MESU foods / Buscar alimentos MESU**, busca `black coffee` y agrega un resultado.
6. Confirma el alimento en Inicio y en Historial.

Si la búsqueda MESU indica que no está conectada, revisa que la función esté desplegada y que el secreto `USDA_API_KEY` exista en Supabase.
