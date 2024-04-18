import express from "express";
import { check, validationResult } from "express-validator";
import { connectToDatabase } from "../utils/mongodb.js";

const router = express.Router()
const { db, ObjectId } = await connectToDatabase()
const nomeCollection = 'unidades'

const validaUnidade = [
    // check('nomeUnidade')
    //     .custom(),
    check('cep')
        .not().isEmpty().trim().withMessage('É obrigatório informar o CEP')
        .isNumeric().withMessage('O CEP deve conter apenas números')
        .isLength({ min: 8, max: 8 }).withMessage('O CEP informado é inválido'),

    check('endereco.logradouro')
        .notEmpty().withMessage('O preenchimento do logradouro é obrigatório')
        .isLength({ min: 5 }).withMessage('O campo de logradouro deve conter no mínimo 5 caracteres.')
        .isLength({ max: 200 }).withMessage('O campo de logradouro deve conter no máximo 200 caracteres.'),

    check('endereco.numero')
        .trim().notEmpty().withMessage('O preenchimento do campo número é obrigatório. Caso não possua, inserir o numeral zero.')
        .isNumeric().isInt().withMessage('O campo de número deve ser preenchido com numerais inteiros.')
    ,

    check('endereco.bairro').notEmpty().withMessage('O preenchimento do campo bairro é obrigatório.'),

    check('endereco.uf').notEmpty().withMessage('O preenchimento do campo uf é obrigatório.'),

    check('dataCadastro').matches(/^\d{2}-\d{2}-\d{4}$/)
        .withMessage('O formato de data é inválido Informe no formato dd-mm-aaaa'),

    check('localizacao.type').equals('Point').withMessage('Tipo inválido'),

    check('localizacao.coordinates').isArray().withMessage('Coordenadas inválidas.'),

    check('localizacao.coordinates.*').isFloat()
        .withMessage('Os valores das coordenadas devem ser números.')
]

/*
* GET /api/unidades
*Lista todas as unidades de saúde
*/

router.get('/', async (req, res) => {
    const { limit, skip, order } = req.query // Obter da URL

    try {
        const docs = []
        await db.collection(nomeCollection)
            .find()
            .limit(parseInt(limit) || 10)
            .skip(parseInt(skip) || 0)
            .sort({ order: 1 })
            .forEach((doc) => {
                docs.push(doc)
            })
        res.status(200).json(docs)
    } catch (err) {
        res.status(500).json(
            {
                message: 'Erro ao obter a listagem das unidades de saúde',
                error: `${err.message}`
            }
        )
    }
})

/*
* POST /api/unidades
* Insere uma nova unidade de saúde
* Parametros: Objeto unidade
*/

router.post('/', validaUnidade, async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const unidade =
            await db.collection(nomeCollection).insertOne(req.body)
        res.status(201).json(unidade) // 201 é o status created
    } catch (err) {
        res.status(500).json({ message: `${err.message} Server Error.` })
    }
})

/*
* PUT /api/unidades
* Altera as informações de uma unidade de saúde
* Parametros: Objeto unidade
*/

router.put('/', validaUnidade, async (req, res) => {
    let idDocumento = req.body._id
    delete req.body._id
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const unidade = await db.collection(nomeCollection)
            .updateOne({ '_id': { $eq: new ObjectId(idDocumento) } },
                { $set: req.body })
        res.status(202).json(unidade)
    } catch (err) {
        res.status(500).json({ errors: err.message })
    }
})

/*
* DELETE /api/unidades/:id
* Deleta a unidade de saúde pelo ID
* Parametros: ID
*/

router.delete('/:id', async (req, res) => {
    const result = await db.collection(nomeCollection).deleteOne({
        '_id': { $eq: new ObjectId(req.params.id) }
    })
    if (result.deletedCount === 0) {
        res.status(404).json({
            errors: [{
                value: `Não há nenhuma unidade de saúde com o ID ${req.params.id}`,
                msg: 'Erro ao excluir a unidade de saúde.',
                param: '_id'
            }]
        })
    } else {
        res.status(200).send(result)
    }
})

export default router