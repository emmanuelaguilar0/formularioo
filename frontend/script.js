const API_URL = "http://localhost:3000/usuarios";

const formulario = document.querySelector(".formulario");
const tipoDocumento = document.getElementById("tipoDocumento");
const documento = document.getElementById("documento");
const nombres = document.getElementById("nombres");
const apellidos = document.getElementById("apellidos");
const direccion = document.getElementById("direccion");
const ciudad = document.getElementById("ciudad");
const fecha = document.getElementById("fecha");
const correo = document.getElementById("correo");

const btnGuardar = formulario.querySelector('button[type="submit"]');
const btnActualizar = document.getElementById("btnActualizar");
const btnEliminar = document.getElementById("btnEliminar");
const tablaDatos = document.getElementById("tablaDatos");

let idUsuario = null;

btnGuardar.disabled = false;
btnActualizar.disabled = true;
btnEliminar.disabled = true;

function obtenerDatosFormulario() {
    return {
        tipoDocumento: tipoDocumento.value,
        documento: documento.value.trim(),
        nombres: nombres.value.trim(),
        apellidos: apellidos.value.trim(),
        direccion: direccion.value.trim(),
        ciudad: ciudad.value,
        fecha: fecha.value,
        correo: correo.value.trim()
    };
}

function cargarDatosFormulario(usuario) {
    tipoDocumento.value = usuario.tipoDocumento || "";
    documento.value = usuario.documento || "";
    nombres.value = usuario.nombres || "";
    apellidos.value = usuario.apellidos || "";
    direccion.value = usuario.direccion || "";
    ciudad.value = usuario.ciudad || "";
    fecha.value = usuario.fecha || "";
    correo.value = usuario.correo || "";
}

function limpiarFormulario() {
    formulario.reset();
    idUsuario = null;
    btnGuardar.disabled = false;
    btnActualizar.disabled = true;
    btnEliminar.disabled = true;
}

async function cargarPersonas() {
    try {
        const respuesta = await fetch(API_URL);
        if (!respuesta.ok) throw new Error("Error al cargar usuarios");
        const usuarios = await respuesta.json();
        mostrarTabla(usuarios);
    } catch (error) {
        console.error(error);
        alert("No se pudieron cargar los usuarios. Verifica que el backend esté funcionando.");
    }
}

function mostrarTabla(usuarios) {
    tablaDatos.innerHTML = "";

    usuarios.forEach(usuario => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${usuario.tipoDocumento || ""}</td>
            <td>${usuario.documento || ""}</td>
            <td>${usuario.nombres || ""}</td>
            <td>${usuario.apellidos || ""}</td>
            <td>${usuario.direccion || ""}</td>
            <td>${usuario.ciudad || ""}</td>
            <td>${usuario.fecha ? String(usuario.fecha).substring(0, 10) : ""}</td>
            <td>${usuario.correo || ""}</td>
            <td>
                <button type="button" class="btn-tabla-actualizar">Actualizar</button>
                <button type="button" class="btn-tabla-eliminar">Eliminar</button>
            </td>
        `;

        fila.querySelector(".btn-tabla-actualizar").addEventListener("click", () => {
            cargarUsuario(usuario.id);
        });

        fila.querySelector(".btn-tabla-eliminar").addEventListener("click", () => {
            eliminarUsuario(usuario.id);
        });

        tablaDatos.appendChild(fila);
    });
}

async function buscarUsuarioPorDocumento(tipo, numero) {
    const respuesta = await fetch(
        `${API_URL}?tipoDocumento=${encodeURIComponent(tipo)}&documento=${encodeURIComponent(numero)}`
    );
    if (!respuesta.ok) throw new Error("No se pudo consultar el usuario");
    const usuarios = await respuesta.json();
    return usuarios.find(usuario =>
        usuario.tipoDocumento === tipo && String(usuario.documento) === numero
    );
}

async function validarDocumento() {
    const tipo = tipoDocumento.value;
    const numero = documento.value.trim();
    if (tipo === "" || numero === "") return;

    try {
        const usuarioEncontrado = await buscarUsuarioPorDocumento(tipo, numero);

        if (idUsuario !== null) {
            if (usuarioEncontrado && String(usuarioEncontrado.id) !== String(idUsuario)) {
                alert("Ya existe otro usuario con este tipo y número de documento.");
                btnActualizar.disabled = true;
            } else {
                btnActualizar.disabled = false;
            }
            btnGuardar.disabled = true;
            btnEliminar.disabled = false;
            return;
        }

        if (usuarioEncontrado) {
            alert("Este usuario ya está registrado.");
            cargarDatosFormulario(usuarioEncontrado);
            idUsuario = usuarioEncontrado.id;
            btnGuardar.disabled = true;
            btnActualizar.disabled = false;
            btnEliminar.disabled = false;
        } else {
            btnGuardar.disabled = false;
            btnActualizar.disabled = true;
            btnEliminar.disabled = true;
        }
    } catch (error) {
        console.error(error);
    }
}

tipoDocumento.addEventListener("change", validarDocumento);
documento.addEventListener("blur", validarDocumento);

formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const datos = obtenerDatosFormulario();
    if (!datos.tipoDocumento || !datos.documento || !datos.nombres || !datos.apellidos) {
        alert("Completa los campos obligatorios.");
        return;
    }

    try {
        const existente = await buscarUsuarioPorDocumento(datos.tipoDocumento, datos.documento);
        if (existente) {
            alert("Esta persona ya está registrada. No se permiten documentos duplicados.");
            cargarDatosFormulario(existente);
            idUsuario = existente.id;
            btnGuardar.disabled = true;
            btnActualizar.disabled = false;
            btnEliminar.disabled = false;
            return;
        }

        const respuesta = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        if (!respuesta.ok) throw new Error("No se pudo guardar el usuario");

        alert("Usuario guardado correctamente.");
        limpiarFormulario();
        cargarPersonas();
    } catch (error) {
        console.error(error);
        alert("No se pudo guardar el usuario. Verifica que el backend y MySQL estén funcionando.");
    }
});

async function cargarUsuario(id) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}`);
        if (!respuesta.ok) throw new Error("Usuario no encontrado");
        const usuario = await respuesta.json();
        cargarDatosFormulario(usuario);
        idUsuario = usuario.id;
        btnGuardar.disabled = true;
        btnActualizar.disabled = false;
        btnEliminar.disabled = false;
    } catch (error) {
        console.error(error);
        alert("No se pudo cargar el usuario.");
    }
}

btnActualizar.addEventListener("click", async function() {
    if (idUsuario === null) {
        alert("Primero selecciona un usuario para actualizar.");
        return;
    }

    const datos = obtenerDatosFormulario();
    if (!datos.tipoDocumento || !datos.documento || !datos.nombres || !datos.apellidos) {
        alert("Completa los campos obligatorios.");
        return;
    }

    try {
        const existente = await buscarUsuarioPorDocumento(datos.tipoDocumento, datos.documento);
        if (existente && String(existente.id) !== String(idUsuario)) {
            alert("Ya existe otro usuario con este tipo y número de documento.");
            return;
        }

        const respuesta = await fetch(`${API_URL}/${idUsuario}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        if (!respuesta.ok) throw new Error("No se pudo actualizar el usuario");

        alert("Usuario actualizado correctamente.");
        limpiarFormulario();
        cargarPersonas();
    } catch (error) {
        console.error(error);
        alert("No se pudo actualizar el usuario.");
    }
});

async function eliminarUsuario(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!respuesta.ok) throw new Error("No se pudo eliminar el usuario");

        alert("Usuario eliminado correctamente.");
        if (String(idUsuario) === String(id)) limpiarFormulario();
        cargarPersonas();
    } catch (error) {
        console.error(error);
        alert("No se pudo eliminar el usuario.");
    }
}

btnEliminar.addEventListener("click", async function() {
    if (idUsuario === null) {
        alert("Primero selecciona un usuario para eliminar.");
        return;
    }
    await eliminarUsuario(idUsuario);
});

cargarPersonas();
