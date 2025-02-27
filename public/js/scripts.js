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

// Conexión SSE para usuarios
const eventSourceUsuarios = new EventSource('/sse-usuarios');

eventSourceUsuarios.addEventListener('nuevo_usuario', (event) => {
  const newUser = JSON.parse(event.data);
  console.log('Nuevo registro en usuarios:', newUser);

  if (!lastUserData.id_usuario || lastUserData.id_usuario !== newUser.id_usuario) {
    document.getElementById('id_usuario').value = newUser.id_usuario;
    document.getElementById('nombres').value = newUser.nombre;
    document.getElementById('id_huella').value = newUser.id_huella;

    showCompletedStatus(document.getElementById('huellaStatus'), 'huella');
    lastUserData = newUser;
  }
});

eventSourceUsuarios.onerror = (error) => {
  console.error('Error en la conexión SSE para usuarios:', error);
  eventSourceUsuarios.close();
};

// Conexión SSE para imágenes
const eventSourceImagenes = new EventSource('/sse-imagenes');

eventSourceImagenes.addEventListener('nueva_imagen', (event) => {
  const newImage = JSON.parse(event.data);
  console.log('Nueva imagen registrada:', newImage);

  document.getElementById('link_imagen').value = newImage.link_imagen;
  document.getElementById('id_imagen').value = newImage.id_imagen;

  const imgElement = document.createElement('img');
  imgElement.src = newImage.link_imagen;
  document.getElementById('imagePreview').innerHTML = '';
  document.getElementById('imagePreview').appendChild(imgElement);

  showCompletedStatus(document.getElementById('fotoStatus'), 'foto');
});

eventSourceImagenes.onerror = (error) => {
  console.error('Error en la conexión SSE para imágenes:', error);
  eventSourceImagenes.close();
};

// Conexión SSE para estado de enrollment
const eventSourceEnrollment = new EventSource('/sse-enrollment');

eventSourceEnrollment.addEventListener('enrollment_status', (event) => {
  const data = JSON.parse(event.data);
  console.log('Estado recibido:', data.status);
  document.getElementById('status').innerText = data.status;
});

eventSourceEnrollment.onerror = (error) => {
  console.error('Error en la conexión SSE para enrollment:', error);
  eventSourceEnrollment.close();
};

// Funciones auxiliares
function showCompletedStatus(statusElement, actionType) {
  if (actionType === 'huella') {
    statusElement.innerHTML = '<span class="success">Huella registrada</span>';
  } else if (actionType === 'foto') {
    statusElement.innerHTML = '<span class="success">Foto cargada</span>';
  }
}

document.getElementById("capturarHuellaBtn").addEventListener("click", () => {
  sendMessage("/registrarhuella", "@Grupotwobot");
});

document.getElementById("tomarFotoBtn").addEventListener("click", () => {
  sendMessage("/tomar_foto", "@Mibotcamara_bot");
});

document.getElementById("registrarUsuarioBtn").addEventListener("click", async () => {
  const id_usuario = document.getElementById("id_usuario").value;
  const nombres = document.getElementById("nombres").value;
  const id_huella = document.getElementById("id_huella").value;
  const link_imagen = document.getElementById("link_imagen").value;
  const id_imagen = document.getElementById("id_imagen").value;

  if (id_usuario && nombres && id_huella && link_imagen && id_imagen) {
    const userData = { id_usuario, nombres, id_huella, link_imagen, id_imagen };

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
