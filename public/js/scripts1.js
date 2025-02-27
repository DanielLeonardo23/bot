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

  // 1️⃣ Enviar el mensaje al ESP32 para iniciar la verificación
  sendMessage("/verificarhuella", "@Grupotwobot");

  // 2️⃣ Esperar 12 segundos para que el ESP32 haga la verificación
  setTimeout(async () => {
      try {
          // 3️⃣ Consultamos el backend para obtener el resultado
          const response = await fetch("/verify-fingerprint-result", { method: "GET" });

          const data = await response.json();

          console.log("🔹 Respuesta del servidor:", data); // Debugging

          if (response.ok) {
              verificacionStatus.innerHTML = `<span style="color: #00ff88;">✅ ${data.message}</span>`;

              if (data.user) {
                  mostrarTarjetaUsuario(data.user.nombre, data.user.id_huella);
              }
          } else {
              verificacionStatus.innerHTML = '<span class="error" style="color: #ff4c4c;">❌ Huella no encontrada</span>';
              alert("Huella no encontrada");
          }
      } catch (error) {
          console.error("❌ Error al verificar huella:", error);
          verificacionStatus.innerHTML = '<span style="color: #ff4c4c;">❌ Error en la verificación</span>';
      }
  }, 12000);
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
