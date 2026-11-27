# Sitio web de la Óptica Los Jerrys

Sitio web sencillo que usa la API REST del proyecto `optica-springboot`. Está hecho con HTML, CSS y JavaScript, sin librerías.

## Equipo Los Jerrys

- Hernández González Erick
- Hernández Gutierrez Eduardo Nicolas
- Pérez Espinosa Gael Alejandro

## Qué hace el sitio

- Inicio de sesión y registro de usuarios con JWT.
- Catálogo de armazones, graduaciones y accesorios.
- Cotizador que suma los precios y aplica 10% de descuento al llevar 2 o más accesorios.
- Compra con ticket, que guarda el cliente y la compra en la API.
- Lista de compras realizadas.
- Botón para cargar productos de ejemplo cuando la base de datos está vacía.

## Cómo usarlo

1. Correr la API del repositorio `optica-springboot` (por defecto en `http://localhost:8080`).
2. Abrir `index.html` en el navegador.
3. Crear una cuenta, iniciar sesión y probar el sitio.

Si la API está en otra dirección, se puede cambiar en la opción "Dirección de la API" de la pantalla de inicio de sesión.

## Archivos

- `index.html`: estructura de la página.
- `css/estilos.css`: colores azules, rejillas y diseño para celular.
- `js/app.js`: conexión con la API, sesión, cotizador y compras.

## Rutas de la API que se usan

- `POST /auth/registro` y `POST /auth/login`
- `GET` y `POST` en `/armazones`, `/graduaciones`, `/accesorios`
- `POST /clientes`
- `GET` y `POST /compras`
