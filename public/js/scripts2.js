// Función para enviar comandos
async function sendMessage(command, targetUsername = "@Grupotwobot") {
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

// Función para eliminar huella en la base de datos y enviar comando
async function eliminarHuella(id) {
    if (!confirm(`¿Seguro que deseas eliminar la huella con ID ${id}?`)) return;

    try {
        // 1️⃣ Enviar comando al bot de Telegram
        sendMessage(`/eliminarhuella ${id}`, "@Grupotwobot");

        // 2️⃣ Mostrar mensaje de espera y deshabilitar botones para evitar doble eliminación
        alert("Enviando comando para eliminar huella... Espere un momento.");
        document.querySelectorAll(".delete-btn").forEach(btn => btn.disabled = true);

        // 3️⃣ Esperar 5 segundos antes de eliminar en la BD (ajusta según lo que tarde el ESP32)
        setTimeout(async () => {
            try {
                // 4️⃣ Eliminar huella en la base de datos
                const response = await fetch(`/delete-fingerprint/${id}`, { method: "DELETE" });
                const result = await response.json();

                if (result.success) {
                    alert(`Huella con ID ${id} eliminada correctamente.`);
                } else {
                    alert("Error: " + result.message);
                }
            } catch (error) {
                alert("Error al eliminar la huella en la BD.");
                console.error(error);
            }

            // 5️⃣ Reactivar botones y actualizar lista de usuarios
            document.querySelectorAll(".delete-btn").forEach(btn => btn.disabled = false);
            fetchUsuarios();
        }, 5000); // Espera de 5 segundos antes de eliminar en la BD

    } catch (error) {
        alert("Error al procesar la eliminación.");
        console.error(error);
    }
}


// Exportar funciones para usarlas en el HTML
window.eliminarHuella = eliminarHuella;
