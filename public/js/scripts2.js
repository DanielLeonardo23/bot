// Función para enviar comandos
async function sendMessage(command, targetUsername = "@Grupotwobot") {
    try {
        const response = await fetch("/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command, targetUsername }),
        });

        if (response.ok) {
            Swal.fire({
                title: "Proceso en marcha",
                text: "La acción se ha enviado correctamente.",
                icon: "info",
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                title: "Error",
                text: "Hubo un problema al procesar la solicitud.",
                icon: "error",
                confirmButtonColor: "#d33"
            });
        }
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            title: "Error",
            text: "Ocurrió un error al enviar la solicitud.",
            icon: "error",
            confirmButtonColor: "#d33"
        });
    }
}


// Función para eliminar huella en la base de datos y enviar comando
async function eliminarHuella(id) {
    const confirmacion = await Swal.fire({
        title: "¿Estás seguro?",
        text: `La huella con ID ${id} será eliminada.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
        // 1️⃣ Mostrar alerta de carga sin botones
        Swal.fire({
            title: "Eliminando huella...",
            text: "Por favor, espere...",
            icon: "info",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 2️⃣ Enviar comando al sistema
        sendMessage(`/eliminarhuella ${id}`, "@Grupotwobot");

        // 3️⃣ Esperar antes de eliminar en la BD (ajusta el tiempo si es necesario)
        setTimeout(async () => {
            try {
                const response = await fetch(`/delete-fingerprint/${id}`, { method: "DELETE" });
                const result = await response.json();

                if (result.success) {
                    // 4️⃣ Cerrar la alerta de carga y mostrar éxito
                    Swal.fire({
                        title: "Huella eliminada",
                        text: `La huella con ID ${id} se eliminó correctamente.`,
                        icon: "success",
                        confirmButtonColor: "#00ff88"
                    });
                } else {
                    Swal.fire({
                        title: "Error",
                        text: result.message,
                        icon: "error",
                        confirmButtonColor: "#d33"
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: "Error",
                    text: "Hubo un problema al eliminar la huella.",
                    icon: "error",
                    confirmButtonColor: "#d33"
                });
                console.error(error);
            }

            // 5️⃣ Actualizar la tabla de usuarios
            fetchUsuarios();
        }, 5000);

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



// Exportar funciones para usarlas en el HTML
window.eliminarHuella = eliminarHuella;
