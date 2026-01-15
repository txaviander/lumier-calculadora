# Guía de Despliegue - Lumier Calculadora Platform

## Guía Completa para Publicar tu Plataforma de Calculadoras Online

**Tiempo estimado:** 30-40 minutos
**Dificultad:** Fácil (no requiere conocimientos de programación)
**Coste:** Gratis (los servicios que usaremos tienen planes gratuitos)

---

## ¿Qué vamos a hacer?

Vamos a publicar tu plataforma en internet usando cuatro servicios gratuitos:

1. **Google Cloud** - Para permitir que los usuarios inicien sesión con su cuenta de Google @lumier.es
2. **Supabase** - Es la "base de datos" donde se guardarán todos los proyectos y sus versiones
3. **GitHub** - Es donde subiremos los archivos del proyecto (como un Google Drive para código)
4. **Vercel** - Es el servicio que publicará la web y le dará una dirección (URL)

**Resultado final:**
- Una web en `lumier-calculadora.vercel.app`
- Solo accesible para usuarios con email `@lumier.es`
- Login con un clic usando Google

---

# PARTE 1: Crear el Proyecto en Google Cloud

Esto es necesario para que los usuarios puedan iniciar sesión con su cuenta de Google.

## Paso 1.1: Acceder a Google Cloud Console

1. Abre tu navegador y ve a: **https://console.cloud.google.com**

2. Inicia sesión con tu cuenta de Google (preferiblemente la de `@lumier.es`)

3. Si es tu primera vez, te pedirá aceptar los términos de servicio:
   - Marca la casilla de "Acepto los términos"
   - Haz clic en **"Aceptar y continuar"**

---

## Paso 1.2: Crear un nuevo proyecto

1. Arriba a la izquierda, al lado de "Google Cloud", verás un desplegable que dice "Seleccionar proyecto" o el nombre de un proyecto
   - Haz clic en él

2. Se abrirá una ventana. Haz clic en **"NUEVO PROYECTO"** (arriba a la derecha de esa ventana)

3. Rellena los datos:

   ```
   ┌─────────────────────────────────────────────────────┐
   │  Nombre del proyecto:    Lumier Calculadora         │
   │                                                     │
   │  Ubicación:              Sin organización           │
   │                          (déjalo como está)         │
   └─────────────────────────────────────────────────────┘
   ```

4. Haz clic en **"CREAR"**

5. **Espera unos segundos** hasta que aparezca una notificación arriba a la derecha diciendo que el proyecto se creó

6. Haz clic en **"SELECCIONAR PROYECTO"** en esa notificación
   (O selecciónalo desde el desplegable de arriba a la izquierda)

---

## Paso 1.3: Configurar la pantalla de consentimiento de OAuth

Antes de crear las credenciales, necesitamos configurar qué verán los usuarios cuando inicien sesión.

1. En el menú de la izquierda (las tres rayitas ☰), busca y haz clic en:
   **"APIs y servicios"** → **"Pantalla de consentimiento de OAuth"**

   > 💡 Si no ves el menú, haz clic en el icono de hamburguesa (☰) arriba a la izquierda

2. Te preguntará el tipo de usuario:
   - Selecciona **"Externo"**
   - Haz clic en **"CREAR"**

3. Rellena el formulario (solo los campos obligatorios marcados con *):

   **Página 1 - Información de la aplicación:**
   ```
   ┌─────────────────────────────────────────────────────┐
   │  Nombre de la aplicación:    Lumier Calculadora     │
   │                                                     │
   │  Correo de asistencia:       tu-email@lumier.es     │
   │                              (selecciona tu email)  │
   └─────────────────────────────────────────────────────┘
   ```

   Baja hasta el final de la página:
   ```
   ┌─────────────────────────────────────────────────────┐
   │  Datos de contacto del desarrollador:               │
   │                                                     │
   │  Direcciones de correo:      tu-email@lumier.es     │
   └─────────────────────────────────────────────────────┘
   ```

4. Haz clic en **"GUARDAR Y CONTINUAR"**

5. **Página 2 - Permisos:** No toques nada, simplemente haz clic en **"GUARDAR Y CONTINUAR"**

6. **Página 3 - Usuarios de prueba:** No toques nada, simplemente haz clic en **"GUARDAR Y CONTINUAR"**

7. **Página 4 - Resumen:** Revisa que todo esté bien y haz clic en **"VOLVER AL PANEL"**

---

## Paso 1.4: Crear las credenciales de OAuth

Ahora vamos a crear las "llaves" que permitirán a la web usar el login de Google.

1. En el menú de la izquierda, haz clic en:
   **"APIs y servicios"** → **"Credenciales"**

2. Arriba, haz clic en **"+ CREAR CREDENCIALES"**

3. Selecciona **"ID de cliente de OAuth"**

4. Rellena el formulario:

   ```
   ┌─────────────────────────────────────────────────────┐
   │  Tipo de aplicación:     Aplicación web             │
   │                                                     │
   │  Nombre:                 Lumier Web                 │
   └─────────────────────────────────────────────────────┘
   ```

5. En la sección **"Orígenes de JavaScript autorizados"**, haz clic en **"+ AGREGAR URI"** y añade:

   ```
   http://localhost:3000
   ```

   > ⚠️ Más tarde añadiremos la URL de Vercel aquí. Por ahora solo ponemos localhost.

6. En la sección **"URIs de redireccionamiento autorizados"**, haz clic en **"+ AGREGAR URI"** y añade:

   ```
   http://localhost:3000/auth/callback
   ```

   > ⚠️ Más tarde también añadiremos la URL de Vercel aquí.

7. Haz clic en **"CREAR"**

8. ¡IMPORTANTE! Aparecerá una ventana con tus credenciales:

   ```
   ┌─────────────────────────────────────────────────────┐
   │  Tu ID de cliente:                                  │
   │  123456789-abcdefg.apps.googleusercontent.com       │
   │                                                     │
   │  Tu secreto de cliente:                             │
   │  GOCSPX-AbCdEfGhIjKlMnOp                            │
   └─────────────────────────────────────────────────────┘
   ```

   📝 **¡COPIA AMBOS VALORES Y GUÁRDALOS EN UN DOCUMENTO!**
   Los necesitarás más adelante.

9. Haz clic en **"ACEPTAR"**

---

## Paso 1.5: Publicar la aplicación (para que cualquiera pueda usarla)

Por defecto, Google limita el acceso solo a usuarios de prueba. Vamos a publicarla.

1. Ve a **"APIs y servicios"** → **"Pantalla de consentimiento de OAuth"**

2. En la sección "Estado de publicación", verás que dice **"Pruebas"**

3. Haz clic en **"PUBLICAR APLICACIÓN"**

4. Te aparecerá un aviso. Haz clic en **"CONFIRMAR"**

5. Ahora debería decir **"En producción"**

---

# PARTE 2: Crear la Base de Datos en Supabase

## Paso 2.1: Crear una cuenta en Supabase

1. Abre una nueva pestaña y ve a: **https://supabase.com**

2. Haz clic en el botón verde **"Start your project"**

3. Haz clic en **"Continue with GitHub"**

   > ⚠️ **Si no tienes cuenta de GitHub**, primero ve a la Parte 3, Paso 3.1, créala, y luego vuelve aquí

4. Autoriza Supabase cuando GitHub te lo pida

---

## Paso 2.2: Crear un nuevo proyecto

1. Haz clic en **"New Project"**

2. Si te pide crear una organización:
   - Haz clic en **"New Organization"**
   - Nombre: `Lumier`
   - Haz clic en **"Create organization"**

3. Configura el proyecto:

   ```
   ┌─────────────────────────────────────────────────────┐
   │  Name:            lumier-calculadora                │
   │                                                     │
   │  Database Password:  [Haz clic en "Generate"]       │
   │                      ⚠️ COPIA Y GUARDA ESTA         │
   │                      CONTRASEÑA                     │
   │                                                     │
   │  Region:          West EU (Ireland)                 │
   │                                                     │
   │  Pricing Plan:    Free (ya seleccionado)            │
   └─────────────────────────────────────────────────────┘
   ```

4. Haz clic en **"Create new project"**

5. **Espera 2-3 minutos** mientras se crea

---

## Paso 2.3: Configurar el login con Google en Supabase

1. En el menú de la izquierda de Supabase, haz clic en **"Authentication"** (icono de persona)

2. Luego haz clic en **"Providers"** (en el submenú)

3. Busca **"Google"** en la lista y haz clic en él para expandirlo

4. Activa el toggle **"Enable Sign in with Google"** (ponlo en verde)

5. Rellena los campos con los datos que guardaste de Google Cloud:

   ```
   ┌─────────────────────────────────────────────────────┐
   │  Client ID:                                         │
   │  [Pega tu "ID de cliente" de Google Cloud]          │
   │  Ejemplo: 123456789-abc.apps.googleusercontent.com  │
   │                                                     │
   │  Client Secret:                                     │
   │  [Pega tu "Secreto de cliente" de Google Cloud]     │
   │  Ejemplo: GOCSPX-AbCdEfGhIjKlMnOp                   │
   └─────────────────────────────────────────────────────┘
   ```

6. Haz clic en **"Save"**

---

## Paso 2.4: Copiar la URL de callback de Supabase

Todavía en la sección de Google en Supabase, verás un campo llamado **"Callback URL"** o **"Redirect URL"**.

```
Ejemplo: https://abcdefg.supabase.co/auth/v1/callback
```

📝 **Copia esta URL y guárdala** - la necesitaremos para Google Cloud.

---

## Paso 2.5: Añadir la URL de callback en Google Cloud

1. Vuelve a Google Cloud Console (https://console.cloud.google.com)

2. Ve a **"APIs y servicios"** → **"Credenciales"**

3. En la sección "IDs de cliente de OAuth 2.0", haz clic en **"Lumier Web"** (o el nombre que le pusiste)

4. En **"URIs de redireccionamiento autorizados"**, haz clic en **"+ AGREGAR URI"**

5. Pega la URL de callback de Supabase que copiaste:
   ```
   https://abcdefg.supabase.co/auth/v1/callback
   ```

6. Haz clic en **"GUARDAR"**

---

## Paso 2.6: Crear las tablas de la base de datos

1. Vuelve a Supabase

2. En el menú de la izquierda, haz clic en **"SQL Editor"**

3. Haz clic en **"New query"**

4. Abre el archivo `lib/database.sql` de la carpeta del proyecto en tu ordenador

5. **Selecciona todo** (Ctrl+A) y **copia** (Ctrl+C)

6. **Pega** en Supabase (Ctrl+V)

7. Haz clic en el botón verde **"Run"**

8. Deberías ver: **"Success. No rows returned"** ✅

---

## Paso 2.7: Obtener las credenciales de Supabase

1. En Supabase, ve a **"Project Settings"** (icono de engranaje ⚙️, abajo en el menú)

2. Haz clic en **"API"**

3. Copia estos dos valores:

   **Project URL:**
   ```
   https://abcdefg.supabase.co
   ```

   **anon public key:** (la que dice "anon" "public")
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

📝 **Guarda ambos valores en tu documento de notas**

---

# PARTE 3: Subir el Código a GitHub

## Paso 3.1: Crear una cuenta en GitHub (si no tienes)

1. Ve a: **https://github.com**

2. Haz clic en **"Sign up"**

3. Sigue los pasos:
   - Introduce tu email
   - Crea una contraseña
   - Elige un nombre de usuario
   - Verifica tu email

---

## Paso 3.2: Crear un repositorio

1. Inicia sesión en GitHub

2. Haz clic en el icono **"+"** (arriba a la derecha) → **"New repository"**

3. Configura:

   ```
   ┌─────────────────────────────────────────────────────┐
   │  Repository name:    lumier-calculadora             │
   │                                                     │
   │  ◉ Private                                          │
   │                                                     │
   │  ☐ Add a README file  (NO marcar)                   │
   └─────────────────────────────────────────────────────┘
   ```

4. Haz clic en **"Create repository"**

---

## Paso 3.3: Subir los archivos

1. En la página del repositorio, haz clic en **"uploading an existing file"**

2. En tu ordenador, abre la carpeta `lumier-calculadora-platform`

3. Selecciona TODOS los archivos y carpetas:
   - `app/`
   - `components/`
   - `lib/`
   - `package.json`
   - `next.config.js`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `tsconfig.json`
   - `.env.example`
   - `.gitignore`
   - `GUIA_DESPLIEGUE.md`

4. **Arrastra** todos los archivos a la zona de subida de GitHub

5. Espera a que se suban

6. En "Commit changes", escribe: `Subida inicial`

7. Haz clic en **"Commit changes"**

8. Espera a que termine

---

# PARTE 4: Publicar en Vercel

## Paso 4.1: Crear cuenta en Vercel

1. Ve a: **https://vercel.com**

2. Haz clic en **"Sign Up"** → **"Continue with GitHub"**

3. Autoriza Vercel

---

## Paso 4.2: Importar el proyecto

1. Haz clic en **"Add New..."** → **"Project"**

2. Busca **"lumier-calculadora"** y haz clic en **"Import"**

---

## Paso 4.3: Configurar las variables de entorno

1. Expande la sección **"Environment Variables"**

2. Añade estas DOS variables:

   **Variable 1:**
   ```
   Name:   NEXT_PUBLIC_SUPABASE_URL
   Value:  https://abcdefg.supabase.co  (tu URL de Supabase)
   ```
   → Haz clic en **"Add"**

   **Variable 2:**
   ```
   Name:   NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value:  eyJhbGciOi...  (tu anon key de Supabase)
   ```
   → Haz clic en **"Add"**

---

## Paso 4.4: Desplegar

1. Haz clic en **"Deploy"**

2. **Espera 2-4 minutos**

3. Cuando termine, verás tu URL, por ejemplo:
   ```
   https://lumier-calculadora.vercel.app
   ```

📝 **Copia esta URL**

---

## Paso 4.5: Añadir la URL de Vercel a Google Cloud (MUY IMPORTANTE)

Para que el login funcione, necesitamos decirle a Google cuál es la URL final de tu web.

1. Ve a Google Cloud Console (https://console.cloud.google.com)

2. Ve a **"APIs y servicios"** → **"Credenciales"**

3. Haz clic en **"Lumier Web"** (tu cliente OAuth)

4. En **"Orígenes de JavaScript autorizados"**, haz clic en **"+ AGREGAR URI"** y añade:
   ```
   https://lumier-calculadora.vercel.app
   ```
   (usa TU URL de Vercel)

5. En **"URIs de redireccionamiento autorizados"**, haz clic en **"+ AGREGAR URI"** y añade:
   ```
   https://lumier-calculadora.vercel.app/auth/callback
   ```
   (usa TU URL de Vercel + `/auth/callback`)

6. Haz clic en **"GUARDAR"**

---

## Paso 4.6: Configurar Supabase Site URL (MUY IMPORTANTE)

Para que el login funcione correctamente, necesitamos decirle a Supabase cual es la URL de tu web.

1. Ve a **Supabase** (https://supabase.com/dashboard)

2. Abre tu proyecto **lumier-calculadora**

3. En el menu de la izquierda, haz clic en **"Authentication"** (icono de persona)

4. Haz clic en **"URL Configuration"** (en el submenu)

5. En **"Site URL"**, cambia el valor por tu URL de Vercel:
   ```
   https://lumier-calculadora.vercel.app
   ```
   (usa TU URL de Vercel, sin barra al final)

6. En **"Redirect URLs"**, haz clic en **"Add URL"** y anade:
   ```
   https://lumier-calculadora.vercel.app/**
   ```
   (nota los `/**` al final - esto permite cualquier subruta)

7. Haz clic en **"Save"**

---

## Paso 4.7: Probar que todo funciona

1. Abre tu URL de Vercel en el navegador

2. Deberias ver la pantalla de login con el boton "Continuar con Google"

3. Haz clic en **"Continuar con Google"**

4. Selecciona tu cuenta `@lumier.es`

5. ✅ Deberias entrar al dashboard de proyectos

**Si intentas con un email que NO es @lumier.es:**
- Veras un mensaje: "Acceso denegado. Solo se permite el acceso con cuentas @lumier.es"

---

# PARTE 5: Despliegue Continuo desde GitHub

## ¿Que es el despliegue continuo?

Cuando conectas Vercel con GitHub, cada vez que hagas cambios en el codigo y los subas a GitHub, Vercel automaticamente actualizara tu web. No tienes que hacer nada mas - es automatico.

## Como funciona (ya esta configurado)

1. Tu haces cambios en el codigo
2. Subes los cambios a GitHub (push)
3. Vercel detecta los cambios automaticamente
4. Vercel construye y despliega la nueva version (2-3 minutos)
5. Tu web se actualiza sola

## Como subir cambios a GitHub

### Opcion A: Usando GitHub Desktop (Recomendado para principiantes)

1. **Descargar GitHub Desktop:**
   - Ve a: https://desktop.github.com
   - Descarga e instala el programa
   - Inicia sesion con tu cuenta de GitHub

2. **Clonar tu repositorio:**
   - En GitHub Desktop, haz clic en **"File"** → **"Clone repository"**
   - Busca **"lumier-calculadora"** y seleccionalo
   - Elige donde guardarlo en tu ordenador
   - Haz clic en **"Clone"**

3. **Hacer cambios:**
   - Abre la carpeta donde clonaste el proyecto
   - Haz los cambios que necesites en los archivos
   - Guarda los archivos

4. **Subir los cambios:**
   - Abre GitHub Desktop
   - Veras los archivos modificados en la lista de la izquierda
   - Abajo, en **"Summary"**, escribe un resumen del cambio (ej: "Corregido calculo de ITP")
   - Haz clic en **"Commit to main"**
   - Haz clic en **"Push origin"** (arriba)

5. **Verificar el despliegue:**
   - Ve a Vercel (https://vercel.com)
   - Abre tu proyecto
   - Veras el nuevo despliegue en progreso
   - Espera 2-3 minutos
   - Tu web ya esta actualizada

### Opcion B: Subir archivos directamente en GitHub.com

Si solo necesitas cambiar uno o dos archivos:

1. Ve a tu repositorio en GitHub (https://github.com/TU-USUARIO/lumier-calculadora)

2. Navega hasta el archivo que quieres cambiar

3. Haz clic en el icono del lapiz (Edit this file)

4. Haz los cambios

5. Baja y en **"Commit changes"**, escribe un resumen

6. Haz clic en **"Commit changes"**

7. Vercel detectara el cambio y desplegara automaticamente

### Opcion C: Reemplazar todos los archivos

Si tienes una carpeta nueva con todos los archivos actualizados:

1. Ve a tu repositorio en GitHub

2. Elimina todos los archivos:
   - Haz clic en cada archivo → icono de papelera → Commit
   - O usa la opcion "Delete this file" en cada uno

3. Sube los nuevos archivos:
   - Haz clic en **"Add file"** → **"Upload files"**
   - Arrastra toda la carpeta nueva
   - Haz clic en **"Commit changes"**

---

## Como ver el estado del despliegue

1. Ve a **https://vercel.com**

2. Haz clic en tu proyecto **lumier-calculadora**

3. Veras una lista de **"Deployments"** (despliegues):

   ```
   ┌─────────────────────────────────────────────────────┐
   │  Deployments                                        │
   │                                                     │
   │  ✅ Production (hace 5 min) - Corregido calculo     │
   │  ✅ Production (hace 2 dias) - Subida inicial       │
   └─────────────────────────────────────────────────────┘
   ```

   - ✅ Verde = Despliegue exitoso
   - 🟡 Amarillo = En progreso
   - ❌ Rojo = Error (haz clic para ver el error)

---

## Forzar un redespliegue manual

Si por alguna razon necesitas redesplegar sin hacer cambios:

1. Ve a Vercel → Tu proyecto

2. Haz clic en los **"..."** (tres puntos) junto al ultimo despliegue

3. Haz clic en **"Redeploy"**

4. Confirma haciendo clic en **"Redeploy"**

---

# PARTE 6: Como Usar la Plataforma

## Para iniciar sesión

1. Ve a tu URL (ej: `lumier-calculadora.vercel.app`)
2. Haz clic en **"Continuar con Google"**
3. Selecciona tu cuenta `@lumier.es`
4. ¡Ya estás dentro!

## Para crear un proyecto

1. Haz clic en **"Nuevo Proyecto"**
2. Escribe el nombre (ej: "Reforma Calle Mayor 15")
3. Haz clic en **"Crear Proyecto"**

## Para compartir un proyecto

1. Abre el proyecto
2. Haz clic en **"Compartir"**
3. Se copia la URL al portapapeles
4. Envía la URL a tu compañero por email/WhatsApp
5. Tu compañero deberá iniciar sesión con su cuenta `@lumier.es` para verlo

## Para guardar versiones

1. Rellena los datos de la calculadora
2. Haz clic en **"Guardar Versión"**
3. Dale un nombre (ej: "Presupuesto Inicial")
4. Puedes cambiar entre versiones desde el selector

## Para cerrar sesión

1. Haz clic en tu nombre/foto (arriba a la derecha)
2. Haz clic en **"Cerrar Sesión"**

---

# Solución de Problemas

## "Error al iniciar sesión" o "redirect_uri_mismatch"

**Causa:** Las URLs en Google Cloud no están bien configuradas

**Solución:**
1. Ve a Google Cloud → Credenciales → Tu cliente OAuth
2. Verifica que estas URLs están EXACTAS:
   - Orígenes autorizados: `https://TU-URL.vercel.app`
   - URIs de redirección:
     - `https://TU-URL.vercel.app/auth/callback`
     - `https://TU-PROYECTO.supabase.co/auth/v1/callback`

## "Acceso denegado" al intentar entrar

**Causa:** Estás usando un email que no es `@lumier.es`

**Solución:** Usa tu cuenta de correo corporativo `@lumier.es`

## "Error al cargar proyectos"

**Causa:** Variables de entorno mal configuradas

**Solución:**
1. Ve a Vercel → Tu proyecto → Settings → Environment Variables
2. Verifica que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` son correctas
3. Haz "Redeploy" si las cambias

---

# Resumen de Credenciales a Guardar

Guarda estos datos en un lugar seguro:

| Dato | Valor | De dónde sale |
|------|-------|---------------|
| Google Client ID | `123...apps.googleusercontent.com` | Google Cloud |
| Google Client Secret | `GOCSPX-...` | Google Cloud |
| Supabase URL | `https://abc.supabase.co` | Supabase |
| Supabase Anon Key | `eyJhbG...` | Supabase |
| URL de la web | `https://lumier-calc.vercel.app` | Vercel |

---

# Cambiar el dominio permitido

Si en el futuro quieres cambiar `@lumier.es` por otro dominio:

1. Abre el archivo `lib/auth.ts`
2. Cambia esta línea:
   ```typescript
   export const ALLOWED_DOMAIN = 'lumier.es'
   ```
   Por el nuevo dominio, por ejemplo:
   ```typescript
   export const ALLOWED_DOMAIN = 'otrodominio.com'
   ```
3. Sube los cambios a GitHub (Vercel se actualizará automáticamente)

---

**¡Felicidades!** 🎉

Tu plataforma está lista con acceso restringido solo para empleados de Lumier.

---

*Lumier Casas Boutique - Calculadora de Renovaciones v2.0*
