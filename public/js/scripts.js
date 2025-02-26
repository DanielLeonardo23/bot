// Función para enviar comandos al servidor
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
  
  // Función para capturar huella
  document.getElementById("capturarHuellaBtn").addEventListener("click", () => {
    sendMessage("/registrarhuella", "@Grupotwobot");
  });
  
  // Función para tomar foto
  document.getElementById("tomarFotoBtn").addEventListener("click", () => {
    sendMessage("/tomar_foto", "@Mibotcamara_bot");
  });
  
  // Función para registrar el usuario
  document.getElementById("registrarUsuarioBtn").addEventListener("click", async () => {
    const id_usuario = document.getElementById("id_usuario").value;
    const nombres = document.getElementById("nombres").value;
    const id_huella = document.getElementById("id_huella").value;
    const link_imagen = document.getElementById("link_imagen").value;
    const id_imagen = document.getElementById("id_imagen").value;
  
    if (id_usuario && nombres && id_huella && link_imagen && id_imagen) {
      const userData = {
        id_usuario,
        nombres,
        id_huella,
        link_imagen,
        id_imagen
      };
  
      try {
        const response = await fetch("/register-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          alert("Usuario registrado exitosamente.");
        } else {
          alert(`Error al registrar usuario: ${result.message}`);
        }
      } catch (error) {
        console.error("Error al registrar usuario:", error);
        alert("Error al registrar usuario.");
      }
    } else {
      alert("Por favor, complete todos los campos.");
    }
  });
  
  // Función para cargar la última imagen
  async function loadImageData() {
    try {
      const response = await fetch("/last-image");
      const data = await response.json();
  
      if (data.url) {
        document.getElementById("link_imagen").value = data.url;
        document.getElementById("id_imagen").value = data.filename;
        const imgElement = document.createElement("img");
        imgElement.src = data.url;
        document.getElementById("imagePreview").appendChild(imgElement);
      }
    } catch (error) {
      console.error("Error al cargar la imagen:", error);
    }
  }
  
  // Función para cargar el último usuario registrado
  async function loadUserData() {
    try {
      const response = await fetch("/last-user");
      const data = await response.json();
  
      if (data.id_usuario) {
        document.getElementById("id_usuario").value = data.id_usuario;
        document.getElementById("nombres").value = data.nombre;
        document.getElementById("id_huella").value = data.id_huella;
      }
    } catch (error) {
      console.error("Error al cargar el usuario:", error);
    }
  }
  
  window.onload = () => {
    loadImageData();
    loadUserData();
  };
  