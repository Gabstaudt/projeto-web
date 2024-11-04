const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Usar CORS
app.use(cors());

// Caminho dos arquivos de resposta (remova o segundo 'backend')
const resposta1Path = path.join(__dirname, 'resposta (4).bin');
const resposta2Path = path.join(__dirname, 'respostadaterceira (7).bin');

// Função para verificar e ler o arquivo de forma isolada
function testarLeituraArquivo(caminho) {
  fs.readFile(caminho, (err, data) => {
    if (err) {
      console.error(`Erro ao ler o arquivo ${caminho}:`, err.message);
    } else {
      console.log(`Arquivo ${caminho} lido com sucesso.`);
    }
  });
}

// Testa a leitura dos arquivos no início para verificar se o caminho está correto
testarLeituraArquivo(resposta1Path);
testarLeituraArquivo(resposta2Path);

// Rota para enviar o conteúdo de 'resposta (4).bin'
app.get('/resposta1', (req, res) => {
  fs.readFile(resposta1Path, (err, data) => {
    if (err) {
      console.error(`Erro ao ler o arquivo resposta (4).bin:`, err.message);
      res.status(500).send('Erro ao ler o arquivo resposta (4).bin');
      return;
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(data);
  });
});

// Rota para enviar o conteúdo de 'respostadaterceira (7).bin'
app.get('/resposta2', (req, res) => {
  fs.readFile(resposta2Path, (err, data) => {
    if (err) {
      console.error(`Erro ao ler o arquivo respostadaterceira (7).bin:`, err.message);
      res.status(500).send('Erro ao ler o arquivo respostadaterceira (7).bin');
      return;
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(data);
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
