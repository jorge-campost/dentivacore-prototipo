
# DentivaCore - Prototipo navegable

ALUMNO: JORGE CAMPOS TRUJILLO (100200708)

Prototipo en HTML, CSS y JavaScript del sistema DentivaCore, un ERP web para consultorios dentales pequeños. Corresponde a la sección 4.4 del trabajo final de Lenguaje de Programación II y se construyó a partir de los mock-ups de la sección 4.3.2.

No usa servidor, base de datos ni librerías. Los datos de ejemplo se guardan en el navegador (localStorage), para que lo que se registra en una pantalla se vea en las demás.

## Cómo abrirlo

* Abrir el archivo `index.html` en Chrome o Edge. También funciona con la extensión Live Server de Visual Studio Code.
* Ingresar con uno de los usuarios de prueba. La contraseña de los tres es `dentiva123`.

| Rol | Usuario | Primera pantalla |
| --- | --- | --- |
| Recepcionista | marisol.diaz | Agenda |
| Odontólogo | andres.rojas | Agenda |
| Administradora | carmen.vela | Reportes |

* El enlace "Restablecer los datos de ejemplo" de la pantalla de inicio devuelve los datos a su estado inicial. Las citas de ejemplo se crean alrededor de la fecha de hoy.

## Estructura de carpetas

-	index.html: inicio de sesión
-	agenda.html: agenda de citas, detalle de la cita y nueva cita
-	pacientes.html: lista de pacientes, registro y ficha
-	historia.html: historia clínica (antecedentes, atenciones y notas aclaratorias)
-	presupuesto.html: presupuesto de tratamiento
-	pago.html: registro de pago
-	reportes.html: los tres reportes y su exportación a CSV
-	configuracion.html: pantalla pendiente
-	assets/images: logo
-	assets/styles/style.css: estilos de todas las pantallas
-	assets/scripts/datos.js: datos de ejemplo y su guardado en el navegador
-	assets/scripts/reglas.js: las nueve reglas de negocio (RN01 a RN09)
-	assets/scripts/script.js: funciones comunes (sesión, menú, avisos, ventanas, formatos)
-	assets/scripts: un archivo por pantalla (login.js, agenda.js, pacientes.js, historia.js, presupuesto.js, pago.js, reportes.js, configuracion.js)

### Diseño visual

* **Colores:** Se usaron los diez colores de los fundamentos visuales (sección 4.1), definidos como variables al inicio de `style.css`:
-	Primario: #0F766E
-	Primario oscuro: #115E59
-	Fondo: #F8FAFC
-	Superficie: #FFFFFF
-	Borde: #E2E8F0
-	Texto: #0F172A
-	Texto secundario: #475569
-	Éxito: #15803D
-	Advertencia: #B45309
-	Error: #B91C1C

* Tipografía: Se utilizó Inter en cuatro estilos (24, 18, 14 y 12 px). Si no hay conexión a internet se usa Arial.
* Distribución: En computadora el menú va en una columna a la izquierda y el contenido a la derecha. En celular (hasta 768 px) el menú pasa a un selector de sección, las tablas se convierten en tarjetas y las ventanas ocupan toda la pantalla.
* Componentes: Botones, campos, tablas, avisos, etiquetas de estado, ventanas y menú siguen el catálogo de componentes.

## Interacciones que funcionan

* Inicio y cierre de sesión, con un menú distinto para cada rol (RF01, RF02).
* Las pantallas clínicas solo se abren con el usuario odontólogo. Si otro rol escribe la dirección, vuelve a su primera pantalla con un aviso (RN05).
* Agenda por semana y por día, con filtro por odontólogo (RF16).
* Nueva cita: rechaza el cruce con otra cita del mismo odontólogo (RN02) y la fecha pasada o fuera del horario de atención (RN03).
* Cambio de estado de la cita: solo se ofrecen los cambios permitidos (RN04). Una cita cancelada o con inasistencia deja libre su hora.
* Pacientes: búsqueda por nombre o documento, lista paginada, registro con aviso de documento duplicado (RN01) y actualización del contacto.
* Historia clínica: antecedentes, registro de atención con validación de la pieza FDI (RN07) y nota aclaratoria con fecha y usuario (RN06). No hay acciones para editar ni eliminar atenciones.
* Presupuesto: el precio se copia del catálogo y el total se calcula solo (RN08).
* Pago: rechaza el monto mayor al saldo; cuando el saldo llega a cero el presupuesto pasa a Pagado (RN09).
* Reportes de citas del día, ingresos por periodo y saldos pendientes, con exportación a CSV que Excel abre con tildes.

## Usabilidad

Se aplicaron principios básicos de usabilidad:
* Cada pantalla tiene un solo botón principal, en el color primario.
* Los mensajes de error dicen qué pasó y qué hacer, por ejemplo "El Dr. Andrés Rojas ya tiene una cita de 10:00 a 11:00. Elige otra hora."
* Los errores de un formulario se muestran debajo del campo que hay que corregir.
* Los formularios piden solo los datos que exige cada requisito.
* El estado de una cita se muestra con texto y con color.

## Diseño inclusivo

* la imagen del logo tiene el atributo 'alt'
* se usó las etiquetas 'aria-label' en los botones que solo tienen icono y en los campos sin etiqueta visible
* cada campo de formulario tiene su 'label'
* los colores de texto tienen contraste suficiente sobre el fondo

## Lo que no incluye el prototipo

* Las pantallas de configuración del administrador (usuarios, horario y catálogo de tratamientos; RF03, RF04 y RF22).
* Servidor y base de datos. En el sistema final las reglas de `reglas.js` se validan también en el servidor (RNF08) y las contraseñas no se guardan en el navegador.
