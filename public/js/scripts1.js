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

    // 2️⃣ Esperar la respuesta del ESP32 (simulación de 5 segundos)
    setTimeout(async () => {
      try {
        // 3️⃣ El servidor ya ha recibido el ID del ESP32, ahora verificamos con el backend
        const response = await fetch("/verify-fingerprint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });

        const data = await response.json();

        if (data.success) {
          verificacionStatus.innerHTML = '<span style="color: #00ff88;">✅ Huella verificada correctamente</span>';
          mostrarTarjetaUsuario(data.user);
        } else {
          verificacionStatus.innerHTML = '<span class="error" style="color: #ff4c4c;">❌ Huella no encontrada</span>';
          alert("Huella no encontrada");
        }
      } catch (error) {
        console.error("Error al verificar huella:", error);
        verificacionStatus.innerHTML = '<span style="color: #ff4c4c;">❌ Error en la verificación</span>';
      }
    }, 5000);
  });

  function mostrarTarjetaUsuario(user) {
    const tarjetaHTML = `
      <div class="tarjeta">
        <h2>${user.nombre}</h2>
        <p>ID: ${user.id_usuario}</p>
        <p>Cargo: ${user.cargo}</p>
        <p>Departamento: ${user.departamento}</p>
      </div>
    `;
    document.getElementById("resultado").innerHTML = tarjetaHTML;
  }