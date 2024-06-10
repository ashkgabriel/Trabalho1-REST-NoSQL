const request = require('supertest')
const dotenv = require('dotenv')
dotenv.config() //carrega as variáveis do .env

const baseURL = 'http://localhost:4000/api'

describe('API REST de unidades sem o Token', () => {
    it('GET / - Lista todas as unidades sem o token', async () => {
        const response = await request(baseURL)
            .get('/unidades')
            .set('Content-Type', 'application/json')
            .expect(401) //Unauthorized
    })

    it('GET / Obtém a unidade pelo ID sem o token', async () => {
        const id = '66396fb6a02f8ca0a8c5f60d'
        const response = await request(baseURL)
            .get(`/unidades/${id}`)
            .set('Content-Type', 'application/json')
            .expect(401) //Unauthorized
    })

    it('GET / Obtém a unidade pelo nome sem o token', async () => {
        const nomeUnidade = 'Serr'
        const response = await request(baseURL)
            .get(`/unidades/filtrar-ubs/${razao}`)
            .set('Content-Type', 'application/json')
            .expect(401) //Unauthorized
    })
})

describe('API REST de unidades com o token', () => {
    let token //Armazenaremos o access_token JWT
    it('POST - Autenticar usuário para retornar token JWT', async () => {
        const senha = process.env.SENHA_USUARIO
        const response = await request(baseURL)
            .post('/usuario/login')
            .set('Content-Type', 'application/json')
            .send({ "email": "gabriel@teste2.com", "senha": senha })
            .expect(200) //OK

        token = response.body.access_token
        expect(token).toBeDefined() // Recebemos o token?
    })

    it('GET - Listar as unidades com autenticação', async () => {
        const response = await request(baseURL)
            .get('/unidades')
            .set('Content-Type', 'application/json')
            .set('access-token', token) //Inclui o token na chamada
            .expect(200)

        const unidades = response.body
        expect(unidades).toBeInstanceOf(Array)
    })

    dadosUnidade = {
        "nomeUnidade": "UBS - Jardim Serranoo",
        "dataCadastro": "2024-08-04",
        "cep": "18115550",
        "endereco": {
            "logradouro": "R.Francisco Lopes de Almeida",
            "numero": 76,
            "complemento": "",
            "bairro": "Jardim Palmira",
            "localidade": "Votorantim",
            "uf": "SP"
        },
        "localizacao": {
            "type": "Point",
            "coordinates": [-23.55866, -47.45476]
        }
    }

    it('POST - Inclui uma nova unidade com autenticação', async () => {
        const response = await request(baseURL)
            .post('/unidades')
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .send(dadosUnidade)
            .expect(201) //Created

        expect(response.body).toHaveProperty('acknowledged')
        expect(response.body.acknowledged).toBe(true)

        expect(response.body).toHaveProperty('insertedId')
        expect(typeof response.body.insertedId).toBe('string')
        idUnidadeInserida = response.body.insertedId
        expect(response.body.insertedId.length).toBeGreaterThan(0)
    })

    it('GET /:id - Lista a unidade pelo id com token', async () => {
        const response = await request(baseURL)
            .get(`/unidades/id/${idUnidadeInserida}`)
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .expect(200)
    })

    it('GET /:nomeUnidade - Lista a unidade pelo nome com token', async () => {
        const response = await request(baseURL)
            .get(`/unidades/filtrar-ubs/${dadosUnidade.nomeUnidade}`)
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .expect(200)
    })

    it('PUT - Altera os dados da unidade', async () => {
        novoDadosUnidade = {
            ...dadosUnidade, //spread operator
            '_id': idUnidadeInserida
        }
        novoDadosUnidade.nomeUnidade += ' alterado'
        const response = await request(baseURL)
            .put('/unidades')
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .send(novoDadosUnidade)
            .expect(202) //Accepted

        expect(response.body).toHaveProperty('acknowledged')
        expect(response.body.acknowledged).toBe(true)

        expect(response.body).toHaveProperty('modifiedCount')
        expect(typeof response.body.modifiedCount).toBe('number')
        expect(response.body.modifiedCount).toBeGreaterThan(0)
    })

    it('DELETE - Remove a unidade', async () => {
        const response = await request(baseURL)
            .delete(`/unidades/${idUnidadeInserida}`)
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .expect(200)

        expect(response.body).toHaveProperty('acknowledged')
        expect(response.body.acknowledged).toBe(true)

        expect(response.body).toHaveProperty('deletedCount')
        expect(typeof response.body.deletedCount).toBe('number')
        expect(response.body.deletedCount).toBeGreaterThan(0)
    })

})