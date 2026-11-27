let api = localStorage.getItem("api") || "http://localhost:8080";
let token = localStorage.getItem("token") || "";
let usuarioActual = localStorage.getItem("usuario") || "";
let armazones = [];
let graduaciones = [];
let accesorios = [];

const $ = (id) => document.getElementById(id);

function esc(texto) {
  return String(texto === null || texto === undefined ? "" : texto).replace(/[&<>"']/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function dinero(numero) {
  return "$" + Number(numero).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function aviso(id, texto, esError) {
  const caja = $(id);
  if (!texto) {
    caja.className = "aviso oculto";
    caja.textContent = "";
    return;
  }
  caja.textContent = texto;
  caja.className = "aviso " + (esError ? "error" : "bien");
}

function textoError(error) {
  if (error instanceof TypeError) {
    return "No se pudo conectar con la API en " + api;
  }
  return error.message;
}

async function pedir(ruta, metodo, cuerpo) {
  const opciones = { method: metodo || "GET", headers: { "Content-Type": "application/json" } };
  if (token) {
    opciones.headers["Authorization"] = "Bearer " + token;
  }
  if (cuerpo) {
    opciones.body = JSON.stringify(cuerpo);
  }
  const respuesta = await fetch(api + ruta, opciones);
  const texto = await respuesta.text();
  if (respuesta.status === 401 && ruta.indexOf("/auth") !== 0) {
    salir();
    throw new Error("La sesión terminó, inicia sesión otra vez");
  }
  if (!respuesta.ok) {
    throw new Error(texto || "Error " + respuesta.status);
  }
  try {
    return JSON.parse(texto);
  } catch (e) {
    return texto;
  }
}

function guardarApi() {
  const direccion = $("direccionApi").value.trim().replace(/\/+$/, "");
  if (direccion) {
    api = direccion;
    localStorage.setItem("api", api);
  }
}

async function iniciarSesion() {
  const usuario = $("usuario").value.trim();
  const contrasena = $("contrasena").value;
  if (!usuario || !contrasena) {
    aviso("avisoLogin", "Escribe tu usuario y tu contraseña", true);
    return;
  }
  guardarApi();
  try {
    token = await pedir("/auth/login", "POST", { usuario: usuario, contrasena: contrasena });
    usuarioActual = usuario;
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", usuario);
    aviso("avisoLogin", "");
    mostrarSitio();
    await cargarTodo();
  } catch (error) {
    aviso("avisoLogin", textoError(error), true);
  }
}

async function registrarse() {
  const usuario = $("usuario").value.trim();
  const contrasena = $("contrasena").value;
  if (!usuario || !contrasena) {
    aviso("avisoLogin", "Escribe el usuario y la contraseña que quieres usar", true);
    return;
  }
  guardarApi();
  try {
    const respuesta = await pedir("/auth/registro", "POST", { usuario: usuario, contrasena: contrasena });
    aviso("avisoLogin", respuesta + ". Ahora inicia sesión.", false);
  } catch (error) {
    aviso("avisoLogin", textoError(error), true);
  }
}

function mostrarSitio() {
  $("tarjetaLogin").classList.add("oculto");
  $("contenido").classList.remove("oculto");
  $("menu").classList.remove("oculto");
  $("botonArmar").classList.remove("oculto");
  $("botonSalir").classList.remove("oculto");
  $("usuarioActual").textContent = "Hola, " + usuarioActual;
}

function salir() {
  token = "";
  usuarioActual = "";
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  $("tarjetaLogin").classList.remove("oculto");
  $("contenido").classList.add("oculto");
  $("menu").classList.add("oculto");
  $("botonArmar").classList.add("oculto");
  $("botonSalir").classList.add("oculto");
  $("usuarioActual").textContent = "";
  $("ticket").classList.add("oculto");
}

async function cargarTodo() {
  aviso("avisoGeneral", "");
  try {
    armazones = await pedir("/armazones");
    graduaciones = await pedir("/graduaciones");
    accesorios = await pedir("/accesorios");
    dibujarCatalogos();
    llenarCotizador();
    await cargarCompras();
  } catch (error) {
    aviso("avisoGeneral", textoError(error), true);
  }
}

function tarjetaProducto(titulo, detalle, precio) {
  return (
    '<div class="tarjeta producto">' +
    '<svg class="icono" viewBox="0 0 64 32" width="56" height="28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">' +
    '<circle cx="16" cy="18" r="11"/><circle cx="48" cy="18" r="11"/><path d="M27 17q5-4 10 0"/></svg>' +
    "<h3>" + esc(titulo) + "</h3>" +
    "<p>" + esc(detalle) + "</p>" +
    '<p class="precio">' + dinero(precio) + "</p>" +
    "</div>"
  );
}

function dibujarCatalogos() {
  $("listaArmazones").innerHTML = armazones.map((a) => tarjetaProducto(a.nombre, "Material: " + a.material, a.precio)).join("");
  $("listaGraduaciones").innerHTML = graduaciones.map((g) => tarjetaProducto(g.descripcion, "Lentes graduados", g.precio)).join("");
  $("listaAccesorios").innerHTML = accesorios.map((a) => tarjetaProducto(a.nombre, "Accesorio para tus lentes", a.precio)).join("");
  const vacio = armazones.length === 0 && graduaciones.length === 0 && accesorios.length === 0;
  $("sinDatos").classList.toggle("oculto", !vacio);
}

function llenarCotizador() {
  $("selArmazon").innerHTML = armazones.map((a) => '<option value="' + a.id + '">' + esc(a.nombre) + " - " + dinero(a.precio) + "</option>").join("");
  $("selGraduacion").innerHTML = graduaciones.map((g) => '<option value="' + g.id + '">' + esc(g.descripcion) + " - " + dinero(g.precio) + "</option>").join("");
  $("checksAccesorios").innerHTML = accesorios
    .map((a) => '<label><input type="checkbox" id="acc' + a.id + '"> ' + esc(a.nombre) + " (" + dinero(a.precio) + ")</label>")
    .join("");
  accesorios.forEach((a) => $("acc" + a.id).addEventListener("change", calcular));
  calcular();
}

function calcular() {
  const armazon = armazones.find((a) => String(a.id) === $("selArmazon").value);
  const graduacion = graduaciones.find((g) => String(g.id) === $("selGraduacion").value);
  const extras = accesorios.filter((a) => $("acc" + a.id) && $("acc" + a.id).checked);
  let subtotal = 0;
  if (armazon) subtotal += armazon.precio;
  if (graduacion) subtotal += graduacion.precio;
  extras.forEach((a) => (subtotal += a.precio));
  const descuento = extras.length >= 2 ? subtotal * 0.1 : 0;
  const total = Math.round((subtotal - descuento) * 100) / 100;
  $("subtotal").textContent = dinero(subtotal);
  $("descuento").textContent = "-" + dinero(descuento);
  $("total").textContent = dinero(total);
  return { armazon: armazon, graduacion: graduacion, extras: extras, subtotal: subtotal, descuento: descuento, total: total };
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

async function comprar() {
  const datos = calcular();
  const nombre = $("nombreCliente").value.trim();
  const correo = $("correoCliente").value.trim();
  if (!datos.armazon || !datos.graduacion) {
    aviso("avisoCompra", "Elige un armazón y una graduación", true);
    return;
  }
  if (!nombre || !correo) {
    aviso("avisoCompra", "Escribe tu nombre y tu correo", true);
    return;
  }
  try {
    const cliente = await pedir("/clientes", "POST", { nombre: nombre, correo: correo });
    const compra = await pedir("/compras", "POST", {
      fecha: hoy(),
      total: datos.total,
      cliente: { id: cliente.id },
      armazon: { id: datos.armazon.id },
      graduacion: { id: datos.graduacion.id },
      accesorios: datos.extras.map((a) => ({ id: a.id })),
    });
    aviso("avisoCompra", "Compra guardada", false);
    mostrarTicket(compra, nombre, datos);
    await cargarCompras();
  } catch (error) {
    aviso("avisoCompra", textoError(error), true);
  }
}

function mostrarTicket(compra, nombre, datos) {
  let html = "<h3>Ticket de compra No. " + esc(compra.id) + "</h3>";
  html += "<p>Fecha: " + esc(compra.fecha) + "<br>Cliente: " + esc(nombre) + "</p>";
  html += "<div class='linea'><span>" + esc(datos.armazon.nombre) + "</span><span>" + dinero(datos.armazon.precio) + "</span></div>";
  html += "<div class='linea'><span>" + esc(datos.graduacion.descripcion) + "</span><span>" + dinero(datos.graduacion.precio) + "</span></div>";
  datos.extras.forEach((a) => {
    html += "<div class='linea'><span>" + esc(a.nombre) + "</span><span>" + dinero(a.precio) + "</span></div>";
  });
  html += "<div class='linea'><span>Descuento</span><span>-" + dinero(datos.descuento) + "</span></div>";
  html += "<div class='linea total'><span>Total</span><span>" + dinero(compra.total) + "</span></div>";
  html += "<p class='nota'>Gracias por tu compra.</p>";
  $("ticket").innerHTML = html;
  $("ticket").classList.remove("oculto");
}

async function cargarCompras() {
  const compras = await pedir("/compras");
  const filas = compras
    .slice()
    .reverse()
    .map((c) => {
      const extras = (c.accesorios || []).map((a) => a.nombre).join(", ") || "Ninguno";
      return (
        "<tr><td>" + esc(c.id) + "</td><td>" + esc(c.fecha) + "</td><td>" + esc(c.cliente ? c.cliente.nombre : "-") +
        "</td><td>" + esc(c.armazon ? c.armazon.nombre : "-") + "</td><td>" + esc(c.graduacion ? c.graduacion.descripcion : "-") +
        "</td><td>" + esc(extras) + "</td><td>" + dinero(c.total) + "</td></tr>"
      );
    });
  $("tablaCompras").innerHTML = filas.length ? filas.join("") : '<tr><td colspan="7">Todavía no hay compras</td></tr>';
}

async function cargarEjemplos() {
  const armazonesEjemplo = [
    { nombre: "Clásico negro", material: "Acetato", precio: 850 },
    { nombre: "Aviador dorado", material: "Metal", precio: 1200 },
    { nombre: "Redondo azul", material: "Titanio", precio: 1500 },
    { nombre: "Deportivo", material: "Policarbonato", precio: 950 },
  ];
  const graduacionesEjemplo = [
    { descripcion: "Visión sencilla", precio: 600 },
    { descripcion: "Bifocal", precio: 1100 },
    { descripcion: "Progresiva", precio: 1800 },
  ];
  const accesoriosEjemplo = [
    { nombre: "Estuche rígido", precio: 120 },
    { nombre: "Paño de microfibra", precio: 40 },
    { nombre: "Cadena para lentes", precio: 90 },
    { nombre: "Líquido limpiador", precio: 70 },
  ];
  try {
    for (const a of armazonesEjemplo) await pedir("/armazones", "POST", a);
    for (const g of graduacionesEjemplo) await pedir("/graduaciones", "POST", g);
    for (const a of accesoriosEjemplo) await pedir("/accesorios", "POST", a);
    await cargarTodo();
  } catch (error) {
    aviso("avisoGeneral", textoError(error), true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("direccionApi").value = api;
  $("botonEntrar").addEventListener("click", iniciarSesion);
  $("botonRegistro").addEventListener("click", registrarse);
  $("botonSalir").addEventListener("click", salir);
  $("botonComprar").addEventListener("click", comprar);
  $("botonEjemplos").addEventListener("click", cargarEjemplos);
  $("selArmazon").addEventListener("change", calcular);
  $("selGraduacion").addEventListener("change", calcular);
  if (token) {
    mostrarSitio();
    cargarTodo();
  }
});
