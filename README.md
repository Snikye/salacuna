# Sistema de Gestión del Bono Compensatorio de Sala Cuna — PDI

Sistema integral desarrollado para la **Jefatura de Bienestar de la Policía de Investigaciones de Chile (PDI)**, conforme a las disposiciones de la **Orden General N° 2551**, la **Orden General N° 874** y el **Artículo 203 del Código del Trabajo**.

El sistema administra el ciclo de vida completo del beneficio por imposibilidad médica acreditada de asistir a sala cuna, desde la postulación con los 4 documentos oficiales, la aprobación y emisión del Número de Resolución Exenta, el control mensual del Día 30 con base 30 días, el circuito secuencial por roles y regiones, y la extinción automática del derecho cuando el menor causante cumple los 2 años reglamentarios.

---

## 🏛 Arquitectura del Sistema

El proyecto está construido bajo una arquitectura moderna desacoplada en tres capas:

```
SalaCunaPDI/
├── Backend/                 # API RESTful en ASP.NET Core (.NET 8)
│   ├── SalaCunaPDI.API/     # Controladores, Servicios, DTOs, Entidades EF Core y Middleware
│   └── SalaCunaPDI.sln      # Solución .NET
├── Frontend/                # SPA en Angular 18 (TypeScript, Standalone Components, CSS modular)
│   ├── src/app/core/        # Servicios HTTP, Modelos, Autenticación y Simulador de Fecha
│   └── src/app/features/    # Vistas por Rol (Postulante, Coordinador, Visador, Logística, Finanzas, Tesorería, Administrador)
└── database/                # Scripts SQL y documentación de despliegue
    ├── SalaCunaPDI.sql      # Script autocontenido con esquema MER, Stored Procedures y Seed Data
    └── INSTRUCCIONES_BASE_DE_DATOS.md # Guía paso a paso de instalación en cualquier servidor SQL Server
```

---

## 📋 Módulos del Sistema

1. **Módulo 1: Postulación y Revisión Documental (4 Documentos Oficiales)**
   - Carga y validación de los 4 documentos exigidos por la O.G. N° 2551:
     1. Solicitud dirigida al Director General (con plantilla oficial descargable y previsualizable).
     2. Certificado de nacimiento del menor.
     3. Certificado médico que acredite patología permanente hasta los 2 años.
     4. Resolución Exenta de la jefatura de la solicitante.
   - Visor documental integrado en página (previsualización de PDF sin forzar descargas).
   - Aprobación/observación de documentos por el Coordinador.
   - Emisión del Número de Resolución Exenta e ingreso a la Lista de Pago Activa.

2. **Módulo 2: Control Mensual del Día 30 y Cálculo Proporcional sobre Base 30 Días**
   - Declaración mensual obligatoria del Día 30: **SÍ / NO** hizo uso de causales de descuento.
   - Causales normadas: **Feriado Legal**, **Días Administrativos** y **Licencia Médica**.
   - Base invariable de 30 días: $\text{Días Efectivos} = 30 - \sum \text{Días Descontados}$.
   - Cálculo automático del monto proporcional: $\text{Monto} = \text{Monto Base} \times \frac{\text{Días Efectivos}}{30}$.
   - Posibilidad de adjuntar respaldo en PDF (resolución de feriado, licencia, etc.).

3. **Módulo 3: Circuito Secuencial por Roles y Alcance Regional**
   - Circuito estricto de aprobaciones:
     $$\text{Coordinador} \longrightarrow \text{Visador} \longrightarrow \text{Logística} \longrightarrow \text{Finanzas / DECOFI} \longrightarrow \text{Tesorería}$$
   - **Alcance Regional:**
     - **Región Metropolitana (RM):** Supervisión y visibilidad nacional (16 regiones). En etapas 4 y 5 se denominan *Finanzas / DECOFI* y *Tesorería*.
     - **Regiones (I a XVI):** Aislamiento estricto de expedientes a su propia región policial. En etapas 4 y 5 se denominan institucionalmente *Autorización de Pago* y *Pago*.

4. **Módulo 4: Distribución Presupuestaria Anual y Arrastre Interanual**
   - Administración de la bolsa presupuestaria anual (base \$60.000.000).
   - Regla de distribución: **60% Región Metropolitana** y **40% distribuido equitativamente entre las 15 regiones restantes**.
   - Control de sobregiro presupuestario en tiempo real al comprometer fondos en Logística.
   - Evaluación DECOFI para devengo corriente o imputación a **Arrastre Presupuestario Interanual**.

5. **Módulo 5: Calendario Emulador y Extinción de Derecho por Cumplimiento de 2 Años**
   - Calendario emulador de fechas integrado en la cabecera del Coordinador y Postulante para simular cortes del Día 30 mes a mes.
   - Detección automática del cumplimiento de 2 años de edad del menor causante ($\text{Fecha Nacimiento} + 2 \text{ años}$).
   - **Salida automática del listado de cobro activo** para evitar pagos improcedentes.
   - Pestaña exclusiva **"3. Derechos Finalizados (Límite 2 Años)"** en el Coordinador con el detalle de egresadas y observaciones.
   - Notificación formal a la funcionaria en su portal con el aviso institucional de término de beneficio y bloqueo de declaraciones mensuales posteriores.

---

## 🚀 Puesta en Marcha Rápida

### 1. Base de Datos
Siga las instrucciones detalladas en [INSTRUCCIONES_BASE_DE_DATOS.md](database/INSTRUCCIONES_BASE_DE_DATOS.md) y ejecute el script:
```powershell
sqlcmd -S localhost -E -i "database\SalaCunaPDI.sql"
```

### 2. Backend API (.NET 8)
```powershell
cd Backend\SalaCunaPDI.API
dotnet run --urls "http://0.0.0.0:5228"
```
*API Swagger disponible en:* `http://localhost:5228/swagger`

### 3. Frontend SPA (Angular 18)
```powershell
cd Frontend
npm install
npm start
```
*Aplicación web disponible en:* `http://localhost:4223`

---

## 🔑 Credenciales de Acceso de Prueba (Contraseña: `123456`)

- **Administrador General:** `18441463-5`
- **Coordinador RM:** `14222333-4`
- **Postulante RM:** `15432198-K` (Carolina Soto — menor Mateo Soto, nacido el 15/03/2024)
- **Coordinador Región V:** `14222333-5`
- **Postulante Región V:** `16555444-3` (Daniela Herrera — menor Joaquín Herrera)
- **Coordinador Región VIII:** `14222333-8`
- **Postulante Región VIII:** `17666555-2` (Camila Riquelme — menor Emilia Riquelme)
