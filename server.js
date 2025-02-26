const express = require('express');
const { Client } = require('pg');
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
const port = process.env.PORT || 3000; // Cambia esta línea

const clientDB = new Client({
  connectionString: 'postgresql://dbsecurity_user:27PdSd9U8rvelKWnSmhR0MrN20M1uAsq@dpg-cuv3f2a3esus73bl48d0-a.oregon-postgres.render.com/dbsecurity?sslmode=require',
  ssl: {
    rejectUnauthorized: false,
  },
});

clientDB.connect()
  .then(() => {
    console.log('Conexión exitosa a la base de datos PostgreSQL');
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
  });

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

// Ruta para cargar imágenes a Cloudinary y guardar la URL en la base de datos
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  // Subir la imagen a Cloudinary y especificar una carpeta
  cloudinary.uploader.upload_stream(
    { 
      resource_type: 'auto',  // Detecta automáticamente el tipo de archivo (imagen, video, etc.)
      folder: 'uploads/',  // Especificamos que queremos guardar en la carpeta "uploads"
    },
    async (error, result) => {
      if (error) {
        return res.status(500).json({ error: 'Error uploading image.' });
      }

      // Obtener la URL de la imagen subida
      const imageUrl = result.secure_url;

      // Insertar la URL en la base de datos
      try {
        const query = 'INSERT INTO imagenes (id_imagen, link_imagen) VALUES ($1, $2) RETURNING *;';
        const imageId = result.public_id;  // Usamos el public_id de Cloudinary como id_imagen

        await clientDB.query(query, [imageId, imageUrl]);
        console.log('URL de la imagen guardada en la base de datos');

        // Responder con la URL de la imagen subida
        res.json({
          message: 'Image uploaded and URL saved to database successfully',
          filename: result.public_id,  // public_id de la imagen subida
          url: imageUrl,  // URL de la imagen subida
        });
      } catch (dbError) {
        console.error('Error al guardar la URL en la base de datos:', dbError);
        res.status(500).json({ error: 'Error al guardar la URL en la base de datos.' });
      }
    }
  ).end(req.file.buffer);  // Usamos el archivo desde la memoria
});



// Ruta para obtener la última imagen
app.get('/last-image', async (req, res) => {
  try {
    // Consulta SQL para obtener la última imagen registrada en la tabla 'imagenes'
    const query = 'SELECT link_imagen, id_imagen FROM imagenes ORDER BY id_imagen DESC LIMIT 1';
    const result = await clientDB.query(query);

    if (result.rows.length > 0) {
      // Obtener la URL y el ID de la imagen
      const { link_imagen, id_imagen } = result.rows[0];
      res.json({ url: link_imagen, filename: id_imagen });
    } else {
      res.status(404).json({ error: 'No hay imágenes cargadas en la base de datos.' });
    }
  } catch (err) {
    console.error('Error al obtener la última imagen:', err);
    res.status(500).json({ error: 'Error al obtener la última imagen' });
  }
});

// Ruta para obtener el último usuario registrado
app.get('/last-user', async (req, res) => {
  try {
    // Consulta SQL para obtener el último usuario registrado en la tabla 'usuarios'
    const query = 'SELECT id_usuario, nombre, id_huella FROM usuarios ORDER BY id_usuario DESC LIMIT 1';
    const result = await clientDB.query(query);

    if (result.rows.length > 0) {
      // Obtener los detalles del último usuario registrado
      const { id_usuario, nombre, id_huella } = result.rows[0];
      res.json({ id_usuario, nombre, id_huella });
    } else {
      res.status(404).json({ error: 'No hay usuarios registrados en la base de datos.' });
    }
  } catch (err) {
    console.error('Error al obtener el último usuario:', err);
    res.status(500).json({ error: 'Error al obtener el último usuario' });
  }
});

app.post('/register-user', async (req, res) => {
  const { id_usuario, nombres, id_huella, link_imagen, id_imagen } = req.body;

  try {
    // Insertar los datos directamente en la tabla 'userimg' (solo Telegram)
    const queryUserImg = 'INSERT INTO userimg (id_usuario, nombre, id_huella, link_imagen, id_imagen) VALUES ($1, $2, $3, $4, $5)';
    const result = await clientDB.query(queryUserImg, [id_usuario, nombres, id_huella, link_imagen, id_imagen]);

    res.status(200).json({ success: true, message: 'Usuario registrado correctamente en userimg.' });
  } catch (err) {
    console.error('Error al registrar el usuario en userimg:', err);
    res.status(500).json({ success: false, message: 'Error al registrar el usuario en userimg' });
  }
});


// Ruta para verificar una huella en la base de datos
app.post('/verify-fingerprint', async (req, res) => {
  const { fingerprintId } = req.body;

  try {
    const query = 'SELECT * FROM usuarios WHERE id_usuario = $1';
    const result = await clientDB.query(query, [fingerprintId]);

    if (result.rows.length > 0) {
      res.status(200).json({ success: true, message: `Huella verificada: ${result.rows[0].nombre}` });
    } else {
      res.status(404).json({ success: false, message: 'Huella no encontrada' });
    }
  } catch (err) {
    console.error('Error al verificar la huella:', err);
    res.status(500).json({ success: false, error: 'Error al verificar la huella' });
  }
});

// Ruta para eliminar una huella
app.delete('/delete-fingerprint/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM usuarios WHERE id_usuario = $1';
    const result = await clientDB.query(query, [id]);

    if (result.rowCount > 0) {
      res.status(200).json({ success: true, message: `Huella con ID ${id} eliminada` });
    } else {
      res.status(404).json({ success: false, message: 'Huella no encontrada' });
    }
  } catch (err) {
    console.error('Error al eliminar la huella:', err);
    res.status(500).json({ success: false, error: 'Error al eliminar la huella' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
