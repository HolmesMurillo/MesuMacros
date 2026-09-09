# Pasos finales para Holmes

Sigue estos pasos en orden. No pegues aquí ni compartas capturas de tus claves.

## 1. Copiar el proyecto

Descomprime la carpeta y ábrela en Visual Studio Code. La terminal debe terminar en la carpeta que contiene `package.json`.

## 2. Recuperar tus claves locales

El proyecto seguro no incluye `.env.local`. Copia tu archivo anterior dentro de la nueva carpeta o crea uno con:

```text
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
VITE_APP_URL=http://localhost:5173
USDA_API_KEY=TU_CLAVE_USDA
```

La clave USDA solo hace falta si vuelves a descargar datos; la aplicación ya trae el catálogo completo.

## 3. Completar permisos en Supabase

1. Entra a tu proyecto de Supabase.
2. Abre **SQL Editor**.
3. Abre en VS Code `supabase/migrations/202609030001_complete_app_permissions.sql`.
4. Copia todo el contenido.
5. Pégalo en SQL Editor y pulsa **Run** una sola vez.

## 4. Instalar y comprobar

Ejecuta cada comando por separado:

```powershell
npm install
npm test
npm run build
npm run dev
```

`npm test` debe terminar con `110 alimentos ... 110 habilitados`. `npm run build` debe terminar con `built` y sin errores.

## 5. Probar la aplicación

Abre exactamente la URL que indique Vite, preferiblemente `http://localhost:5173`.

Comprueba:

1. Registrar > elige arroz, cambia la cantidad y pulsa **Agregar al registro**.
2. Inicio > confirma que cambiaron calorías y macros.
3. Historial > prueba buscar, copiar, editar y eliminar.
4. Inicio > registra agua.
5. Progreso > añade dos pesos en fechas diferentes para ver la línea.
6. Perfil > completa tus datos y prueba **Usar recomendación**.
7. Solicita un correo de recuperación y confirma que abre `/reset-password`.

Si aparece `permission denied`, vuelve al paso 3. Si un correo apunta a otro puerto, corrige las URLs en Supabase y el valor de `VITE_APP_URL`.
