# Completar el catálogo USDA paso a paso

El catálogo empieza con los macros en `null`. Por eso la aplicación muestra `—` y mantiene desactivado `+ Agregar`. El proceso siguiente incorpora datos oficiales sin aceptar a ciegas el primer resultado.

## 1. Conserva tu clave privada

En `.env.local` debe existir:

```text
USDA_API_KEY=tu_clave_real
```

No uses el prefijo `VITE_`, no publiques el archivo y no envíes la clave por chat.

## 2. Prueba con cinco alimentos

Abre la terminal en la carpeta principal y ejecuta:

```powershell
npm run catalog:review
```

Se creará `scripts/usda-review.json`. El catálogo todavía no cambia.

## 3. Revisa las coincidencias

Cada alimento tendrá hasta cinco candidatos. Comprueba especialmente palabras como:

- `raw`, `cooked`, `roasted` o `fried`;
- `with skin` o `skinless`;
- `drained`, `canned` o `in oil`;
- porcentaje de grasa de carnes y lácteos.

Puedes adjuntar `scripts/usda-review.json` en ChatGPT para recibir ayuda con la selección. Ese reporte no contiene tu API key.

## 4. Registra solamente los candidatos aprobados

Copia:

```text
scripts/usda-selections.example.json
```

y nombra la copia:

```text
scripts/usda-selections.json
```

Completa el archivo así:

```json
{
  "selections": {
    "catalog-chicken-breast-cooked": 123456
  }
}
```

El número debe ser uno de los candidatos del reporte para ese alimento.

## 5. Aplica los datos

```powershell
npm run catalog:apply
```

El programa hará un respaldo, descargará el detalle y solo guardará alimentos con calorías, proteína, carbohidratos y grasas completos.

## 6. Comprueba la aplicación

```powershell
npm test
npm run build
npm run dev
```

En `Registrar` confirma que el alimento muestre macros, que `+ Agregar` esté activo y que aparezca en Inicio e Historial.

## 7. Completa el catálogo

Cuando los primeros cinco estén correctos:

```powershell
npm run catalog:review -- --all
```

Repite la revisión y aplicación. Para trabajar por grupos pequeños puedes usar:

```powershell
npm run catalog:review -- --limit=20
```

Si algo falla, no borres `scripts/backups/`. Conserva también el mensaje completo de la terminal.
