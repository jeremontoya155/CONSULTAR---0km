const axios = require('axios');
require('dotenv').config();
const url =process.env.URL ;
const email =process.env.EMAIL ;
const password =process.env.PASSWORD ; 
let ACCESSTOKEN;

const loginAndGetToken = async () => {
  try {
    // Codificar las credenciales en Base64
    const credentials = Buffer.from(`${email}:${password}`).toString('base64');

    // Configurar el encabezado de autorización
    const headers = {
      'Authorization': `Basic ${credentials}`
    };

    // Realizar la solicitud POST para obtener el token
    const response = await axios.post(url, null, { headers });

    // Verificar el código de estado de la respuesta
    if (response.status === 200) {
      // La solicitud fue exitosa
      const respuestaJson = response.data;
      ACCESSTOKEN = response.data.access_token;

      

      const token = respuestaJson.access_token;
      // Llamar a la función para obtener datos de la API usando el token
      
    } else if (response.status === 401) {
      // Error de autenticación
      console.log('Error de autenticación. Verifica las credenciales.');
    } else {
      // Otro tipo de error
      console.log('Error en la solicitud. Código de estado:', response.status);
    }
  } catch (error) {
    console.error('Error al realizar la solicitud:', error.message);
  }
};

// Llamada a la función principal
loginAndGetToken(); 

// Resto del código
require('dotenv').config()
const express = require('express');
const cors = require('cors');
// Elimina la línea donde inicializas ACCESSTOKEN, ya que ahora se obtendrá con refreshToken

const app = express();

const PORT = process.env.PORT;

//Agregamos cambios al access token
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/obtener-marcas', async (req, res) => {
 
  try {
    const apiUrl = 'https://api.infoauto.com.ar/cars/pub/';

    const allData = await obtenerTodasLasMarcas(apiUrl, ACCESSTOKEN);

   

    res.json({ marcas: allData });
  } catch (error) {
    console.error('Error al obtener las marcas:', error.message);
    res.status(500).json({ error: 'Error al obtener las marcas' });
  }
});

app.get('/obtener-grupos/:brandId', async (req, res) => {
  
  try {
    const apiUrl = 'https://api.infoauto.com.ar/cars/pub/';

    const brandId = req.params.brandId;

    const allData = await obtenerTodosLosGrupos(apiUrl, ACCESSTOKEN, brandId);

    console.log(`Grupos obtenidos para la marca con ID ${brandId}:`, allData);

    res.json({ grupos: allData });
  } catch (error) {
    console.error(`Error al obtener los grupos de la marca con ID ${req.params.brandId}:`, error.message);
    res.status(500).json({ error: 'Error al obtener los grupos' });
  }
});

app.get('/obtener-modelos/:brandId/:groupId', async (req, res) => {
 
  try {
    const apiUrl = 'https://api.infoauto.com.ar/cars/pub/';

    const brandId = req.params.brandId;
    const groupId = req.params.groupId;

    const allData = await obtenerTodosLosModelos(apiUrl, ACCESSTOKEN, brandId, groupId);

    

    res.json({ modelos: allData });
  } catch (error) {
    console.error(`Error al obtener los modelos de la marca con ID ${req.params.brandId} y grupo con ID ${req.params.groupId}:`, error.message);
    res.status(500).json({ error: 'Error al obtener los modelos' });
  }
});


app.get('/obtener-precios/:codia', async (req, res) => {
  try {
    const apiUrl = 'https://api.infoauto.com.ar/cars/pub/';
    const codia = req.params.codia;

    const listPrice = await obtenerListPrice(apiUrl, ACCESSTOKEN, codia);

    res.json({ list_price: listPrice });
  } catch (error) {
    console.error(`Error al obtener el list_price del modelo con CODIA ${req.params.codia}:`, error.message);
    res.status(500).json({ error: 'Error al obtener el list_price' });
  }
});

async function obtenerTodasLasMarcas(apiUrl, ACCESSTOKEN) {
  let allData = [];
  let page = 1;
  let totalPages = 1;

  // Función para obtener datos de una página específica
  async function obtenerDatosDePagina(page) {
    try {
      const response = await axios.get(`${apiUrl}/brands?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${ACCESSTOKEN}`
        }
      });

      return response.data.map(marca => ({
        BrandsId: marca.id,
        NombreMarca: marca.name
      }));
    } catch (error) {
      console.error(`Error al obtener la página ${page} de marcas:`, error.message);
      throw error;
    }
  }

  // Realizar solicitudes en paralelo usando Promise.all
  while (page <= totalPages) {
    const promises = [];
    for (let i = 0; i < 20; i++) {  // Hasta 20 solicitudes en paralelo
      promises.push(obtenerDatosDePagina(page));
      page++;
    }

    const pagesData = await Promise.all(promises);
    allData = allData.concat(...pagesData);

    if (page === 1) {
      // Establecer el número total de páginas en la primera iteración
      totalPages = pagesData[0].totalPages;
    }
  }

  return allData;
}

async function obtenerTodosLosGrupos(apiUrl, ACCESSTOKEN, brandId) {
  let allData = [];
  let page = 1;
  let totalPages = 1;

  // Función para obtener datos de una página específica
  async function obtenerDatosDePagina(page) {
    try {
      const response = await axios.get(`${apiUrl}/brands/${brandId}/groups?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${ACCESSTOKEN}`
        }
      });

      return response.data.map(grupo => ({
        GroupId: grupo.id,
        NombreGrupo: grupo.name
      }));
    } catch (error) {
      console.error(`Error al obtener la página ${page} de grupos:`, error.message);
      throw error;
    }
  }

  // Realizar solicitudes en paralelo usando Promise.all
  while (page <= totalPages) {
    const promises = [];
    for (let i = 0; i < 20; i++) {  // Hasta 20 solicitudes en paralelo
      promises.push(obtenerDatosDePagina(page));
      page++;
    }

    const pagesData = await Promise.all(promises);
    allData = allData.concat(...pagesData);

    if (page === 1) {
      // Establecer el número total de páginas en la primera iteración
      totalPages = pagesData[0].totalPages;
    }
  }

  return allData;
}

async function obtenerTodosLosModelos(apiUrl, ACCESSTOKEN, brandId, groupId) {
  let allData = [];
  let page = 1;
  let totalPages = 1;

  // Función para obtener datos de una página específica
  async function obtenerDatosDePagina(page) {
    try {
      const response = await axios.get(`${apiUrl}/brands/${brandId}/groups/${groupId}/models?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${ACCESSTOKEN}`
        }
      });

      return response.data.map(modelo => ({
        codia: modelo.codia,
        description: modelo.description
      }));
    } catch (error) {
      console.error(`Error al obtener la página ${page} de modelos:`, error.message);
      throw error;
    }
  }

  // Realizar solicitudes en paralelo usando Promise.all
  while (page <= totalPages) {
    const promises = [];
    for (let i = 0; i < 20; i++) {  // Hasta 20 solicitudes en paralelo
      promises.push(obtenerDatosDePagina(page));
      page++;
    }

    const pagesData = await Promise.all(promises);
    allData = allData.concat(...pagesData);

    if (page === 1) {
      // Establecer el número total de páginas en la primera iteración
      totalPages = pagesData[0].totalPages;
    }
  }

  return allData;
}

async function obtenerListPrice(apiUrl, ACCESSTOKEN, codia) {
  try {
    const response = await axios.get(`${apiUrl}/models/${codia}/list_price`, {
      headers: {
        'Authorization': `Bearer ${ACCESSTOKEN}`
      }
    });

    return response.data.list_price*1000;
  } catch (error) {
    console.error(`Error al obtener el list_price del modelo con CODIA ${codia}:`, error.message);
    throw error;
  }
}


app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
