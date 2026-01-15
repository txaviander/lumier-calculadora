# Manual Técnico de Cálculos - Lumier Calculadora de Renovaciones

## Documento para Revisión del Equipo Financiero

**Versión:** 2.0
**Fecha:** Enero 2026
**Propósito:** Documentar todas las fórmulas, constantes y lógica de cálculo para validación y mejora continua.

---

# ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Variables de Entrada](#2-variables-de-entrada)
3. [Cálculos de Adquisición](#3-cálculos-de-adquisición)
4. [Cálculos de Reforma (Hard Costs)](#4-cálculos-de-reforma-hard-costs)
5. [Cálculos de Soft Costs](#5-cálculos-de-soft-costs)
6. [Cálculos de Venta](#6-cálculos-de-venta)
7. [Cálculos de Financiación](#7-cálculos-de-financiación)
8. [Métricas de Rentabilidad](#8-métricas-de-rentabilidad)
9. [Análisis de Sensibilidad](#9-análisis-de-sensibilidad)
10. [Constantes y Parámetros Configurables](#10-constantes-y-parámetros-configurables)
11. [Áreas de Mejora Identificadas](#11-áreas-de-mejora-identificadas)

---

# 1. Resumen Ejecutivo

La calculadora determina la rentabilidad de proyectos de renovación inmobiliaria calculando:

```
BENEFICIO NETO = Venta Neta - Inversión Total

Donde:
- Venta Neta = Precio Venta - Honorarios Venta
- Inversión Total = Adquisición + Gastos Reforma + Intereses Financieros
```

### Indicadores Clave de Decisión

| Indicador | Fórmula | Umbral Recomendado |
|-----------|---------|-------------------|
| **Margen** | Beneficio Neto / Precio Venta × 100 | ≥ 16% = OPORTUNIDAD |
| **ROI** | Beneficio Neto / Inversión Total × 100 | ≥ 20% |
| **TIR Anual** | ((Venta Neta / Inversión Total)^(12/meses)) - 1 | ≥ 30% |

### Clasificación de Proyectos

| Margen | Clasificación | Recomendación |
|--------|---------------|---------------|
| ≥ 16% | OPORTUNIDAD | Proceder con el proyecto |
| 13% - 16% | AJUSTADO | Revisar costes, negociar precio |
| < 13% | NO HACER | Descartar o renegociar significativamente |

---

# 2. Variables de Entrada

## 2.1 Datos del Inmueble

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `ciudad` | Texto | Ciudad del inmueble | "Madrid" |
| `direccion` | Texto | Dirección completa | "Calle Mayor 15" |
| `planta` | Texto | Planta del piso | "2º" |
| `m2Construidos` | Número | Metros cuadrados construidos | 158 |
| `m2ZZCC` | Número | Metros cuadrados zonas comunes | 11 |
| `terrazaM2` | Número | Metros cuadrados de terraza | 2 |
| `exterior` | Booleano | Si es exterior o interior | true |
| `ascensor` | Booleano | Si tiene ascensor | true |
| `portero` | Booleano | Si tiene portero | true |
| `ite` | Booleano | Si tiene ITE pasada | true |
| `garaje` | Booleano | Si incluye garaje | false |
| `toldoPergola` | Booleano | Si necesita toldo/pérgola | false |

### Cálculo de M2 Totales

```
M2 Totales = m2Construidos + m2ZZCC
```

**Ejemplo:**
```
M2 Totales = 158 + 11 = 169 m²
```

## 2.2 Datos de Compra

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `precioCompra` | Número | Precio de compra del inmueble | 1.065.000 € |
| `fechaCompra` | Fecha | Fecha prevista de compra | 2026-01-15 |
| `intermediacionCompra` | Booleano | Si hay intermediario en compra | false |
| `porcentajeIntermediacionCompra` | Número | % de comisión del intermediario | 3% |

## 2.3 Datos de Venta

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `precioVenta` | Número | Precio de venta estimado | 1.600.000 € |
| `fechaVenta` | Fecha | Fecha prevista de venta | 2026-08-15 |
| `intermediacionVenta` | Booleano | Si hay intermediario en venta | true |
| `porcentajeIntermediacionVenta` | Número | % de comisión del intermediario | 3% |

## 2.4 Datos de Reforma

| Variable | Tipo | Descripción | Valores |
|----------|------|-------------|---------|
| `calidad` | Número (1-5) | Nivel de calidad de la reforma | 1★ a 5★ |
| `habitaciones` | Número | Número de habitaciones | 3 |
| `banos` | Número | Número de baños | 3 |
| `esClasico` | Booleano | Si el estilo es clásico | false |
| `ventanas` | Número | Número de ventanas | 20 |
| `calefaccion` | Texto | Tipo de calefacción | "CENTRAL" |
| `climatizacion` | Texto | Tipo de climatización | "CONDUCTOS" |
| `extras` | Número | Costes extras adicionales | 0 € |

## 2.5 Datos de Financiación

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `deuda` | Número | Importe de la deuda/préstamo | 500.000 € |
| `interesFinanciero` | Número | Tipo de interés anual | 6,25% |

---

# 3. Cálculos de Adquisición

## 3.1 Honorarios de Compra (si hay intermediación)

```
Honorario Compra Base = Precio Compra × (% Intermediación / 100)
IVA Honorario = Honorario Compra Base × 0,21
Honorario Compra Total = Honorario Compra Base + IVA Honorario
```

**Si NO hay intermediación:**
```
Honorario Compra Total = 0 €
```

**Ejemplo con intermediación al 3%:**
```
Honorario Compra Base = 1.065.000 × 0,03 = 31.950 €
IVA Honorario = 31.950 × 0,21 = 6.709,50 €
Honorario Compra Total = 31.950 + 6.709,50 = 38.659,50 €
```

## 3.2 Inscripción y Escritura

```
Inscripción Escritura = 1.530 € (constante fija)
```

> ⚠️ **ÁREA DE MEJORA:** Este valor es fijo. Podría variar según el precio del inmueble o la comunidad autónoma.

## 3.3 Impuesto de Transmisiones Patrimoniales (ITP)

```
ITP = Precio Compra × 0,02 (2%)
```

**Ejemplo:**
```
ITP = 1.065.000 × 0,02 = 21.300 €
```

> ⚠️ **ÁREA DE MEJORA:** El ITP varía por comunidad autónoma:
> - Madrid: 6%
> - Cataluña: 10%
> - Andalucía: 7%
>
> **Actualmente se usa 2%, que parece ser solo la parte de AJD (Actos Jurídicos Documentados). Revisar si debe incluirse el ITP completo.**

## 3.4 Total Adquisición

```
Total Adquisición = Precio Compra + Honorario Compra + Inscripción Escritura + ITP
```

**Ejemplo (sin intermediación):**
```
Total Adquisición = 1.065.000 + 0 + 1.530 + 21.300 = 1.087.830 €
```

**Ejemplo (con intermediación 3%):**
```
Total Adquisición = 1.065.000 + 38.659,50 + 1.530 + 21.300 = 1.126.489,50 €
```

---

# 4. Cálculos de Reforma (Hard Costs)

Los costes de reforma varían según el nivel de calidad seleccionado (1 a 5 estrellas).

## 4.1 Coste de Obra

| Calidad | €/m² | Descripción |
|---------|------|-------------|
| ★ (1) | 350 €/m² | Reforma básica |
| ★★ (2) | 420 €/m² | Reforma estándar |
| ★★★ (3) | 560 €/m² | Reforma media-alta |
| ★★★★ (4) | 700 €/m² | Reforma premium |
| ★★★★★ (5) | 900 €/m² | Reforma de lujo |

```
Coste Obra = m2Construidos × Coste por m² según calidad
```

**Ejemplo (Calidad 3★, 158 m²):**
```
Coste Obra = 158 × 560 = 88.480 €
```

## 4.2 Coste de Calidad de Materiales

| Calidad | €/m² | Descripción |
|---------|------|-------------|
| ★ (1) | 300 €/m² | Materiales básicos |
| ★★ (2) | 400 €/m² | Materiales estándar |
| ★★★ (3) | 512 €/m² | Materiales media-alta |
| ★★★★ (4) | 650 €/m² | Materiales premium |
| ★★★★★ (5) | 850 €/m² | Materiales de lujo |

```
Coste Materiales = m2Construidos × Coste por m² según calidad
```

**Ejemplo (Calidad 3★, 158 m²):**
```
Coste Materiales = 158 × 512 = 80.896 €
```

## 4.3 Coste de Interiorismo

| Calidad | €/m² | Descripción |
|---------|------|-------------|
| ★ (1) | 40 €/m² | Interiorismo básico |
| ★★ (2) | 50 €/m² | Interiorismo estándar |
| ★★★ (3) | 59,10 €/m² | Interiorismo media-alta |
| ★★★★ (4) | 75 €/m² | Interiorismo premium |
| ★★★★★ (5) | 95 €/m² | Interiorismo de lujo |

```
Coste Interiorismo Base = m2Construidos × Coste por m² según calidad

Si esClasico = true:
    Coste Interiorismo = Coste Interiorismo Base + 790 €
Sino:
    Coste Interiorismo = Coste Interiorismo Base
```

**Ejemplo (Calidad 3★, 158 m², no clásico):**
```
Coste Interiorismo = 158 × 59,10 = 9.337,80 €
```

**Ejemplo (Calidad 3★, 158 m², estilo clásico):**
```
Coste Interiorismo = 158 × 59,10 + 790 = 10.127,80 €
```

## 4.4 Coste de Mobiliario

| Calidad | €/m² | Descripción |
|---------|------|-------------|
| ★ (1) | 60 €/m² | Mobiliario básico |
| ★★ (2) | 80 €/m² | Mobiliario estándar |
| ★★★ (3) | 101,70 €/m² | Mobiliario media-alta |
| ★★★★ (4) | 130 €/m² | Mobiliario premium |
| ★★★★★ (5) | 170 €/m² | Mobiliario de lujo |

```
Coste Mobiliario = m2Construidos × Coste por m² según calidad
```

**Ejemplo (Calidad 3★, 158 m²):**
```
Coste Mobiliario = 158 × 101,70 = 16.068,60 €
```

## 4.5 Coste de Terraza

```
Si terrazaM2 > 0:
    Coste Terraza = terrazaM2 × 36,50 €/m²
Sino:
    Coste Terraza = 0 €
```

**Ejemplo (2 m² de terraza):**
```
Coste Terraza = 2 × 36,50 = 73 €
```

## 4.6 Coste de Toldo/Pérgola

```
Si toldoPergola = true:
    Coste Toldo = 2.500 €
Sino:
    Coste Toldo = 0 €
```

## 4.7 Extras

```
Extras = Valor introducido por el usuario (por defecto 0 €)
```

## 4.8 Total Hard Costs

```
Hard Costs = Obra + Materiales + Interiorismo + Mobiliario + Terraza + Toldo + Extras
```

**Ejemplo (Calidad 3★, 158 m², sin terraza especial, sin toldo, sin extras):**
```
Hard Costs = 88.480 + 80.896 + 9.337,80 + 16.068,60 + 73 + 0 + 0 = 194.855,40 €
```

---

# 5. Cálculos de Soft Costs

## 5.1 Coste de Arquitectura

| Calidad | €/m² | Descripción |
|---------|------|-------------|
| ★ (1) | 25 €/m² | Proyecto básico |
| ★★ (2) | 32 €/m² | Proyecto estándar |
| ★★★ (3) | 38,30 €/m² | Proyecto media-alta |
| ★★★★ (4) | 48 €/m² | Proyecto premium |
| ★★★★★ (5) | 60 €/m² | Proyecto de lujo |

```
Coste Arquitectura = m2Construidos × Coste por m² según calidad
```

**Ejemplo (Calidad 3★, 158 m²):**
```
Coste Arquitectura = 158 × 38,30 = 6.051,40 €
```

## 5.2 Permiso de Construcción

```
Permiso Construcción = m2Construidos × 34,20 €/m²
```

**Ejemplo (158 m²):**
```
Permiso Construcción = 158 × 34,20 = 5.403,60 €
```

> ⚠️ **ÁREA DE MEJORA:** Este coste podría variar según el ayuntamiento y el tipo de obra.

## 5.3 Gastos de Venta

```
Gastos Venta = 800 € (constante fija)
```

Incluye:
- Certificado energético
- Cédula de habitabilidad
- Otros gastos menores de venta

> ⚠️ **ÁREA DE MEJORA:** Desglosar este concepto y hacerlo configurable.

## 5.4 Costos de Tenencia

```
Costos Tenencia = 2.490 € (constante fija)
```

Incluye:
- IBI proporcional
- Comunidad de propietarios
- Seguros
- Suministros durante la obra

> ⚠️ **ÁREA DE MEJORA:** Este valor debería calcularse en función de la duración del proyecto y el precio del inmueble.

## 5.5 Plusvalía Municipal

```
Plusvalía = Precio Venta × 0,0027 (0,27%)
```

**Ejemplo:**
```
Plusvalía = 1.600.000 × 0,0027 = 4.320 €
```

> ⚠️ **ÁREA DE MEJORA:** La plusvalía municipal real se calcula de forma más compleja, considerando:
> - Valor catastral del suelo
> - Años de tenencia
> - Coeficientes municipales

## 5.6 Total Soft Costs

```
Soft Costs = Arquitectura + Permiso Construcción + Gastos Venta + Costos Tenencia + Plusvalía
```

**Ejemplo:**
```
Soft Costs = 6.051,40 + 5.403,60 + 800 + 2.490 + 4.320 = 19.065 €
```

---

# 6. Cálculos de Venta

## 6.1 Honorarios de Venta (si hay intermediación)

```
Honorarios Venta Base = Precio Venta × (% Intermediación / 100)
IVA Honorarios = Honorarios Venta Base × 0,21
Honorarios Venta Total = Honorarios Venta Base + IVA Honorarios
```

**Si NO hay intermediación:**
```
Honorarios Venta Total = 0 €
```

**Ejemplo con intermediación al 3%:**
```
Honorarios Venta Base = 1.600.000 × 0,03 = 48.000 €
IVA Honorarios = 48.000 × 0,21 = 10.080 €
Honorarios Venta Total = 48.000 + 10.080 = 58.080 €
```

## 6.2 Venta Neta

```
Venta Neta = Precio Venta - Honorarios Venta Total
```

**Ejemplo:**
```
Venta Neta = 1.600.000 - 58.080 = 1.541.920 €
```

---

# 7. Cálculos de Financiación

## 7.1 Interés del Proyecto

La fórmula asume que el préstamo se usa durante la mitad del proyecto (promedio).

```
Interés Proyecto = Deuda × (Interés Anual / 100) / 2
```

**Ejemplo (500.000 € de deuda al 6,25%):**
```
Interés Proyecto = 500.000 × (6,25 / 100) / 2 = 15.625 €
```

> ⚠️ **ÁREA DE MEJORA:** El cálculo actual asume:
> - Que el préstamo se dispone al inicio y se devuelve al final
> - Que en promedio se usa la mitad del tiempo
> - No considera comisiones de apertura, cancelación anticipada, etc.
>
> **Propuesta:** Calcular intereses reales basados en las fechas del proyecto.

## 7.2 Equity Necesario

```
Equity Necesario = Total Adquisición + Total Gastos - Deuda
```

**Ejemplo:**
```
Total Adquisición = 1.087.830 €
Total Gastos = 213.920,40 € (Hard Costs + Soft Costs)
Deuda = 500.000 €

Equity Necesario = 1.087.830 + 213.920,40 - 500.000 = 801.750,40 €
```

---

# 8. Métricas de Rentabilidad

## 8.1 Inversión Total

```
Inversión Total = Total Adquisición + Total Gastos + Interés Proyecto

Donde:
Total Gastos = Hard Costs + Soft Costs
```

**Ejemplo:**
```
Inversión Total = 1.087.830 + 194.855,40 + 19.065 + 15.625 = 1.317.375,40 €
```

## 8.2 Beneficio Neto

```
Beneficio Neto = Venta Neta - Inversión Total
```

**Ejemplo:**
```
Beneficio Neto = 1.541.920 - 1.317.375,40 = 224.544,60 €
```

## 8.3 ROI (Return on Investment)

```
ROI = (Beneficio Neto / Inversión Total) × 100
```

**Ejemplo:**
```
ROI = (224.544,60 / 1.317.375,40) × 100 = 17,04%
```

## 8.4 Margen sobre Venta

```
Margen = (Beneficio Neto / Precio Venta) × 100
```

**Ejemplo:**
```
Margen = (224.544,60 / 1.600.000) × 100 = 14,03%
```

## 8.5 TIR (Tasa Interna de Retorno) Anualizada

```
Días Proyecto = Fecha Venta - Fecha Compra
Meses Proyecto = Días Proyecto / 30,44

TIR = ((Venta Neta / Inversión Total) ^ (12 / Meses Proyecto)) - 1
TIR Porcentaje = TIR × 100
```

**Ejemplo (proyecto de 7 meses):**
```
Días Proyecto = 212 días
Meses Proyecto = 212 / 30,44 = 6,97 meses

TIR = ((1.541.920 / 1.317.375,40) ^ (12 / 6,97)) - 1
TIR = (1,1704 ^ 1,72) - 1
TIR = 1,3156 - 1 = 0,3156
TIR Porcentaje = 31,56%
```

## 8.6 Métricas por Metro Cuadrado

```
€/m² Compra = Precio Compra / M2 Totales
€/m² Inversión = Inversión Total / M2 Totales
€/m² Venta = Precio Venta / M2 Totales
€/m² Beneficio = Beneficio Neto / M2 Totales
```

**Ejemplo (169 m² totales):**
```
€/m² Compra = 1.065.000 / 169 = 6.301,78 €/m²
€/m² Inversión = 1.317.375,40 / 169 = 7.794,53 €/m²
€/m² Venta = 1.600.000 / 169 = 9.467,46 €/m²
€/m² Beneficio = 224.544,60 / 169 = 1.328,67 €/m²
```

---

# 9. Análisis de Sensibilidad

## 9.1 Precio de Venta Necesario para un Margen Objetivo

La calculadora puede determinar qué precio de venta se necesita para alcanzar un margen objetivo.

```
Comisión Venta con IVA = (% Intermediación / 100) × 1,21
Tasa Plusvalía = 0,0027

Precio Venta Necesario = Inversión Base / (1 - Comisión Venta con IVA - Tasa Plusvalía - Margen Objetivo / 100)
```

**Ejemplo (margen objetivo 20%, con intermediación 3%):**
```
Comisión Venta con IVA = 0,03 × 1,21 = 0,0363
Inversión Base = 1.301.750,40 € (sin plusvalía, que depende del precio de venta)

Precio Venta Necesario = 1.301.750,40 / (1 - 0,0363 - 0,0027 - 0,20)
Precio Venta Necesario = 1.301.750,40 / 0,761
Precio Venta Necesario = 1.710.578,71 €
```

## 9.2 Comparativa por Nivel de Calidad

La calculadora genera una tabla comparativa para cada nivel de calidad (2★ a 5★) mostrando:

| Calidad | Inversión Total | PV para 15% | PV para 20% | Beneficio Esperado |
|---------|-----------------|-------------|-------------|-------------------|
| ★★ (2) | Calculado | Calculado | Calculado | Calculado |
| ★★★ (3) | Calculado | Calculado | Calculado | Calculado |
| ★★★★ (4) | Calculado | Calculado | Calculado | Calculado |
| ★★★★★ (5) | Calculado | Calculado | Calculado | Calculado |

---

# 10. Constantes y Parámetros Configurables

## 10.1 Constantes Fijas Actuales

| Constante | Valor | Ubicación en Código | Comentario |
|-----------|-------|---------------------|------------|
| ITP | 2% | `itp = precioCompra * 0.02` | ⚠️ Debería variar por CCAA |
| Inscripción Escritura | 1.530 € | `inscripcionEscritura = 1530` | ⚠️ Valor fijo |
| Gastos Venta | 800 € | `gastosVenta = 800` | ⚠️ Valor fijo |
| Costos Tenencia | 2.490 € | `costosTenencia = 2490` | ⚠️ Valor fijo |
| Plusvalía | 0,27% | `plusvalia = precioVenta * 0.0027` | ⚠️ Simplificación |
| IVA | 21% | `* 1.21` | Correcto |
| Coste Terraza | 36,50 €/m² | `terrazaM2 * 36.5` | |
| Coste Toldo/Pérgola | 2.500 € | `toldoCost = 2500` | |
| Suplemento Estilo Clásico | 790 € | `esClasico ? 790 : 0` | |
| Permiso Construcción | 34,20 €/m² | `m2Construidos * 34.2` | ⚠️ Podría variar |
| Factor Interés Promedio | 0,5 | `deuda * interes / 2` | ⚠️ Simplificación |

## 10.2 Tablas de Costes por Calidad

### Obra (€/m²)
```javascript
{ 1: 350, 2: 420, 3: 560, 4: 700, 5: 900 }
```

### Materiales (€/m²)
```javascript
{ 1: 300, 2: 400, 3: 512, 4: 650, 5: 850 }
```

### Interiorismo (€/m²)
```javascript
{ 1: 40, 2: 50, 3: 59.1, 4: 75, 5: 95 }
```

### Mobiliario (€/m²)
```javascript
{ 1: 60, 2: 80, 3: 101.7, 4: 130, 5: 170 }
```

### Arquitectura (€/m²)
```javascript
{ 1: 25, 2: 32, 3: 38.3, 4: 48, 5: 60 }
```

---

# 11. Áreas de Mejora Identificadas

## 11.1 Prioridad Alta

### 1. ITP por Comunidad Autónoma
**Problema:** Se usa un 2% fijo cuando el ITP real varía significativamente.

**Propuesta:**
```javascript
const ITP_POR_CCAA = {
  'Madrid': 0.06,
  'Cataluña': 0.10,
  'Andalucía': 0.07,
  'Valencia': 0.10,
  'País Vasco': 0.04,
  // ... resto de CCAA
}
```

**Impacto:** En un piso de 1M€ en Madrid, la diferencia es de 40.000€ (6% vs 2%).

### 2. Plusvalía Municipal Real
**Problema:** Se usa un porcentaje fijo del precio de venta.

**Propuesta:** Implementar el cálculo real basado en:
- Valor catastral del suelo
- Coeficientes municipales por años de tenencia
- Tipo impositivo municipal

### 3. Costos de Tenencia Dinámicos
**Problema:** Se usa un valor fijo de 2.490€.

**Propuesta:**
```javascript
const calcularCostosTenencia = (precioCompra, mesesProyecto) => {
  const ibiMensual = precioCompra * 0.001 / 12  // Estimación
  const comunidadMensual = 150  // Configurable
  const seguroMensual = 50
  const suministrosMensual = 100

  return (ibiMensual + comunidadMensual + seguroMensual + suministrosMensual) * mesesProyecto
}
```

## 11.2 Prioridad Media

### 4. Inscripción y Escritura Variables
**Propuesta:** Escalar según precio del inmueble siguiendo aranceles notariales reales.

### 5. Gastos de Venta Desglosados
**Propuesta:** Separar en:
- Certificado energético: 150€
- Cédula habitabilidad: 100€
- Fotos profesionales: 300€
- Home staging: Variable
- Otros: Configurable

### 6. Cálculo de Intereses Mejorado
**Propuesta:**
```javascript
const calcularIntereses = (deuda, tasaAnual, fechaInicio, fechaFin, curvaDisposicion) => {
  // Considerar:
  // - Disposición progresiva del préstamo
  // - Comisión de apertura (típicamente 0.5-1%)
  // - Comisión de cancelación anticipada
  // - Intereses reales por días
}
```

## 11.3 Prioridad Baja (Mejoras Futuras)

### 7. Inflación de Costes
Considerar incremento de costes durante el proyecto.

### 8. Escenarios de Mercado
Permitir ajustar precios de venta según escenarios (optimista, base, pesimista).

### 9. Costes de Oportunidad
Incluir el coste de oportunidad del capital propio invertido.

### 10. Impuestos sobre Beneficios
Considerar IRPF o IS según el tipo de inversor.

---

# Anexo A: Ejemplo Completo de Cálculo

## Datos de Entrada

| Parámetro | Valor |
|-----------|-------|
| Precio Compra | 1.065.000 € |
| M² Construidos | 158 m² |
| M² ZZCC | 11 m² |
| Terraza | 2 m² |
| Calidad | 3★ |
| Estilo Clásico | No |
| Intermediación Compra | No |
| Intermediación Venta | Sí (3%) |
| Precio Venta | 1.600.000 € |
| Deuda | 500.000 € |
| Interés | 6,25% |
| Duración | 7 meses |

## Cálculo Paso a Paso

### 1. Adquisición
```
Precio Compra:          1.065.000,00 €
Honorarios Compra:              0,00 € (sin intermediación)
Inscripción Escritura:      1.530,00 €
ITP (2%):                  21.300,00 €
────────────────────────────────────────
TOTAL ADQUISICIÓN:      1.087.830,00 €
```

### 2. Hard Costs
```
Obra (158 × 560):          88.480,00 €
Materiales (158 × 512):    80.896,00 €
Interiorismo (158 × 59,1):  9.337,80 €
Mobiliario (158 × 101,7):  16.068,60 €
Terraza (2 × 36,5):            73,00 €
Toldo/Pérgola:                  0,00 €
Extras:                         0,00 €
────────────────────────────────────────
TOTAL HARD COSTS:        194.855,40 €
```

### 3. Soft Costs
```
Arquitectura (158 × 38,3):  6.051,40 €
Permiso (158 × 34,2):       5.403,60 €
Gastos Venta:                 800,00 €
Costos Tenencia:            2.490,00 €
Plusvalía (1,6M × 0,27%):   4.320,00 €
────────────────────────────────────────
TOTAL SOFT COSTS:          19.065,00 €
```

### 4. Total Gastos
```
Hard Costs:               194.855,40 €
Soft Costs:                19.065,00 €
────────────────────────────────────────
TOTAL GASTOS:             213.920,40 €
```

### 5. Financiación
```
Interés Proyecto: 500.000 × 6,25% / 2 = 15.625,00 €
```

### 6. Inversión Total
```
Adquisición:            1.087.830,00 €
Gastos:                   213.920,40 €
Intereses:                 15.625,00 €
────────────────────────────────────────
INVERSIÓN TOTAL:        1.317.375,40 €
```

### 7. Venta
```
Precio Venta:           1.600.000,00 €
Honorarios (3% + IVA):    -58.080,00 €
────────────────────────────────────────
VENTA NETA:             1.541.920,00 €
```

### 8. Resultado
```
Venta Neta:             1.541.920,00 €
Inversión Total:       -1.317.375,40 €
────────────────────────────────────────
BENEFICIO NETO:           224.544,60 €
```

### 9. Métricas
```
ROI:     224.544,60 / 1.317.375,40 × 100 = 17,04%
Margen:  224.544,60 / 1.600.000,00 × 100 = 14,03%
TIR:     ((1.541.920 / 1.317.375,40) ^ (12/7)) - 1 = 31,56%
```

### 10. Clasificación
```
Margen 14,03% → AJUSTADO (entre 13% y 16%)
Recomendación: Revisar costes o negociar precio de compra/venta
```

---

# Anexo B: Ubicación del Código

Los cálculos se encuentran en los siguientes archivos:

| Archivo | Función | Descripción |
|---------|---------|-------------|
| `lib/supabase.ts` | `calculateMetricsFromData()` | Cálculos para el dashboard |
| `app/[projectSlug]/page.tsx` | `calculations` (useMemo) | Cálculos principales |
| `app/[projectSlug]/page.tsx` | `calculateForQuality()` | Análisis de sensibilidad |
| `app/[projectSlug]/page.tsx` | `calculateRequiredSalePrice()` | Precio de venta objetivo |
| `app/[projectSlug]/page.tsx` | `calculateBenefitForQuality()` | Beneficio por calidad |

---

# Anexo C: Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Dic 2025 | Versión inicial |
| 2.0 | Ene 2026 | Añadido análisis de sensibilidad, gráficos comparativos, métricas en dashboard |

---

**Documento preparado para revisión del equipo financiero de Lumier Casas Boutique**

*Para sugerencias de mejora, contactar al equipo de desarrollo.*
