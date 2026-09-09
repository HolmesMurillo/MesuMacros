# MesuMacros 1.0 — cambios realizados

Fecha: 3 de septiembre de 2026.

## Aplicación

- Inicio rediseñado con balance energético, puntuación diaria, macros, agua, recomendaciones, racha y semana.
- Historial real por día, 7 días y 30 días, con búsqueda, filtro, copia, edición y eliminación.
- Progreso terminado con radar de seis ejes, promedios, adherencia, gráfica de peso, calorías y medidas corporales.
- Perfil ampliado con progreso de configuración, datos personales, ritmo, metas editables, preferencias y respaldos.
- Navegación, estados vacíos, mensajes, botones y diseño móvil modernizados.

## Catálogo

- 110 alimentos habilitados.
- 30 proteínas/lácteos, 20 cereales/almidones, 20 frutas, 20 vegetales y 20 grasas/nueces/semillas.
- Los 110 tienen calorías, proteína, carbohidratos y grasas por 100 g.
- Se añadieron cantidad, comida de destino, detalles nutricionales y fuente.
- Las imágenes principales se eligen por el macronutriente dominante.

## Datos y Supabase

- Se corrigieron campos incorrectos durante la sincronización.
- Guardar y editar alimentos usan operaciones distintas.
- Eliminación remota para alimentos, agua y medidas.
- Generación de IDs compatible con HTTP local y navegadores sin `crypto.randomUUID`.
- Nueva migración con permisos y RLS para todas las tablas usadas.
- Recuperación de contraseña redirige automáticamente a `/reset-password`.

## Validaciones ejecutadas

- `npm run lint`: sin errores ni advertencias.
- `npm test`: catálogo, analíticas, rachas, mediciones e IDs aprobados.
- `npm run build`: compilación de producción aprobada.
- `npm audit --omit=dev`: 0 vulnerabilidades conocidas.

La configuración real de Supabase debe probarse en el equipo del propietario porque las claves privadas se excluyen del proyecto seguro.
