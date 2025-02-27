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
  await verifyAndLoadUserData();
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



async function verifyAndLoadImageData() {
  try {
    // Consultar los valores iniciales
    const initialResponse = await fetch("/last-image");
    const initialData = await initialResponse.json();
    
    // Esperar 5 segundos antes de la segunda consulta
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Consultar los valores después del tiempo de espera
    const finalResponse = await fetch("/last-image");
    const finalData = await finalResponse.json();
    
    // Comparar valores antes y después
    const isChanged = initialData.filename !== finalData.filename;
    
    if (isChanged) {
      document.getElementById("link_imagen").value = finalData.url;
      document.getElementById("id_imagen").value = finalData.filename;
      
      const imgElement = document.createElement("img");
      imgElement.src = finalData.url;
      document.getElementById("imagePreview").innerHTML = ""; // Limpiar antes de agregar la imagen
      document.getElementById("imagePreview").appendChild(imgElement);
      
      // Mostrar el estado de completado solo si hubo cambios
      showCompletedStatus(document.getElementById("fotoStatus"), 'foto', isChanged);
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

setInterval(verifyAndLoadUserData, 3000); // Verifica cambios cada 3 segundos
setInterval(verifyAndLoadImageData, 3000); // Verifica cambios en la imagen cada 3 segundos
