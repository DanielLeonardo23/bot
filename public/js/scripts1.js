async function sendMessage(command, targetUsername = '@Grupotwobot') {
  try {
    const response = await fetch("/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, targetUsername }),
    });

    if (response.ok) {
      alert(`Comando "${command}" enviado a "${targetUsername}" correctamente.`);
    } else {
      alert(`Error al enviar el comando "${command}".`);
    }
  } catch (error) {
    console.error("Error:", error);
    alert(`Error al enviar el comando "${command}".`);
  }
}

// ✅ Función para verificar huella
async function verificarHuella() {
  try {
      // 1️⃣ Mostrar alerta de carga
      Swal.fire({
          title: "Verificando huella...",
          text: "Por favor, coloque su dedo en el sensor...",
          icon: "info",
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
              Swal.showLoading();
          }
      });
      // 2️⃣ Enviar comando al ESP32 y esperar su procesamiento
      sendMessage("/verificarhuella", "@Grupotwobot");  // ⚠ Espera la respuesta antes de continuar
  } catch (error) {
      Swal.fire({
          title: "Error",
          text: "Ocurrió un problema inesperado.",
          icon: "error",
          confirmButtonColor: "#d33"
      });
      console.error(error);
  }
}



// ✅ Asociar la verificación al botón
document.getElementById("verificarHuellaBtn").addEventListener("click", verificarHuella);

// ✅ Función para mostrar la tarjeta de usuario verificado
function mostrarTarjetaUsuario(nombre, id_huella) {
  const resultado = document.getElementById("resultado");
  resultado.innerHTML = `
      <div class="tarjeta">
          <h2>✅ Usuario Verificado</h2>
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>ID de Huella:</strong> ${id_huella}</p>
      </div>
  `;
}

let hechosData = [];  // Almacenará todos los hechos obtenidos del backend
let currentPage = 1;  // Página actual
const itemsPerPage = 10;  // Número de registros por página

// ✅ Función para obtener los hechos desde el backend
async function fetchHechos() {
  try {
      const response = await fetch("/hechos");
      hechosData = await response.json(); // Guardamos los datos globalmente
      renderTable(currentPage); // Mostramos la primera página
  } catch (error) {
      document.getElementById("tablaContainer").innerHTML = '<p>Error al obtener los hechos.</p>';
      console.error(error);
  }
}

// ✅ Función para renderizar la tabla con la paginación
function renderTable(page) {
  const tablaContainer = document.getElementById("tablaContainer");
  const start = (page - 1) * itemsPerPage;  // Índice de inicio
  const end = start + itemsPerPage;  // Índice de fin
  const hechosPagina = hechosData.slice(start, end);  // Extraer los datos de la página actual

  tablaContainer.innerHTML = `
      <h2>Hechos</h2>
      <table>
          <thead>
              <tr>
                  <th>ID Hecho</th>
                  <th>ID Usuario</th>
                  <th>Fecha</th>
                  <th>Estado</th>
              </tr>
          </thead>
          <tbody>
              ${hechosPagina.map(hecho => `
                  <tr>
                      <td>${hecho.id_hecho}</td>
                      <td>${hecho.id_usuario}</td>
                      <td>${new Date(hecho.fecha).toLocaleString()}</td>
                      <td>${hecho.estado}</td>
                  </tr>
              `).join('')}
          </tbody>
      </table>
      <div id="paginationControls" class="pagination"></div>
  `;

  renderPaginationControls();  // Actualizar los controles de paginación
}

// ✅ Función para crear los botones de paginación
function renderPaginationControls() {
  const totalPages = Math.ceil(hechosData.length / itemsPerPage);
  const paginationControls = document.getElementById("paginationControls");

  paginationControls.innerHTML = ""; // Limpiar los controles previos

  // Botón "Anterior"
  if (currentPage > 1) {
      paginationControls.innerHTML += `<button onclick="changePage(${currentPage - 1})">⬅️ Anterior</button>`;
  }

  // Números de página
  for (let i = 1; i <= totalPages; i++) {
      paginationControls.innerHTML += `
          <button onclick="changePage(${i})" ${i === currentPage ? 'class="active"' : ''}>${i}</button>
      `;
  }

  // Botón "Siguiente"
  if (currentPage < totalPages) {
      paginationControls.innerHTML += `<button onclick="changePage(${currentPage + 1})">Siguiente ➡️</button>`;
  }
}

// ✅ Función para cambiar de página
function changePage(page) {
  if (page < 1 || page > Math.ceil(hechosData.length / itemsPerPage)) return;
  currentPage = page;
  renderTable(currentPage);
}

// ✅ Cargar la tabla al iniciar la página
fetchHechos();


