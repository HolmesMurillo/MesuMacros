# MesuMacros

Aplicación web de seguimiento nutricional construida con React, Vite y Supabase. Permite registrar alimentos, agua y medidas corporales; consultar el historial; comparar el consumo con metas personales; y mantener la información sincronizada por usuario.

## Funciones incluidas

- Inicio profesional con calorías, macros, hidratación, puntuación diaria, racha y gráfica semanal.
- Catálogo de 110 alimentos: 30 proteínas/lácteos y 20 en cada categoría restante.
- Calorías, proteína, carbohidratos y grasas completos para todos los alimentos del catálogo.
- Porciones en gramos, selección de comida, detalles nutricionales y búsqueda bilingüe.
- Registro manual con micronutrientes opcionales.
- Historial por día, 7 días o 30 días, con búsqueda, filtro por comida, edición, copia y eliminación.
- Progreso con radar nutricional, promedios, adherencia, peso, calorías y medidas corporales.
- Perfil, cálculo orientativo de metas, apariencia clara/oscura/sistema y respaldos JSON.
- Autenticación, recuperación de contraseña, sincronización y RLS mediante Supabase.
- Diseño adaptable para escritorio, tableta y móvil.
- PWA instalable con iconos propios y soporte básico sin conexión después de la primera visita.
- Interfaz completa en inglés y español, con inglés inicial para cuentas nuevas y selector EN/ES siempre accesible.
- Porciones cotidianas que convierten unidades a gramos; el peso calculado se puede corregir manualmente.
- Búsqueda ampliada **MESU** para alimentos, café, té, bebidas y productos de marca mediante una Supabase Edge Function.

## Instalación local

Requiere Node.js 20.19 o superior, o Node.js 22.12 o superior.

```bash
npm install
npm run dev
```

Abre la dirección que muestre Vite, normalmente `http://localhost:5173`.

## Conectar Supabase

1. Crea `.env.local` en la raíz.
2. Añade solamente las claves públicas del proyecto:

   ```text
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
   VITE_APP_URL=http://localhost:5173
   ```

3. En Supabase, abre **SQL Editor** y ejecuta primero `supabase/schema.sql` si las tablas aún no existen.
4. Si ya creaste las tablas anteriormente, ejecuta `supabase/migrations/202609030001_complete_app_permissions.sql` para completar permisos y políticas.
5. Ejecuta `supabase/migrations/202609030002_language_defaults.sql` para que las cuentas nuevas comiencen en inglés.
6. En **Authentication > URL Configuration** usa:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`

En producción reemplaza localhost por el dominio HTTPS real. Nunca pongas `service_role`, la contraseña de la base de datos ni `USDA_API_KEY` en variables que comiencen con `VITE_`.

## Comprobaciones

```bash
npm run lint
npm test
npm run build
```

`npm test` valida que los 110 alimentos tengan IDs únicos, fuentes y los cuatro macronutrientes principales.

## Publicación

La carpeta `public` incluye el manifiesto, service worker, iconos instalables y la regla `_redirects` necesaria para que las rutas de autenticación funcionen al abrirse directamente en Netlify. Antes de publicar, configura `VITE_APP_URL` con el dominio HTTPS definitivo y añade ese mismo dominio a las URL permitidas de Supabase.

## Catálogo USDA

El catálogo está almacenado localmente en `src/data/commonFoods.js`; los usuarios finales no necesitan una cuenta ni una clave de USDA. Los datos genéricos se atribuyen a [USDA FoodData Central](https://fdc.nal.usda.gov/), que publica sus datos en dominio público/CC0.

El proyecto conserva herramientas para revisar o actualizar el catálogo en desarrollo:

```bash
npm run catalog:review -- --all
npm run catalog:apply
npm run catalog:finalize
```

La clave `USDA_API_KEY` se usa solo en `.env.local` al ejecutar los scripts. No se envía al navegador ni se incluye en producción.

Para la búsqueda ampliada, despliega `supabase/functions/mesu-food-search` y guarda `USDA_API_KEY` como secreto de la Edge Function. Consulta `PASOS-FINALES-v1.1.md`; la clave tampoco se envía al navegador en este flujo.

## Estructura principal

- `src/App.jsx`: sesión, navegación, sincronización y operaciones principales.
- `src/components/pages/`: Inicio, Registrar, Historial, Progreso y Perfil.
- `src/components/NutritionCharts.jsx`: radar, tendencia corporal y barras semanales en SVG/CSS.
- `src/services/supabaseData.js`: lectura y escritura segura de datos por usuario.
- `src/utils/analytics.js`: promedios, adherencia, series y rachas.
- `src/data/commonFoods.js`: catálogo nutricional integrado.
- `supabase/`: esquema y migraciones.

## Privacidad y límites

Cada tabla usa Row Level Security para limitar los datos a `auth.uid()`. La aplicación también mantiene una copia local para tolerar fallos de conexión y permite exportar un respaldo.

Los cálculos de calorías y metas son aproximaciones informativas. No sustituyen diagnóstico ni consejo médico o nutricional profesional.
