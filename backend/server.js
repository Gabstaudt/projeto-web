const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Usar CORS
app.use(cors());

// Middleware para receber dados binários (array de bytes)
app.use(bodyParser.raw({ type: 'application/octet-stream' }));

// Rota para /login que recebe o array de bytes
app.post('/login', (req, res) => {
  const receivedBytes = req.body;

  // Exibir todos os bytes recebidos
  console.log('Array de bytes recebido:', Array.from(receivedBytes).map(byte => byte.toString(16).padStart(2, '0')).join(' '));

  // Decodificar os bytes para string
  const decodedString = new TextDecoder().decode(receivedBytes);
  console.log('String decodificada:', decodedString);

  // Lógica para processar os bytes e extrair o GadjetID
  const gadjetIDLength = 16; // Definir o tamanho do GadjetID
  const gadjetIDBytes = receivedBytes.slice(receivedBytes.length - gadjetIDLength);
  const gadjetID = new TextDecoder().decode(gadjetIDBytes); // Decodifica para string

  console.log('GadjetID recebido:', gadjetID);

  const response = {
    respostaOK: 1,
    IdUsuario: 101, //lógica para retornar o ID do usuário
    PrivilegioUsuario: 2,
    UnidadeUsuario: 3,
    AcessoProducao: 1,
    AcessoEmpresa1: 1,
    AcessoEmpresa2: 0,
    SessaoID: "abc123xyz" // gerar um ID de sessão real
  };

  res.json(response);
});

// tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
