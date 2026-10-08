# Activar cuentas de Axzify en Supabase Free

## Estado
Proyecto real: `atjijfqmzbyckhzkschp`, organización Axzify, región Irlanda. Migración aplicada desde SQL Editor; prueba transaccional de dos identidades: perfil propio visible, ajeno invisible y trigger correcto (true/true/true), con rollback de los datos temporales. URL y clave publishable conectadas en `docs/auth-config.js`. Site URL `https://axzify.com` y callback exacto `https://axzify.com/cuenta.html` guardados. Confirmación de email activada; política guardada de 12 caracteres y cambio seguro de contraseña.

SMTP de OVH guardado por el propietario y verificado en el panel (contraseña almacenada, no leída). Correo de prueba autorizado a `xaviervalblasi@axzify.com` mediante Auth OTP aceptado con HTTP 200 y recepción confirmada mediante captura del propietario; crea la cuenta si no existe, sin asignar contraseña. Confirmación y recuperación tienen plantillas ES/EN en `templates/`. Turnstile creado para `axzify.com` en modo Managed y habilitado en Supabase con la clave privada; solo la site key pública está en el repositorio. Login sin token CAPTCHA rechazado por el servidor con HTTP 400 / `captcha_failed`. Falta probar el ciclo completo de cuentas con el propietario tras publicar. Las pruebas de navegador con APIs simuladas no sustituyen esas comprobaciones.

SMTP configurado: remitente/usuario `xaviervalblasi@axzify.com`, nombre Axzify, `smtp.mail.ovh.net`, puerto 465, intervalo 60 s. DNS MX identifica OVH; parámetros cotejados con documentación oficial MX Plan. La contraseña no se ha leído ni almacenado en el repositorio.

## Configuración del propietario
1. Entrar en https://supabase.com/dashboard y elegir una organización **Free**. Crear proyecto `axzify` en una región de la UE. Guardar la contraseña de la base de datos en un gestor de contraseñas, nunca en GitHub. No activar suscripciones ni complementos de pago.
2. En SQL Editor ejecutar `migrations/202610080001_profiles.sql` una sola vez (migración transaccional). Auth ya mantiene usuarios, emails, hash bcrypt y último acceso en su esquema privado. `profiles` contiene únicamente ID, nombre y fecha de creación.
3. Authentication → Providers → Email: habilitar email/password y **Confirm email**, mínimo **12 caracteres**. Mantener las protecciones de seguridad del proveedor y límites de intentos/correos. El cliente limita contraseñas nuevas a 72 bytes UTF-8; comprobar también el comportamiento efectivo del servidor antes de publicar.
4. Authentication → URL Configuration: Site URL `https://axzify.com`; Redirect URL exacta `https://axzify.com/cuenta.html`. Si se sirve también www, añadir exactamente `https://www.axzify.com/cuenta.html` o redirigirlo al dominio principal. Evitar comodines. Para pruebas locales, permitir temporalmente solo la URL local concreta utilizada.
5. Mantener las plantillas oficiales con `{{ .ConfirmationURL }}` para confirmación y recuperación. El SDK procesa los enlaces implícitos, verifica el usuario con el servidor y limpia la URL. Recuperación puede abrirse en otro navegador. El estado de recuperación se conserva al recargar la pestaña.
6. Configurar **Custom SMTP** para correos reales. El remitente de pruebas integrado solo admite destinatarios autorizados y no sirve para registro público. Esta instalación usa el buzón OVH existente; sus secretos se guardan únicamente en Supabase. No se ha contratado ningún servicio de pago adicional.
7. Configurar un widget **Cloudflare Turnstile** gratuito con hostname `axzify.com` y los demás dominios exactos autorizados. En Supabase → Authentication → Bot and Abuse Protection activar Turnstile con su **secret key**. La interfaz ya integra el widget, pasa tokens a registro/login/recuperación y los renueva tras cada solicitud. Los límites de Auth siguen siendo necesarios. Revisar aviso de privacidad con identidad/contacto del responsable, conservación y derechos; el texto informativo del formulario no sustituye ese aviso.
8. Copiar Project URL, clave **publishable** (`sb_publishable_...`) y **site key pública de Turnstile** a `docs/auth-config.js`. Son públicas por diseño; no usar `sb_secret_`, `service_role`, contraseña de la base de datos ni secretos SMTP/Turnstile. El validador rechaza tipos de clave no admitidos. Fuera de localhost, los formularios no se activan sin site key; la validación real del CAPTCHA se aplica en Supabase.
9. Comprobar TLS y redirección al dominio canónico, completar pruebas reales de abajo y publicar la carpeta `docs` por el flujo habitual de GitHub Pages.

## Prueba real obligatoria antes de apertura
- Registrar dos cuentas de prueba A/B con correos propios; confirmar ambas y comprobar creación de perfiles.
- Verificar rechazo de login antes de confirmar correo y de contraseñas incorrectas/cortas. No dar por válida solo la validación HTML.
- Iniciar sesión A: leer su perfil; usar la API con su JWT para solicitar ID de B → ninguna fila; acceso anónimo → denegado. Intentar INSERT/UPDATE/DELETE de perfiles con A → denegado.
- Abrir enlace de recuperación válido en otra pestaña, recargar, cambiar contraseña, comprobar rechazo de la contraseña antigua e inicio con la nueva. Probar enlace caducado/usado.
- Cerrar sesión: borrar sesión de la pestaña y revocar refresh tokens globalmente. Los JWT ya emitidos pueden seguir siendo válidos hasta su expiración; configurar duración de acceso adecuada (por ejemplo 15 minutos) y comprobarla. La UI no puede invalidar instantáneamente un JWT ya emitido.
- Probar caída de red, SMTP, límites de intentos y perfil inaccesible. Comprobar que no aparecen claves privilegiadas ni contraseñas en logs, URLs, almacenamiento del sitio o Git.

## Decisiones y límites
- Las sesiones usan sessionStorage, no cookies HttpOnly: esta arquitectura estática exige especial cuidado frente a XSS. La página de cuenta carga scripts locales fijados y el widget oficial de Turnstile desde challenges.cloudflare.com, con CSP sin scripts inline y no-referrer, y renderiza perfiles con textContent. No añadir analítica/scripts de terceros sin revisión. Una pestaña duplicada o restaurada puede conservar almacenamiento según el navegador: cerrar sesión explícitamente en equipos compartidos.
- RLS se aplica en el servidor. Ocultar una sección en JavaScript no protege una base de datos. El SDK usa la sesión para acceder y la política limita SELECT al propietario. Los perfiles son de solo lectura en esta primera versión.
- El enlace «Mi cuenta» lleva a `cuenta.html`. Descargas y contenido de la landing permanecen públicos. No hay pagos ni roles de administrador implementados.
- Usuarios se administran en Authentication → Users; perfiles en Table Editor. No crear un panel administrativo público con claves privilegiadas.
- Supabase Free puede pausar proyectos por inactividad, tiene cuotas y no incluye copias automáticas. Revisar sus límites vigentes y preparar copias/retención antes de uso comercial sostenido. No se ha prometido disponibilidad continua ni contratado un plan.

## Verificación local
`node --test tests/web-auth.test.mjs tests/web-language.test.cjs tests/web-theme.test.cjs tests/web-preview.test.cjs`

Con Playwright disponible en NODE_PATH y Edge instalado:
`node scripts/verify-auth.cjs`
`node scripts/verify-website.cjs`

La prueba de cuentas sirve archivos locales, usa el SDK oficial y simula respuestas de Auth/PostgREST. No crea cuentas ni envía emails. Las capturas se guardan en `outputs/auth-review`.
