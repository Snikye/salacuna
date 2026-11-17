# Guía de Instalación y Despliegue de Base de Datos — Sala Cuna PDI

Este documento contiene las instrucciones paso a paso para crear, desplegar y poblar la base de datos relacional del **Sistema de Gestión del Bono Compensatorio de Sala Cuna de la Jefatura de Bienestar de la Policía de Investigaciones de Chile (PDI)** en cualquier servidor con Microsoft SQL Server.

---

## 1. Requisitos del Servidor de Base de Datos

- **Motor de Base de Datos:** Microsoft SQL Server 2017 o superior (Standard, Developer, Enterprise o Express Edition), o Azure SQL Database.
- **Herramientas recomendadas:**
  - SQL Server Management Studio (SSMS) v18+ o v19+
  - Azure Data Studio
  - CLI `sqlcmd` (para despliegues automatizados)
- **Cotejamiento recomendado:** `Modern_Spanish_CI_AS` o `SQL_Latin1_General_CP1_CI_AS`.

---

## 2. Archivo del Script de Base de Datos

El script SQL completo y autocontenido se encuentra en:
```
/database/SalaCunaPDI.sql
```

El script incluye:
1. Creación automática de la base de datos `SalaCunaPDI` (si no existe).
2. Limpieza idempotente de tablas y procedimientos previos.
3. Creación de las 10 tablas del Modelo Entidad-Relación (MER):
   - `UsuariosSistema`: Control de acceso por RUT, rol y región policial.
   - `PresupuestoRegional`: Distribución presupuestaria anual (60% RM / 40% Regiones) y arrastre interanual.
   - `Funcionarios`: Ficha institucional de la beneficiaria y datos del menor causante (incluyendo fecha de nacimiento).
   - `Solicitudes`: Expediente de postulación, estado y revisión de 4 documentos oficiales.
   - `DocumentosIniciales`: Registro de los 4 archivos PDFs requeridos (O.G. N° 2551).
   - `Resoluciones`: Acto administrativo de aprobación y activación en Lista de Pago.
   - `ControlMensual30`: Declaraciones mensuales del Día 30, cálculo de días efectivos sobre base 30 y descuentos.
   - `EtapasFlujo`: Trazabilidad y auditoría de transiciones del circuito (Coordinador -> Visador -> Logística -> Finanzas/DECOFI -> Tesorería).
   - `HistorialAlertas`: Registro de notificaciones del sistema.
   - `AuditoriaSistema`: Registro de transacciones críticas y cambios de estado.
4. Procedimientos Almacenados Transaccionales:
   - `dbo.sp_InicializarPresupuestoAnualRegional`: Inicializa o redistribuye la bolsa presupuestaria anual.
   - `dbo.sp_EmitirResolucionYActivarPago`: Emite la resolución e ingresa a la funcionaria a la Lista de Pago.
   - `dbo.sp_RegistrarControlMensual30`: Procesa la declaración mensual y cálculo proporcional.
   - `dbo.sp_AvanzarEtapaCircuito`: Ejecuta las etapas secuenciales del circuito institucional.
5. Datos semilla completos:
   - Usuarios preconfigurados por rol y región (RM, V y VIII).
   - Funcionarias de prueba con menores y fechas de nacimiento para probar el corte de 2 años.
   - Presupuesto regional 2026 y 2027 inicializado en \$60.000.000 anuales.

---

## 3. Instrucciones de Ejecución

### Opción A: Desde SQL Server Management Studio (SSMS) o Azure Data Studio
1. Abra SSMS o Azure Data Studio y conéctese a su instancia de SQL Server.
2. Vaya a **Archivo > Abrir > Archivo...** y seleccione `database/SalaCunaPDI.sql`.
3. Presione **F5** o haga clic en **Ejecutar**.
4. Verifique que aparezca el mensaje *"Command(s) completed successfully"* en la pestaña de mensajes.

### Opción B: Desde la Línea de Comandos con `sqlcmd`
```powershell
sqlcmd -S localhost -E -i "d:\SalaCunaPDI\database\SalaCunaPDI.sql"
```
*(Si utiliza autenticación SQL Server en lugar de Windows Authentication):*
```powershell
sqlcmd -S localhost -U sa -P "SuPassword123" -i "d:\SalaCunaPDI\database\SalaCunaPDI.sql"
```

---

## 4. Configuración del Usuario de Conexión en SQL Server

Si desea crear un usuario dedicado para que el Backend API se conecte sin privilegios de `sa`:

```sql
USE [master];
GO
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'usr_sala_cuna')
BEGIN
    CREATE LOGIN [usr_sala_cuna] WITH PASSWORD = N'SalaCunaPDI2026!', CHECK_POLICY = OFF;
END
GO

USE [SalaCunaPDI];
GO
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'usr_sala_cuna')
BEGIN
    CREATE USER [usr_sala_cuna] FOR LOGIN [usr_sala_cuna];
END
GO
ALTER ROLE [db_owner] ADD MEMBER [usr_sala_cuna];
GO
```

---

## 5. Cadena de Conexión en el Backend (`appsettings.json`)

En el archivo `Backend/SalaCunaPDI.API/appsettings.json`, configure la propiedad `ConnectionStrings:DefaultConnection`:

### Con Autenticación de SQL Server (Usuario y Contraseña):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SalaCunaPDI;User Id=usr_sala_cuna;Password=SalaCunaPDI2026!;TrustServerCertificate=True;MultipleActiveResultSets=True;"
  }
}
```

### Con Autenticación Integrada de Windows:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SalaCunaPDI;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True;"
  }
}
```

---

## 6. Usuarios y Contraseñas de Prueba Precargados

Todos los usuarios tienen la contraseña por defecto: **`123456`**.

### Usuarios de Alcance Nacional (Región Metropolitana - RM):
| Rol | RUN | Nombre Completo | Correo |
| :--- | :--- | :--- | :--- |
| **Administrador** | `18441463-5` | Administrador General PDI | `admin.salacuna@investigaciones.cl` |
| **Coordinador** | `14222333-4` | Marcela Paz Rojas Fuentes | `mrojas.coordinacion@investigaciones.cl` |
| **Visador** | `13555666-7` | Rodrigo Andrés Tapia Muñoz | `rtapia.visacion@investigaciones.cl` |
| **Logística** | `12888999-0` | Patricio Esteban Gómez Vera | `pgomez.logistica@investigaciones.cl` |
| **Finanzas (DECOFI)** | `11444777-K` | Claudia Alejandra Mendoza Silva | `cmendoza.finanzas@investigaciones.cl` |
| **Tesorería** | `10999888-1` | Roberto Carlos Pizarro Lagos | `rpizarro.tesoreria@investigaciones.cl` |
| **Postulante** | `15432198-K` | Carolina Andrea Soto Valdés | `csoto.postulante@investigaciones.cl` |

### Usuarios de Alcance Regional — Región de Valparaíso (V):
| Rol | RUN | Nombre Completo | Correo |
| :--- | :--- | :--- | :--- |
| **Coordinador** | `14222333-5` | Valeria Paz Castro Soto | `vcastro.v@investigaciones.cl` |
| **Visador** | `13555666-8` | Héctor Andrés Morales Silva | `hmorales.v@investigaciones.cl` |
| **Logística** | `12888999-1` | Sebastián Esteban Díaz Palma | `sdiaz.v@investigaciones.cl` |
| **Autorización Pago** | `11444777-5` | Lorena Alejandra Ortiz Fuentes | `lortiz.v@investigaciones.cl` |
| **Pago (Tesorería)** | `10999888-5` | Gonzalo Carlos Reyes Peña | `greyes.v@investigaciones.cl` |
| **Postulante** | `16555444-3` | Daniela Paz Herrera Muñoz | `dherrera.v@investigaciones.cl` |

### Usuarios de Alcance Regional — Región del Biobío (VIII):
| Rol | RUN | Nombre Completo | Correo |
| :--- | :--- | :--- | :--- |
| **Coordinador** | `14222333-8` | Mauricio Andrés Sanhueza Lira | `msanhueza.viii@investigaciones.cl` |
| **Visador** | `13555666-9` | Viviana Rocío Lara Ruiz | `vlara.viii@investigaciones.cl` |
| **Postulante** | `17666555-2` | Camila Andrea Riquelme Soto | `criquelme.viii@investigaciones.cl` |

---

## 7. Caso de Prueba de Emulación de Término de Derecho (2 Años)

1. Inicie sesión como Coordinador RM (`14222333-4` / `123456`).
2. La funcionaria **Carolina Andrea Soto Valdés** (`15432198-K`) tiene su hijo **Mateo Ignacio Soto** nacido el `15/03/2024`.
3. Al simular una fecha en **Febrero 2026**, Mateo tiene 1 año y 11 meses (Vigente en Lista de Pago).
4. Al simular el **30 de Marzo de 2026**, Mateo cumplió los 2 años el `15/03/2026`:
   - Se activa la alerta institucional de término de derecho.
   - Sale automáticamente de la nómina activa de pagos.
   - Pasa a la pestaña **"3. Derechos Finalizados (Límite 2 Años)"**.
