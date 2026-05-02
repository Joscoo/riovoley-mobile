# Base de Datos - Estado Actual (Produccion)

Estado: documentacion tecnica para desarrollo y operaciones.

Fecha de corte: 2026-04-16
Fuente de verdad: consultas ejecutadas en produccion (evidencia de esta conversacion).

## 1) Resumen Ejecutivo

- La migracion por esquemas esta activa: core, billing, training, profiles, public_content, audit, security.
- La aplicacion consume principalmente vistas de compatibilidad en public.*.
- Existen politicas RLS extensas, pero varias tablas criticas estan con RLS desactivado.
- Hay grants amplios en vistas public.* para anon/authenticated (incluyendo permisos de escritura), lo cual es un riesgo alto si no se corrige.
- RBAC no esta totalmente unificado: conviven reglas basadas en user_role/admin y role/administrador.

## 2) Esquemas Activos

- audit
- billing
- core
- profiles
- public
- public_content
- security
- training

## 3) Estado Efectivo de Tablas y RLS

Tabla por tabla (estado real):

| Esquema | Tabla | RLS habilitado |
|---|---|---|
| audit | payments_audit | NO |
| audit | sql_errors | NO |
| audit | sql_executions | NO |
| billing | payment_types | SI |
| billing | payments | NO |
| core | students | NO |
| core | users | NO |
| profiles | user_profiles | SI |
| public_content | announcements | NO |
| security | users_password_backup | NO |
| training | attendances | SI |
| training | physical_tests | NO |
| training | schedules | NO |

Nota operativa clave:

- Si una tabla tiene politicas pero RLS esta en NO, esas politicas no protegen accesos sobre esa tabla.

## 4) Estructura Principal Verificada

### 4.1 core.users

Campos relevantes verificados:

- id (uuid, PK)
- email (text, unique)
- role (text, check)
- nombre, apellido
- fecha_nacimiento, telefono
- created_at, last_login, first_login
- suspended, suspension_reason, suspension_until, suspended_at
- email_ciphertext, email_search_exact, email_search_partial, email_masked
- telefono_ciphertext, telefono_search_exact, telefono_search_partial, telefono_masked

### 4.2 core.students

Campos relevantes verificados:

- id (uuid, PK)
- user_id (FK a core.users.id)
- categoria
- fecha_ingreso
- fecha_nacimiento (NOT NULL)
- edad

### 4.3 billing.payments

Campos relevantes verificados:

- id (uuid, PK)
- student_id (FK a core.students.id)
- payment_type_id (FK a billing.payment_types.id)
- monto
- fecha_pago, fecha_inicio, fecha_fin
- estado
- deleted_at

### 4.4 training.physical_tests

Campos relevantes verificados:

- id (uuid, PK)
- student_id (FK a core.students.id)
- metrica corporal y de fuerza
- fecha_test
- observaciones
- created_at, updated_at, modified_at

Validaciones recientes aplicadas:

- Edad mínima: se valida que el alumno tenga al menos 5 años en la fecha del test. Esta regla se implementa en la función/trigger `training.enforce_physical_test_age()` (migración: database/validate_physical_tests_constraints_2026_04_28.sql).
- Rangos de medidas: límites superiores ampliados para cubrir registros por encima de atletas profesionales y permitir rangos adecuados para niños desde 5 años. Constraints principales actualizadas:
	- `fuerza_abdomen`: 0..400
	- `fuerza_brazos`: 0..400
	- `fuerza_piernas`: 0..600
	- `elevaciones_barra`: 0..300

### 4.5 profiles.user_profiles

Campos relevantes verificados:

- id (uuid, PK, FK a auth.users.id)
- full_name
- role (user_role_enum, default usuario)
- organization_id
- created_at

### 4.6 public_content.announcements

Campos relevantes verificados:

- id (uuid, PK)
- title, content, priority
- target_audience, is_active
- created_by (FK a auth.users.id)
- created_at, updated_at, expires_at
- image_url, attachment_url

### 4.7 security.users_password_backup

Campos relevantes verificados:

- id, email, password, created_at

Estado de acceso confirmado:

- Grantee postgres y service_role tienen permisos.
- Debe mantenerse sin acceso para anon/authenticated.

## 5) Relaciones FK Confirmadas

- billing.payments.payment_type_id -> billing.payment_types.id
- billing.payments.student_id -> core.students.id
- core.students.user_id -> core.users.id
- training.attendances.metodo_pago_id -> billing.payment_types.id
- training.attendances.schedule_id -> training.schedules.id
- training.attendances.student_id -> core.students.id
- training.physical_tests.student_id -> core.students.id

## 6) Vistas de Compatibilidad public.* (Consumo de App)

Vistas confirmadas:

- public.users -> core.users
- public.students -> core.students
- public.user_profiles -> profiles.user_profiles
- public.payment_types -> billing.payment_types
- public.payments -> billing.payments
- public.schedules -> training.schedules
- public.attendances -> training.attendances
- public.physical_tests -> training.physical_tests
- public.announcements -> public_content.announcements
- public.announcements_with_creator -> public_content.announcements LEFT JOIN profiles.user_profiles
- public.payments_audit -> audit.payments_audit
- public.users_password_backup -> security.users_password_backup

Observacion importante:

- public.users incluye cedula como NULL::text para compatibilidad.

## 7) Politicas, RLS y Grants (Estado Real)

### 7.1 Politicas detectadas

Hay politicas activas para tablas como:

- billing.payment_types
- billing.payments
- core.students
- profiles.user_profiles
- public_content.announcements
- training.attendances
- training.physical_tests
- training.schedules

### 7.2 Efectividad real

- billing.payment_types: RLS SI -> politicas aplican.
- profiles.user_profiles: RLS SI -> politicas aplican.
- training.attendances: RLS SI -> politicas aplican.
- billing.payments, core.students, training.physical_tests, public_content.announcements, training.schedules: RLS NO -> politicas no aplican actualmente.

### 7.3 Grants detectados en public.*

Se observaron grants amplios para anon y authenticated en vistas de negocio (incluyendo permisos de escritura y operacion como INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER/REFERENCES).

Esto incrementa riesgo cuando la tabla base no tiene RLS efectivo.

## 8) Funciones y Triggers Vigentes

### 8.1 Funciones public relevantes

- public.handle_new_user()
- public.is_admin()
- public.is_admin_or_trainer()
- public.sync_first_login_on_password_change()
- public.sync_last_login_from_auth()
- public.sync_user_profile_on_user_update()
- public.audit_payments()

Notas relevantes:

- is_admin e is_admin_or_trainer consultan public.users y aceptan valores administrador/admin.
- sync_last_login_from_auth y sync_first_login_on_password_change actualizan core.users.
- Se detecto bug historico: sync_user_profile_on_user_update mapeaba estudiante -> usuario en profiles.user_profiles.
- Fix implementado en Fase P6: database/fix_student_role_sync_phase7_2026_04_16.sql (ejecutado en produccion, 2026-04-16).

### 8.2 Triggers activos confirmados

- auth.users: on_auth_user_created
- auth.users: trigger_sync_first_login_on_password_change
- auth.users: trigger_sync_last_login_from_auth
- billing.payments: payments_audit_trigger
- core.users: trigger_sync_user_profile
- public_content.announcements: trigger_update_announcements_updated_at
- training.physical_tests: update_physical_test_modtime

## 9) Estado de Roles en Datos

### 9.1 core.users.role

- administrador: 2
- entrenador: 4
- estudiante: 86

### 9.2 profiles.user_profiles.role

- administrador: 2
- entrenador: 4
- usuario: 47
- estudiante: 44

Observacion:

- Existe coexistencia de estudiante y usuario en perfiles, consistente con el mapeo parcial en flujos de sincronizacion.

## 10) Riesgos Abiertos Priorizados

### P0

- Mitigado 2026-04-16: RLS activado en tablas criticas y grants public.* reducidos.
- Mantener monitoreo post-cambio por posibles regresiones funcionales por rol.

### P1

- RBAC mixto residual: aun existen rutas con role/administrador y otras con helper is_admin().
- Duplicidad semantica de politicas reducida en tablas criticas (consolidacion parcial ejecutada).

### P2

- Deuda documental de scripts legacy/hotfix en carpeta database que pueden inducir ejecuciones incorrectas.

## 11) Proximos Pasos Tecnicos

1. Reducir grants en public.* a minimo necesario por rol.
	Script preparado: database/hardening_public_view_grants_phase1_2026_04_16.sql
	Estado: ejecutado en produccion (2026-04-16).
2. Activar RLS por fases en tablas criticas hoy en NO.
	Script preparado: database/enable_rls_phase2_2026_04_16.sql
	Estado: ejecutado en produccion (2026-04-16).
3. Normalizar contrato RBAC (claim y valores canonicos).
   Script preparado: database/normalize_rbac_phase3_2026_04_16.sql
	Estado: ejecutado en produccion (2026-04-16).
4. Consolidar politicas para eliminar redundancias.
	Script preparado: database/consolidate_policies_phase4_2026_04_16.sql
	Estado: ejecutado en produccion (2026-04-16).
5. Revalidar app por rol (admin, entrenador, estudiante) tras cada fase.
	Script tecnico de verificacion preparado: database/verify_security_matrix_phase5_2026_04_16.sql
	Estado: ejecutado en produccion (2026-04-16).
6. Implementar lockout de login (5 intentos fallidos / 60s de bloqueo).
	Script preparado: database/login_lockout_phase6_2026_04_16.sql
	Estado: ejecutado en produccion (2026-04-16).
7. Corregir asignacion de rol de atletas (estudiante) en perfiles y backfill historico.
	Script preparado: database/fix_student_role_sync_phase7_2026_04_16.sql
	Estado: ejecutado en produccion (2026-04-16).
8. Limpiar usuarios huerfanos en auth.users por lista de emails bloqueados.
	Script preparado: database/cleanup_orphan_auth_users_phase8_2026_04_16.sql
	Estado: ejecutado en produccion (2026-04-16).

## 12) Scripts Legacy y Uso Seguro

Regla operativa:

- No ejecutar scripts fix_* antiguos sin verificar primero estado real en produccion.
- Priorizar scripts idempotentes y canonicos de migracion/compatibilidad.
- Mantener esta documentacion como baseline de ejecucion hasta cerrar saneamiento de seguridad.

## 13) Bitacora de Cambios de BD

### 2026-04-16

- Se creo script de contencion P0 de grants en vistas public.*:
	database/hardening_public_view_grants_phase1_2026_04_16.sql
- Alcance del script:
	- Revocar permisos amplios en vistas de compatibilidad para anon/authenticated.
	- Mantener lectura publica minima (announcements, announcements_with_creator, schedules).
	- Mantener users_password_backup restringida y con acceso de service_role.
- Estado: ejecutado en produccion.
- Verificacion post-ejecucion:
	- anon: solo SELECT en announcements, announcements_with_creator y schedules.
	- authenticated: mantiene SELECT/INSERT/UPDATE/DELETE en vistas operativas de panel.
	- users_password_backup: sin permisos para anon/authenticated; acceso en postgres/service_role.

- Se creo script de Fase P1 para activar RLS en tablas criticas:
	database/enable_rls_phase2_2026_04_16.sql
- Alcance del script:
	- Activa RLS en public_content.announcements, billing.payments, core.students,
		training.physical_tests y training.schedules.
	- Ejecucion recomendada por bloques con validacion funcional entre cada bloque.
- Estado: ejecutado en produccion.
- Verificacion post-ejecucion:
	- billing.payments: rls_enabled = true
	- core.students: rls_enabled = true
	- public_content.announcements: rls_enabled = true
	- training.physical_tests: rls_enabled = true
	- training.schedules: rls_enabled = true

- Se creo script de Fase P2 para normalizar RBAC:
	database/normalize_rbac_phase3_2026_04_16.sql
- Alcance del script:
	- Endurece helpers public.is_admin() y public.is_admin_or_trainer() con search_path seguro y fuente canonica core.users.
	- Reemplaza policies legacy que dependian de auth.jwt()->>'user_role' = 'admin'
	  en billing.payment_types, core.students y training.schedules.
- Estado: ejecutado en produccion.
- Verificacion post-ejecucion:
	- public.is_admin() y public.is_admin_or_trainer() actualizadas con search_path seguro y consulta a core.users.
	- Policies normalizadas en:
	  - billing.payment_types (Admins manage payment types)
	  - core.students (Admins can manage all student records)
	  - training.schedules (Admins manage schedules)

- Se creo script de Fase P3 para consolidar policies redundantes:
	database/consolidate_policies_phase4_2026_04_16.sql
- Alcance del script:
	- Elimina policies duplicadas/solapadas en core.students, billing.payments,
	  training.attendances y training.physical_tests.
	- Conserva comportamiento de autorizacion al mantener policies FOR ALL y ownership principales.
- Estado: ejecutado en produccion.
- Verificacion post-ejecucion:
	- billing.payments: se mantienen policies ALL de admin/trainer y ownership CRUD.
	- core.students: se mantiene policy admin ALL, trainer ALL y ownership Users can ...
	  sin duplicados Students can ...
	- training.attendances: se mantienen policies ALL de admin/trainer y ownership CRUD,
	  sin policies view redundantes.
	- training.physical_tests: se mantienen policies ALL de admin/trainer y ownership CRUD,
	  sin policies view redundantes.

- Se creo script de Fase P4 para verificacion de matriz de seguridad:
	database/verify_security_matrix_phase5_2026_04_16.sql
- Alcance del script:
	- Verifica RLS, policies, grants, helpers RBAC y triggers criticos.
	- Incluye chequeo de readiness para objetos de lockout de login en esquema security.
- Estado: ejecutado en produccion.
- Verificacion post-ejecucion:
	- RLS habilitado en tablas funcionales criticas (billing/core/profiles/public_content/training).
	- Policies activas consistentes con ownership + admin/trainer.
	- Grants de vistas public.* conforme al hardening aplicado en Fase P0.
	- Helpers RBAC vigentes con search_path seguro y base canonica core.users.
	- Triggers criticos de auth/sync/auditoria activos.
	- Readiness lockout (actualizado): verificado y listo para uso.

- Se creo script de Fase P5 para lockout de login:
	database/login_lockout_phase6_2026_04_16.sql
- Alcance del script:
	- Crea tablas de auditoria y bloqueo en esquema security.
	- Crea RPCs public.check_login_allowed y public.record_login_attempt.
	- Aplica grants/revokes para impedir acceso directo a tablas y permitir RPC desde frontend.
- Estado: ejecutado en produccion.
- Verificacion post-ejecucion:
	- Objetos creados:
	  - security.login_attempts
	  - security.login_blocks
	  - public.check_login_allowed(text)
	  - public.record_login_attempt(text, boolean, text)
	- Prueba inicial RPC:
	  - check_login_allowed('test@example.com') => allowed=true, retry_after_seconds=0,
	    remaining_attempts=5, block_reason=null.

- Se creo script de Fase P6 para correccion de rol de atletas:
	database/fix_student_role_sync_phase7_2026_04_16.sql
- Alcance del script:
	- Corrige public.handle_new_user() para tomar role desde raw_user_meta_data
	  (con fallback seguro a usuario) y hacer upsert de profiles.user_profiles.
	- Corrige public.sync_user_profile_on_user_update() para NO convertir estudiante a usuario.
	- Re-crea trigger trigger_sync_user_profile y aplica backfill historico:
	  atletas en profiles.user_profiles con role=usuario pasan a role=estudiante
	  cuando existe relacion en core.students y core.users.role=estudiante.
- Estado: ejecutado en produccion (2026-04-16).
- Verificacion post-ejecucion:
	- Definicion de funciones aplicada correctamente para:
	  - public.handle_new_user
	  - public.sync_user_profile_on_user_update
	- Conteo por rol en perfiles de atletas (join core.students):
	  - estudiante: 86
	  - usuario: 0

- Se creo script de Fase P7 para limpieza de usuarios huerfanos en auth:
	database/cleanup_orphan_auth_users_phase8_2026_04_16.sql
- Alcance del script:
	- Permite cargar lista puntual de emails bloqueados (target_emails).
	- Previsualiza candidatos y elimina solo cuentas ORPHAN:
	  existentes en auth.users pero ausentes en core.users.
	- Incluye verificacion post-delete y consulta opcional de huerfanos globales.
- Estado: ejecutado en produccion (2026-04-16).
- Verificacion post-ejecucion:
	- Resultado final del SELECT de verificacion: No rows returned.
	- Conclusion: no quedaron correos objetivo presentes en auth.users.

### 2026-04-27

- Se detecto error funcional al crear horarios:
	- Error: Could not find the 'descripcion' column of 'schedules' in the schema cache.
	- Causa: scripts legacy apuntaban a public.schedules (vista) en vez de training.schedules (tabla real).

- Se creo fix canonico para schedules.descripcion:
	database/fix_schedules_descripcion_after_schema_migration_2026_04_27.sql
- Alcance del script:
	- Agrega columna descripcion en training.schedules.
	- Backfill de descripcion por categoria.
	- Re-crea public.schedules para exponer columna nueva en la vista.
	- Reaplica grants de public.schedules y fuerza reload de cache PostgREST.
- Estado: ejecutado y validado.
- Verificacion post-ejecucion:
	- training_schedules_has_descripcion = true
	- public_schedules_has_descripcion = true

- Se detecto dependencia de app sobre announcements_with_creator no consolidada en script base.
- Se actualizo script principal de vistas de compatibilidad:
	database/create_public_compatibility_views.sql
- Se creo fix puntual para entornos ya desplegados:
	database/fix_announcements_with_creator_view_after_schema_migration_2026_04_27.sql
- Estado: ejecutado y validado.
- Verificacion post-ejecucion:
	- announcements_with_creator_has_creator_name = true
	- Vista public.announcements_with_creator presente.

- Se creo auditoria SQL de consistencia post-migracion:
	database/audit_schema_migration_usage_phase1_2026_04_27.sql
- Alcance del script:
	- Verifica presencia de vistas public.* esperadas.
	- Verifica columna critica schedules.descripcion en training y public.
	- Verifica metadata de creator en announcements_with_creator.
	- Resume grants de anon/authenticated sobre vistas public.*.
- Estado: ejecutado y validado (PASS).

- Se documento auditoria de scripts legacy (fase 2):
	SCHEMA_MIGRATION_AUDIT_PHASE2_2026_04_27.md
- Hallazgo principal:
	- Multiples scripts legacy aun apuntan a public.* para ALTER TABLE/RLS.
	- Regla vigente: operaciones estructurales y RLS deben apuntar a tablas fisicas
	  en core/billing/training/profiles/public_content.

- Se crearon adaptaciones schema-aware (fase 3):
	- database/add_physical_test_strength_fields_schema_2026_04_27.sql
	- database/remove_altura_peso_from_students_schema_2026_04_27.sql
	- database/update_open_gym_category_schema_2026_04_27.sql
	- database/enable_rls_all_tables_schema_2026_04_27.sql
	- database/PHASE3_SCHEMA_MIGRATION_EXECUTION_ORDER_2026_04_27.md
- Estado:
	- Scripts ejecutados en entorno y verificados con resultados compartidos.

- Se ejecuto hardening de policies (fase 4B -> 4C):
	- Auditoria segura: database/hardening_policies_phase4b_2026_04_27.sql
	- Runbook: database/POLICY_HARDENING_PHASE4B_RUNBOOK_2026_04_27.md
	- Hardening aplicado: database/hardening_policies_phase4c_2026_04_27.sql
- Resultado 4B:
	- 1 redundancia confirmada en profiles.user_profiles.
	- 4 policies en public_content.announcements usando rol public.
- Resultado 4C:
	- Redundancia eliminada (Admins can view all profiles).
	- announcements INSERT/UPDATE/DELETE restringido a authenticated.
	- announcements SELECT se mantiene en public para anuncios activos.
	- Estado: ejecutado y validado (PASS).

- Se genero baseline unico final para nuevos entornos y recuperacion de drift:
	- database/baseline_schema_canonical_2026_04_27.sql
	- database/BASELINE_SCHEMA_CANONICAL_RUNBOOK_2026_04_27.md
- Alcance del baseline:
	- Consolida estado validado de Fase 1 a Fase 4C
	  (esquemas, vistas public.*, ajustes de modelo, RLS, hardening de policies).

- Evidencia de cierre y trazabilidad final:
	SCHEMA_MIGRATION_VALIDATION_RESULTS_2026_04_27.md
