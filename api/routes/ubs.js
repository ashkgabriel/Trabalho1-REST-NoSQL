import express from "express";
import { check, validationResult } from "express-validator";
import { connectToDatabase } from "../utils/mongodb.js";
import auth from '../middleware/auth.js'

const router = express.Router()
const { db, ObjectId } = await connectToDatabase()
const nomeCollection = 'unidades'

const validaUnidade = [
    check('nomeUnidade')
        .custom(async (nomeUnidade, { req }) => {
            const contaUnidade = await db.collection(nomeCollection)
                .countDocuments({
                    'nomeUnidade': nomeUnidade,
                    '_id': { $ne: new ObjectId(req.body._id) } // Exclui o documento atual
                })
            if (contaUnidade > 0) {
                throw new Error('A unidade informada já está cadastrada.')
            }
        }),
    check('cep')
        .not().isEmpty().trim().withMessage('É obrigatório informar o CEP')
        .isNumeric().isInt({ min: 0 }).withMessage('O CEP deve conter apenas números e positivos')
        .isLength({ min: 8, max: 8 }).withMessage('O CEP informado é inválido'),

    check('endereco.logradouro')
        .notEmpty().withMessage('O preenchimento do logradouro é obrigatório')
        .isLength({ min: 5 }).withMessage('O campo de logradouro deve conter no mínimo 5 caracteres.')
        .isLength({ max: 200 }).withMessage('O campo de logradouro deve conter no máximo 200 caracteres.'),

    check('endereco.numero')
        .trim().notEmpty().withMessage('O preenchimento do campo número é obrigatório. Caso não possua, inserir o numeral zero.')
        .isNumeric().isInt({ min: 0}).withMessage('O campo de número deve ser preenchido com numerais inteiros e positivos.')
    ,

    check('endereco.bairro').notEmpty().withMessage('O preenchimento do campo bairro é obrigatório.'),

    check('endereco.uf').notEmpty().withMessage('O preenchimento do campo uf é obrigatório.'),

    check('dataCadastro').matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('O formato de data é inválido Informe no formato aaaa-mm-dd'),

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
*   GET /api/unidades/:id
*   Lista unidade localizada pelo ID
*/

router.get('/:id', auth, async (req, res) => {
    try {
        const docs = []
        await db.collection(nomeCollection)
            .find({ '_id': { $eq: new ObjectId(req.params.id) } }, {})
            .forEach((doc) => {
                docs.push(doc)
            })
        res.status(200).json(docs)
    } catch (err) {
        res.status(500).json({
            errors: [{
                value: `${err.message}`,
                msg: 'Erro ao obter o prestador pelo ID',
                param: '/:id'
            }]
        })
    }
})

/*
*   GET /api/unidades/filtrar-ubs/:filtro
*   Lista unidades filtradas de acordo com filtro selecionado
*/

router.get('/filtrar-ubs/:filtro', auth, async (req, res) => {
    try {
        const filtro = req.params.filtro.toString();
        const docs = [];
        await db.collection(nomeCollection)
            .find({
                $or: [
                    { 'nomeUnidade': { $regex: filtro, $options: 'i' } },
                    { 'endereco.bairro': { $regex: filtro, $options: 'i' } },
                    { 'cep': { $regex: filtro, $options: 'i' } }
                ]
            })
            .forEach((doc) => {
                docs.push(doc);
            });
        res.status(200).json(docs);
    } catch (err) {
        res.status(500).json({
            errors: [{
                value: `${err.message}`,
                msg: 'Erro ao obter a unidade pelo filtro desejado',
                param: '/filtrar-ubs/:filtro'
            }]
        });
    }
});

/*
*   GET /api/unidades/filtrar-ubs/:filtroData1/:filtroData2
*   Lista unidades filtradas de acordo com filtro selecionado
*/

router.get('/filtrar-ubs/:data1/:data2', auth, async (req, res) => {
    try {
        const data1 = req.params.data1;
        const data2 = req.params.data2;
        const docs = [];
        await db.collection(nomeCollection)
            .find({
                'dataCadastro': { $gte: new Date(data1), $lte: new Date(data2) }
            })
            .forEach((doc) => {
                docs.push(doc);
            });
        res.status(200).json(docs);
    } catch (err) {
        res.status(500).json({
            errors: [{
                value: `${err.message}`,
                msg: 'Erro ao obter as unidades pelo filtro de datas',
                param: '/filtrar-ubs/:data1/:data2'
            }]
        });
    }
});

/*
* POST /api/unidades
* Insere uma nova unidade de saúde
* Parametros: Objeto unidade
*/

router.post('/', auth, validaUnidade, async (req, res) => {
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

router.put('/:id', auth, async (req, res) => {
    const idDocumento = req.params.id;

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

router.delete('/:id', auth, async (req, res) => {
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