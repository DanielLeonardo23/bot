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
const bcrypt = require('bcrypt');
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

        const dbResult = await clientDB.query(query, [imageId, imageUrl]);
        console.log('URL de la imagen guardada en la base de datos');

        // Notificar a los clientes conectados a través de SSE
        if (global.sseImagenesClients && global.sseImagenesClients.length > 0) {
          const newImage = dbResult.rows[0]; // Datos de la imagen insertada
          global.sseImagenesClients.forEach(client => client(newImage));
        }

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

app.post('/register-user1', async (req, res) => {
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
// Endpoint para Server-Sent Events (SSE)
app.get('/sse-usuarios', (req, res) => {
  // Configurar los headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir CORS

  console.log('Cliente conectado a SSE para usuarios');

  // Función para enviar eventos al cliente
  const sendEvent = (data) => {
    res.write(`event: nuevo_usuario\n`); // Nombre del evento
    res.write(`data: ${JSON.stringify(data)}\n\n`); // Datos del evento
  };

  // Guardar la función sendEvent en una variable global para usarla en otras rutas
  global.sseUsuariosClients = global.sseUsuariosClients || [];
  global.sseUsuariosClients.push(sendEvent);

  // Manejar la desconexión del cliente
  req.on('close', () => {
    console.log('Cliente desconectado de SSE para usuarios');
    global.sseUsuariosClients = global.sseUsuariosClients.filter(client => client !== sendEvent);
  });
});
app.post('/register-user', async (req, res) => {
  const { name, fingerprintId } = req.body;

  try {
    const query = `
      INSERT INTO usuarios (id_usuario, nombre, id_huella)
      VALUES ($1, $2, $3) RETURNING *;
    `;

    const result = await clientDB.query(query, [fingerprintId, name, `fingerprint_${fingerprintId}`]);

    // Enviar la respuesta una sola vez y detener la ejecución
    res.status(200).json({ success: true, message: 'Usuario registrado correctamente', data: result.rows[0] });

    // Notificar a los clientes SSE si están conectados
    if (global.sseUsuariosClients && global.sseUsuariosClients.length > 0) {
      const newUser = result.rows[0];
      global.sseUsuariosClients.forEach(client => client(newUser));
    }

  } catch (err) {
    console.error('Error al insertar en la base de datos:', err);
    res.status(500).json({ success: false, error: 'Error al insertar en la base de datos' });
  }
});


// Endpoint para Server-Sent Events (SSE) de imágenes
app.get('/sse-imagenes', (req, res) => {
  // Configurar los headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir CORS

  console.log('Cliente conectado a SSE para imágenes');

  // Función para enviar eventos al cliente
  const sendEvent = (data) => {
    res.write(`event: nueva_imagen\n`); // Nombre del evento
    res.write(`data: ${JSON.stringify(data)}\n\n`); // Datos del evento
  };

  // Guardar la función sendEvent en una variable global para usarla en otras rutas
  global.sseImagenesClients = global.sseImagenesClients || [];
  global.sseImagenesClients.push(sendEvent);

  // Manejar la desconexión del cliente
  req.on('close', () => {
    console.log('Cliente desconectado de SSE para imágenes');
    global.sseImagenesClients = global.sseImagenesClients.filter(client => client !== sendEvent);
  });
});
app.post('/verify-fingerprint', async (req, res) => {
  let { fingerprintId } = req.body;

  try {
    console.log(`Verificando huella para ID: ${fingerprintId}`);
    const query = 'SELECT * FROM usuarios WHERE id_huella = $1';
    const result = await clientDB.query(query, [fingerprintId]);

    let estado;
    let user = null;
    let id_usuario_log = fingerprintId; // Variable que realmente se guardará en la BD

    if (result.rows.length > 0) {
      user = result.rows[0];
      estado = 'Acceso permitido';
      console.log(`Huella verificada para usuario: ${user.nombre}`);
    } else {
      id_usuario_log = 'Usuario desconocido'; 
      estado = 'Acceso denegado';
      console.log('Huella no encontrada');
    }

    const insertHechoQuery = `
      INSERT INTO hechos (id_usuario, fecha, estado)
      VALUES ($1, NOW() AT TIME ZONE 'America/Lima', $2) RETURNING *;
    `;
    await clientDB.query(insertHechoQuery, [id_usuario_log, estado]);

    // Enviar la respuesta al frontend después de que todo se haya ejecutado correctamente
    if (user) {
      return res.status(200).json({ success: true, message: `Huella verificada: ${user.nombre}`, user });
    } else {
      return res.status(404).json({ success: false, message: 'Huella no encontrada' });
    }

  } catch (err) {
    console.error('Error al verificar la huella:', err);
    return res.status(500).json({ success: false, error: 'Error al verificar la huella' });
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

// Ruta para registrar un nuevo usuario
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario en la base de datos
    const query = 'INSERT INTO usuersForLogin (username, password) VALUES ($1, $2) RETURNING *';
    const result = await clientDB.query(query, [username, hashedPassword]);

    res.status(201).json({ success: true, message: 'Usuario registrado correctamente', user: result.rows[0] });
  } catch (err) {
    console.error('Error al registrar el usuario:', err);
    res.status(500).json({ success: false, message: 'Error al registrar el usuario' });
  }
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Buscar el usuario en la base de datos
    const query = 'SELECT * FROM usuersForLogin WHERE username = $1';
    const result = await clientDB.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Comparar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Contraseña incorrecta' });
    }

    res.status(200).json({ success: true, message: 'Inicio de sesión exitoso'});
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const result = await clientDB.query('SELECT * FROM usuarios');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error); // Muestra el error completo
    res.status(500).json({ 
      error: 'Error al obtener usuarios',
      details: error.message,  // Añadir detalles del error
    });
  }
});


// Obtener todas las imágenes
app.get('/userimg', async (req, res) => {
  try {
    const result = await clientDB.query('SELECT * FROM userimg');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    res.status(500).json({ error: 'Error al obtener imágenes' });
  }
});

// Obtener todos los hechos
app.get('/hechos', async (req, res) => {
  try {
    const result = await clientDB.query('SELECT * FROM hechos');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener hechos:', error);
    res.status(500).json({ error: 'Error al obtener hechos' });
  }
});
app.get('/ultimo-hecho', async (req, res) => {
  try {
    const result = await clientDB.query('SELECT * FROM hechos ORDER BY fecha DESC LIMIT 1');
    
    if (result.rows.length > 0) {
      res.status(200).json({ success: true, hecho: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: "No hay registros en la tabla de hechos" });
    }
  } catch (error) {
    console.error('Error al obtener el último hecho:', error);
    res.status(500).json({ error: 'Error al obtener el último hecho' });
  }
});




app.get('/sse-enrollment', (req, res) => {
  // Configurar los headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir CORS

  console.log('Cliente conectado a SSE para enrolamiento');

  // Función para enviar eventos al cliente
  const sendEvent = (data) => {
    res.write(`event: enrollment_status\n`); // Nombre del evento
    res.write(`data: ${JSON.stringify(data)}\n\n`); // Datos del evento
  };

  // Guardar la función sendEvent en una variable global para usarla en otras rutas
  global.sseEnrollmentClients = global.sseEnrollmentClients || [];
  global.sseEnrollmentClients.push(sendEvent);

  // Manejar la desconexión del cliente
  req.on('close', () => {
    console.log('Cliente desconectado de SSE para enrolamiento');
    global.sseEnrollmentClients = global.sseEnrollmentClients.filter(client => client !== sendEvent);
  });
});


app.post('/enrollment-status', (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'Estado no proporcionado.' });
  }

  console.log('Estado del enrolamiento recibido:', status);

  // Notificar a los clientes conectados a través de SSE
  if (global.sseEnrollmentClients && global.sseEnrollmentClients.length > 0) {
    global.sseEnrollmentClients.forEach(client => client({ status }));
  }

  res.status(200).json({ success: true, message: 'Estado recibido correctamente.' });
});
// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});