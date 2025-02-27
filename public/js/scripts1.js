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
  sendMessage("/verificarhuella", "@Grupotwobot");
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
