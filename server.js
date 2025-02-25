const express = require('express');
const { CreateClient } = require('./src/lib/createClient');
const { StringSession } = require('telegram/sessions');
const { Logger, Api } = require('telegram');
const fs = require('fs');
const input = require('input'); // Asegúrate de tener esta dependencia instalada
const cors = require('cors');  // Importamos CORS
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Configuración de CORS para permitir solicitudes de cualquier origen
app.use(cors());

// Middleware para servir archivos estáticos (HTML, CSS, JS)
app.use(express.static('public'));

// Middleware para parsear JSON
app.use(express.json());

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: 'duruqbipv',  // Tu nombre de Cloudinary
  api_key: '857167242619486',  // Tu API Key
  api_secret: 'POaaiNhqAICv8t91AXXD-ABx-D4',  // Tu API Secret
});

// Configuración de Multer para manejar la carga de archivos
const storage = multer.memoryStorage();  // Almacenamos en memoria
const upload = multer({ storage: storage });

// Crear el cliente de Telegram
const stringSession = new StringSession(process.env.STRING_SESSION || '');
const client = new CreateClient(
  stringSession,
  Number(process.env.API_ID),
  process.env.API_HASH,
  {
    connectionRetries: 5,
    baseLogger: new Logger(4), // 4 corresponde a LogLevel.ERROR
  }
);

// Iniciar sesión en Telegram
(async () => {
  await client.start({
    phoneNumber: async () => await input.text('number ?'),
    password: async () => await input.text('password?'),
    phoneCode: async () => await input.text('Code ?'),
    onError: (err) => console.log(err),
  });

  if (process.env.STRING_SESSION === '') {
    const sessionString = client.session.save();
    let file = fs.readFileSync('.env', 'utf8');

    // Reemplaza la línea STRING_SESSION existente o agrega una nueva si no existe
    if (file.includes('STRING_SESSION=')) {
      file = file.replace(/STRING_SESSION=.*/, `STRING_SESSION=${sessionString}`);
    } else {
      file += `\nSTRING_SESSION=${sessionString}`;
    }

    fs.writeFileSync('.env', file);
  }

  console.log('Bot is ready.');
})();

// Ruta para enviar el mensaje al bot de Telegram
app.post('/send-message', async (req, res) => {
  try {
    const { command, targetUsername = '@Mibotcamara_bot' } = req.body; // Obtiene destinatario opcional

    if (!command) {
      return res.status(400).json({ success: false, error: 'Comando no proporcionado.' });
    }

    // Enviar mensaje al destinatario definido
    await client.sendMessage(targetUsername, { message: command });

    res.status(200).json({ success: true, message: `Comando "${command}" enviado a "${targetUsername}" correctamente.` });
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Ruta para cargar imágenes a Cloudinary
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  // Subir la imagen a Cloudinary y especificar una carpeta
  cloudinary.uploader.upload_stream(
    { 
      resource_type: 'auto',  // Detecta automáticamente el tipo de archivo (imagen, video, etc.)
      folder: 'uploads/',  // Especificamos que queremos guardar en la carpeta "uploads"
    },
    (error, result) => {
      if (error) {
        return res.status(500).json({ error: 'Error uploading image.' });
      }

      // Guardar el enlace en un archivo de texto
      const imageUrl = result.secure_url;
      fs.appendFile('image-urls.txt', `${imageUrl}\n`, (err) => {
        if (err) {
          console.error('Error saving the URL:', err);
        } else {
          console.log('URL saved successfully.');
        }
      });

      // Respondemos con la URL de la imagen subida
      res.json({
        message: 'Image uploaded successfully',
        filename: result.public_id,  // public_id de la imagen subida
        url: imageUrl,  // URL de la imagen subida
      });
    }
  ).end(req.file.buffer);  // Usamos el archivo desde la memoria
});
// Ruta para obtener la última URL de la imagen cargada
app.get('/last-image', (req, res) => {
    fs.readFile('image-urls.txt', 'utf8', (err, data) => {
      if (err) {
        return res.status(500).json({ error: 'Error al leer el archivo de imágenes.' });
      }
      const urls = data.trim().split('\n');
      const lastUrl = urls[urls.length - 1]; // Obtener la última URL
      if (lastUrl) {
        res.json({ url: lastUrl });
      } else {
        res.status(404).json({ error: 'No hay imágenes cargadas.' });
      }
    });
  });
  
// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
