const http = require('http');

const hostname = '127.0.0.1';
const port = 8081;

const ValveChainApplication = require('./fabric_application/valvechain_application.js');

const express = require('express');
const appExpress = express();

appExpress.use(express.urlencoded({ extended: true }));

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end();
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

appExpress.get('/cree_vanne', function(req, res) {
    res.send(`
      <html>
        <head>
          <title>Formulaire de Vanne</title>
        </head>
        <body>
          <form action="/" method="post">
            <div>
              <label for="vanne_id">ID :</label>
              <input type="text" id="vanne_id" name="vanne_id" />
            </div>
            <div>
              <label for="name">Nom :</label>
              <input type="text" id="name" name="name" />
            </div>
            <div>
              <label for="description">Description :</label>
              <input type="text" id="description" name="description" />
            </div>
            <div>
              <label for="position_a">Position vanne attendue :</label>
              <input type="text" id="position_a" name="position_a" />
            </div>
            <div>
              <label for="temp_attendue">Température attendue (aval):</label>
              <input type="text" id="temp_attendue" name="temp_attendue" />
            </div>
            <div>
              <label for="name_groupe">Nom de groupe :</label>
              <input type="text" id="name_groupe" name="name_groupe" />
            </div>
            <div>
              <label for="groupe_localisation">Localisation du groupe :</label>
              <input type="text" id="groupe_localisation" name="groupe_localisation" />
            </div>
            <button type="submit">Soumettre</button>
          </form>
        </body>
      </html>
    `);
});


appExpress.post('/cree_vanne', async (req, res) => {
    const vanne_id = req.body.vanne_id;
    const name = req.body.name;
    const description = req.body.description;
    const position_a = req.body.position_a;
    const temp_attendue = req.body.temp_attendue;
    const name_groupe = req.body.name_groupe;
    const groupe_localisation = req.body.groupe_localisation;
  
    try {
        const app = new ValveChainApplication();
        await app.initialize();
        await app.createVanne(
            vanne_id,
            name,
            description,
            "",
            position_a,
            "",
            "",
            temp_attendue,
            name_groupe,
            groupe_localisation
        );
        await app.gateway.disconnect();
        res.send('Vanne créée avec succès !');
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
    }
});
/*

async function main() {
    const app = new ValveChainApplication();
    try {
        await app.initialize();

        await app.createVanne('1', 'ABP 116 VL', 'Réglante secours condensats ABP 302 RE', '', 'F', '', '', '30', 'M2C17', 'entre les pompes CVI 001 à 004 PO et le condenseur. (M2C17)');
        await app.createVanne('2', 'ABP 117 VL', 'Réglante secours condensats ABP 301 RE', '', 'F', '', '', '30', 'M2C17', 'entre les pompes CVI 001 à 004 PO et le condenseur. (M2C17)');
        await app.createVanne('3', 'ABP 118 VL', 'Soupape de sûreté condensats ABP 302 RE', 'S.O', 'I', '', '', '30', 'M2C17', 'entre les pompes CVI 001 à 004 PO et le condenseur. (M2C17)');

        await app.getVanneById('1');
        await app.getVanneById('2');
        await app.getVanneById('3');

        console.log('==================================');

        await app.getVanneByName('ABP 116 VL');
        await app.getVanneByName('ABP 118 VL');

        console.log('==================================');

        await app.getVannesByGroupName('M2C17');

        console.log('==================================');

        const vanne_update_data = { "temp_relevee_amont": "28.1" }
        await app.updateVanne('1', vanne_update_data);
        await app.getVanneById('1');

        console.log('==================================');

        await app.getAllVannes();

    } finally {
        await app.disconnect();
    }
}

main();*/