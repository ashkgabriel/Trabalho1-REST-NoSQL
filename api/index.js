import { config } from "dotenv";
import express from 'express';
import RotasUnidades from './routes/ubs.js';
import RotasCadUsuario from './routes/usuario.js'
import cors from "cors";
import fs from 'fs'

import swaggerUI from "swagger-ui-express";

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


/* Rota da documentação Swagger */
const CSS_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

app.use(
    "/api/doc",
    swaggerUI.serve,
    swaggerUI.setup(
        JSON.parse(fs.readFileSync("./api/swagger/swagger_output.json")),
        {
            customCss:
                ".swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }",
            customCssUrl: CSS_URL,
        }
    )
)