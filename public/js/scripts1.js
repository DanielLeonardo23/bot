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

document.getElementById("verificarHuellaBtn").addEventListener("click", async () => {
  const verificacionStatus = document.getElementById("verificacionStatus");
  verificacionStatus.innerHTML = '<div class="spinner"></div> Verificando huella...';

  // Simular un retraso de 3 segundos (3000 ms)
  setTimeout(async () => {
    await sendMessage("/verificarhuella", "@Grupotwobot");
    verificacionStatus.innerHTML = ''; // Limpiar el mensaje de verificación
    fetchHechos(); // Actualizar la tabla de hechos después de la verificación
  }, 3000);
});

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

// Actualizar la tabla de hechos cada 10 segundos
setInterval(fetchHechos, 5000);

// Cargar la tabla de hechos al cargar la página
fetchHechos();
