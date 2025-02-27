let lastUserData = {};
let lastImageData = {};

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

// Conectar al endpoint SSE
const eventSource = new EventSource('/sse-usuarios');

// Escuchar eventos de "nuevo_usuario"
eventSource.addEventListener('nuevo_usuario', (event) => {
  const newUser = JSON.parse(event.data); // Parsear los datos recibidos
  console.log('Nuevo registro en usuarios:', newUser);

  // Verificar si hay un nuevo registro comparando con los últimos datos almacenados
  if (!lastUserData.id_usuario || lastUserData.id_usuario !== newUser.id_usuario) {
    // Actualizar los campos del formulario
    document.getElementById('id_usuario').value = newUser.id_usuario;
    document.getElementById('nombres').value = newUser.nombre;
    document.getElementById('id_huella').value = newUser.id_huella;

    // Mostrar mensajes de éxito
    showCompletedStatus(document.getElementById('huellaStatus'), 'huella');

    // Guardar los últimos datos del usuario para la próxima comparación
    lastUserData = newUser;
  }
});

// Manejar errores de conexión
eventSource.onerror = (error) => {
  console.error('Error en la conexión SSE:', error);
  eventSource.close(); // Cerrar la conexión si hay un error
};

const eventSourceImagenes = new EventSource('/sse-imagenes');

eventSourceImagenes.addEventListener('nueva_imagen', (event) => {
  const newImage = JSON.parse(event.data);
  console.log('Nueva imagen registrada:', newImage);

  // Actualizar los campos del formulario
  document.getElementById('link_imagen').value = newImage.link_imagen;
  document.getElementById('id_imagen').value = newImage.id_imagen;

  // Mostrar la imagen en el preview
  const imgElement = document.createElement('img');
  imgElement.src = newImage.link_imagen;
  document.getElementById('imagePreview').innerHTML = ''; // Limpiar antes de agregar la imagen
  document.getElementById('imagePreview').appendChild(imgElement);

  // Mostrar un mensaje de éxito
  showCompletedStatus(document.getElementById('fotoStatus'), 'foto');
});

eventSourceImagenes.onerror = (error) => {
  console.error('Error en la conexión SSE para imágenes:', error);
  eventSourceImagenes.close();
};


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

document.getElementById("capturarHuellaBtn").addEventListener("click", async () => {
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
      const response = await fetch("/register-user1", {
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




// Función para mostrar un símbolo de "cargando"
function showLoadingStatus(statusElement) {
statusElement.innerHTML = '<span class="loading">Cargando...</span>';  // Aquí podrías poner un spinner o icono de carga
}
// Función para mostrar un símbolo de "registrado"
function showCompletedStatus(statusElement, actionType, isChanged) {
  if (isChanged) {
    if (actionType === 'huella') {
      statusElement.innerHTML = '<span class="success">Huella registrada</span>';  // Marca de verificación
    } else if (actionType === 'foto') {
      statusElement.innerHTML = '<span class="success">Foto cargada</span>';  // Marca de verificación
    }
  }
}


async function verifyAndLoadUserData() {
  try {
    const response = await fetch("/last-user");
    const userData = await response.json();

    // Si hay un nuevo usuario, actualiza los campos del formulario
    if (!lastUserData.id_usuario || lastUserData.id_usuario !== userData.id_usuario) {
      document.getElementById("id_usuario").value = userData.id_usuario;
      document.getElementById("nombres").value = userData.nombre;
      document.getElementById("id_huella").value = userData.id_huella;

      showCompletedStatus(document.getElementById("huellaStatus"), 'huella');

      // Guarda el último usuario consultado para la próxima verificación
      lastUserData = userData;
    }
  } catch (error) {
    console.error("Error al verificar usuario:", error);
  }
}

