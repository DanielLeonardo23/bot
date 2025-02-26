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
  
  // Función para mostrar un símbolo de "cargando"
function showLoadingStatus(statusElement) {
  statusElement.innerHTML = '<span class="loading">Cargando...</span>';  // Aquí podrías poner un spinner o icono de carga
}

// Función para mostrar un símbolo de "registrado"
function showCompletedStatus(statusElement, actionType) {
  if (actionType === 'huella') {
    statusElement.innerHTML = '<span class="success">Huella registrada</span>';  // Marca de verificación
  } else if (actionType === 'foto') {
    statusElement.innerHTML = '<span class="success">Foto cargada</span>';  // Marca de verificación
  }
}

  // Función para manejar la captura de huella
  document.getElementById("capturarHuellaBtn").addEventListener("click", () => {
    sendMessage("/registrarhuella", "@Grupotwobot");
    const huellaStatus = document.getElementById("huellaStatus");

    // Mostrar el símbolo de "cargando"
    showLoadingStatus(huellaStatus);

    // Simular un retraso de 5 segundos (5000 ms)
    setTimeout(() => {
      // Mostrar el símbolo de "registrado"
      showCompletedStatus(huellaStatus, 'huella');
    }, 5000);

    // Cargar la última imagen y usuario solo cuando se presione este botón
    
    loadUserData();
  });
// Función para manejar la toma de foto
document.getElementById("tomarFotoBtn").addEventListener("click", () => {
  const fotoStatus = document.getElementById("fotoStatus");

  // Mostrar el símbolo de "cargando"
  showLoadingStatus(fotoStatus);

  // Simular un retraso de 5 segundos (5000 ms)
  setTimeout(() => {
    // Cargar la última imagen solo cuando se presione este botón
    loadImageData();
    // Mostrar el símbolo de "registrado"
    showCompletedStatus(fotoStatus, 'foto');

  }, 5000);
});

  
  // Función para tomar foto
  document.getElementById("tomarFotoBtn").addEventListener("click", () => {
    sendMessage("/tomar_foto", "@Mibotcamara_bot");
     // Mostrar el símbolo de "cargando"
     const fotoStatus = document.getElementById("fotoStatus");

  showLoadingStatus(fotoStatus);
    // Simular un retraso de 5 segundos (5000 ms)
    setTimeout(() => {
      // Mostrar el símbolo de "registrado"
      showCompletedStatus(fotoStatus, 'foto');
    }, 5000);
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
  // Función para mostrar un símbolo de "cargando"
function showLoadingStatus(statusElement) {
  statusElement.innerHTML = '<span class="loading">Cargando...</span>';  // Aquí podrías poner un spinner o icono de carga
}
// Función para mostrar un símbolo de "registrado"
function showCompletedStatus(statusElement, actionType) {
  if (actionType === 'huella') {
    statusElement.innerHTML = '<span class="success">Huella registrada</span>';  // Marca de verificación
  } else if (actionType === 'foto') {
    statusElement.innerHTML = '<span class="success">Foto cargada</span>';  // Marca de verificación
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
  async function loadUsuarios() {
    try {
      const response = await fetch("https://serverdashboardprinter.onrender.com/usuarios");
      const usuarios = await response.json();
      const usuariosContent = document.getElementById("usuariosContent");
      usuariosContent.innerHTML = ""; // Limpiar contenido anterior
  
      usuarios.forEach(usuario => {
        const div = document.createElement("div");
        div.innerHTML = `<p>ID: ${usuario.id_usuario}</p><p>Nombre: ${usuario.nombre}</p><p>ID Huella: ${usuario.id_huella}</p>`;
        usuariosContent.appendChild(div);
      });
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  }
  async function loadImagenes() {
    try {
      const response = await fetch("https://serverdashboardprinter.onrender.com/userimg");
      const imagenes = await response.json();
      const imagenesContent = document.getElementById("imagenesContent");
      imagenesContent.innerHTML = ""; // Limpiar contenido anterior
  
      imagenes.forEach(imagen => {
        const div = document.createElement("div");
        div.innerHTML = `<p>ID Imagen: ${imagen.id_imagen}</p><p>Link Imagen: ${imagen.link_imagen}</p>`;
        imagenesContent.appendChild(div);
      });
    } catch (error) {
      console.error("Error al cargar imágenes:", error);
    }
  }
  async function loadHechos() {
    try {
      const response = await fetch("https://serverdashboardprinter.onrender.com/hechos");
      const hechos = await response.json();
      const hechosContent = document.getElementById("hechosContent");
      hechosContent.innerHTML = ""; // Limpiar contenido anterior
  
      hechos.forEach(hecho => {
        const div = document.createElement("div");
        div.innerHTML = `<p>ID Usuario: ${hecho.id_usuario}</p><p>Fecha: ${hecho.fecha}</p><p>Estado: ${hecho.estado}</p>`;
        hechosContent.appendChild(div);
      });
    } catch (error) {
      console.error("Error al cargar hechos:", error);
    }
  }
  document.getElementById("hechosTab").addEventListener("click", () => {
    document.getElementById("hechosContent").style.display = "block";
    document.getElementById("imagenesContent").style.display = "none";
    document.getElementById("usuariosContent").style.display = "none";
    loadHechos();
  });
  
  document.getElementById("imagenesTab").addEventListener("click", () => {
    document.getElementById("hechosContent").style.display = "none";
    document.getElementById("imagenesContent").style.display = "block";
    document.getElementById("usuariosContent").style.display = "none";
    loadImagenes();
  });
  
  document.getElementById("usuariosTab").addEventListener("click", () => {
    document.getElementById("hechosContent").style.display = "none";
    document.getElementById("imagenesContent").style.display = "none";
    document.getElementById("usuariosContent").style.display = "block";
    loadUsuarios();
  });

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        // Guardar el token en el almacenamiento local
        localStorage.setItem("token", result.token);
        // Redirigir al dashboard
        window.location.href = "dashboard.html";
      } else {
        alert(`Error al iniciar sesión: ${result.message}`);
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Error al iniciar sesión.");
    }
  });
 
  