import { config } from "dotenv";
import express from 'express';
import RotasUnidades from './routes/ubs.js';
import RotasCadUsuario from './routes/usuario.js'
import cors from "cors";

config() // Carrega as variáveis do .env 

const app = express()
const { PORT } = process.env

// Habilita o CORS Cross-Origin resource sharing
app.use(cors())

app.use(express.json()) // Habilita o parse do JSON

// Rota de conteúdo público
app.use('/', express.static('public'))

// Removendo o X-Powered-By por segurança
app.disable('x-powered-by')

// Configurando o favicon
app.use('/favicon.ico', express.static('./public/img/logo_sus_contata.svg'))

// Rota default
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'API SUS-Contata (Cadastro de UBS)',
        version: '1.0.0'
    })
})

// Listen
app.listen(PORT, function () {
    console.log(`💻 Servidor rodando em http://localhost:${PORT}`);
})

// Rotas da API
app.use('/api/unidades', RotasUnidades)
app.use('/api/usuario', RotasCadUsuario) // Aqui está correto
