# Cuentas de Axzify

Solicitud aprobada: registro y login con Supabase Free, conservando la web estática de GitHub Pages y el dominio axzify.com. Sin contratar servicios de pago.

## Alcance
Página cuenta.html con registro (nombre, correo, contraseña), login, confirmación por correo, recuperación, cambio de contraseña después de recuperación, consulta del perfil y cierre de sesión. Español e inglés, móvil y temas existentes. Las descargas actuales siguen públicas; un login no convierte un ZIP público en contenido protegido.

## Arquitectura y seguridad
Cliente oficial Supabase JS fijado y servido desde el propio sitio. Supabase Auth guarda los hashes y gestiona sesiones; no se implementa criptografía propia. Se usa almacenamiento de sesión por pestaña para evitar persistencia indefinida en equipos compartidos. Callback implícito oficial del SDK, con limpieza de fragmentos sensibles, sin analítica en la página de cuenta. El único script externo permitido es el widget oficial de Cloudflare Turnstile. CSP restrictiva y no-referrer. Solo URL HTTPS de proyecto, clave publishable y site key pública de Turnstile en la configuración pública; nunca claves secret/service_role ni el secreto de Turnstile.

Tabla profiles referenciada a auth.users, creada por trigger y con RLS y permisos de solo lectura del perfil propio. No se replican hashes ni tokens en tablas públicas. Nombre, email y fechas de autenticación; no se suben los Excel de RR. HH. Contraseña de al menos 12 caracteres, límite bcrypt de 72 bytes validado también en cliente; la política de Supabase es obligatoria. Confirmación de email activada. Mensajes neutros de registro y recuperación, errores controlados, límites de peticiones del proveedor y CAPTCHA para apertura pública.

## Activación externa
Requiere sesión del propietario en Supabase, organización Free, proyecto en UE, migración SQL, URLs autorizadas exactas y SMTP operativo. El correo de pruebas de Supabase no sirve para altas públicas. No se afirma despliegue hasta verificar configuración y ciclo real. Sin configuración, la página deshabilita formularios y explica que el acceso todavía no está disponible.

## Verificación
Pruebas de validación, llamadas al SDK, rechazo de secretos, aislamiento del perfil, recuperación y fallos. Revisión de interfaz con navegador y regresión de la landing. Prueba real con dos cuentas cuando exista proyecto y correo para verificar RLS, confirmación, login, recuperación y logout.
