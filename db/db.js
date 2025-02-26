const { Client } = require('pg');

// Conexión a la base de datos PostgreSQL en la nube
const client = new Client({
  connectionString: 'postgresql://dbsecurity_user:27PdSd9U8rvelKWnSmhR0MrN20M1uAsq@dpg-cuv3f2a3esus73bl48d0-a.oregon-postgres.render.com/dbsecurity',
  ssl: {
    rejectUnauthorized: false, // Se utiliza para conexiones seguras en la nube
  },
});

// Conectar a la base de datos
client.connect()
  .then(() => {
    console.log('Conexión exitosa a la base de datos');
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
  });
