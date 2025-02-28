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

// ✅ Obtener y Mostrar la Tabla de Hechos
async function fetchHechos() {
  try {
      const response = await fetch("/hechos");
      const hechos = await response.json();
      const tablaContainer = document.getElementById("tablaContainer");

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
                  ${hechos.map(hecho => `
                      <tr>
                          <td>${hecho.id_hecho}</td>
                          <td>${hecho.id_usuario}</td>
                          <td>${new Date(hecho.fecha).toLocaleString()}</td>
                          <td>${hecho.estado}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
      `;
  } catch (error) {
      const tablaContainer = document.getElementById("tablaContainer");
      tablaContainer.innerHTML = '<p>Error al obtener los hechos.</p>';
      console.error(error);
  }
}

// ✅ Cargar la tabla de hechos al cargar la página
fetchHechos();

