const urlBase = 'http://localhost:4000/api'
const resultadoModal = new bootstrap.Modal(document.getElementById('modalMensagem'))

function converterData(dataString) {
    if (typeof dataString === 'string' && dataString.trim().length > 0) {
        const data = new Date(dataString);
        if (!isNaN(data)) {
            return data;
        }
    }
    return null;
}

async function carregaUnidades() {
    const tabela = document.getElementById('dadosTabela');
    tabela.innerHTML = ''; // Limpa antes de carregar

    try {
        const response = await fetch(`${urlBase}/unidades`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar unidades');
        }

        const data = await response.json();

        data.forEach(unidade => {
            const dataCadastro = converterData(unidade.dataCadastro);
            if (dataCadastro) {
                const dataFormatada = `${dataCadastro.getDate().toString().padStart(2, '0')}-${(dataCadastro.getMonth() + 1).toString().padStart(2, '0')}-${dataCadastro.getFullYear()}`;
                tabela.innerHTML += `
                    <tr>
                        <td>${unidade.nomeUnidade}</td>
                        <td>${unidade.endereco.logradouro}, ${unidade.endereco.numero}, ${unidade.endereco.bairro}, ${unidade.endereco.localidade}/${unidade.endereco.uf} - ${unidade.cep}</td>
                        <td>${dataFormatada}</td>
                        <td>${unidade.localizacao.coordinates[0]} / ${unidade.localizacao.coordinates[1]}</td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick='removeUnidade("${unidade._id}")'>🗑 Excluir</button> 
                            <br> 
                            <button class="btn btn-success btn-sm" onclick="abrirModalEditar('${unidade._id}')">✏️ Editar</button>
                        </td>
                    </tr>
                `
            } else {
                console.error("Data inválida para unidade:", unidade);
            }
        });
    } catch (error) {
        console.error("Erro ao carregar unidades:", error);
    }
}


async function removeUnidade(id) {
    if (confirm('Deseja realmente excluir esta unidade?')) {
        await fetch(`${urlBase}/unidades/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.deletedCount > 0) {
                    carregaUnidades() // Atualizamos a UI
                }
            })
            .catch(error => {
                document.getElementById('mensagem').innerHTML = `Erro ao remover a unidade: ${error.message}`
                resultadoModal.show() // Exibe o modal com o erro
            })
    }

}

document.getElementById('formUnidades').addEventListener('submit', function (event) {
    event.preventDefault() // Evita o carregamento
    let unidade = {}

    unidade = {
        "nomeUnidade": document.getElementById('nome_unidade').value,
        "dataCadastro": document.getElementById('data-de-cadastro').value,
        "cep": document.getElementById('cep').value,
        "endereco": {
            "logradouro": document.getElementById('logradouro').value,
            "numero": document.getElementById('numero').value,
            "complemento": document.getElementById('complemento').value,
            "bairro": document.getElementById('bairro').value,
            "localidade": document.getElementById('localidade').value,
            "uf": document.getElementById('unidade-da-federacao').value
        },
        "localizacao": {
            "type": "Point",
            "coordinates": [
                document.getElementById('latitude').value,
                document.getElementById('longitude').value
            ]
        },
    } // Fim do objeto
    // alert(JSON.stringify(unidade)) // Apenas para testes
    salvaUnidade(unidade)
})

async function salvaUnidade(unidade) {
    await fetch(`${urlBase}/unidades`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(unidade)
    })
        .then(response => response.json())
        .then(data => {
            if (data.acknowledged) {
                alert('Unidade incluida com sucesso!')
                // Limpamos o formulário
                document.getElementById('formUnidades').reset()
                // Atualizamos a listagem
                carregaUnidades()
            } else if (data.errors) {
                const errorMessages = data.errors.map(error => error.msg).join('\n')

                document.getElementById('mensagem').innerHTML = `<span class="text-danger">${errorMessages}</span>`
                resultadoModal.show()
                console.log(errorMessages);
            }
        })
}
// Função para buscar uma unidade pelo ID
async function buscarUnidadePorId(id) {
    try {
        // Aqui você pode implementar a lógica para buscar a unidade com o ID fornecido
        // Por enquanto, vamos apenas retornar um objeto simulado para fins de demonstração
        const response = await fetch(`/api/unidades/${id}`); // Supondo que você tenha uma rota na sua API para buscar uma unidade por ID
        if (!response.ok) {
            throw new Error('Erro ao buscar unidade');
        }
        const unidade = await response.json();
        return unidade;
    } catch (error) {
        console.error('Erro ao buscar unidade:', error);
        throw error; // Propaga o erro para o chamador da função
    }
}


async function atualizaUnidade(idUnidade, dadosAtualizados) {
    try {
        const response = await fetch('/api/unidades', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...dadosAtualizados, _id: idUnidade })
        });
        if (!response.ok) {
            throw new Error('Erro ao atualizar a unidade de saúde');
        }
        const data = await response.json();
        console.log('Unidade atualizada com sucesso:', data);

    } catch (error) {
        console.error('Erro ao atualizar a unidade de saúde:', error.message);
    }
}

function abrirModalEditar(unidade) {
    // Preencher os campos do modal com as informações da unidade
    document.getElementById('editar_nome_unidade').value = unidade.nomeUnidade || '';
    document.getElementById('editar_data_de_cadastro').value = unidade.dataCadastro || '';
    document.getElementById('editar_cep').value = unidade.cep || '';

    // Verificar se o objeto endereco está definido
    if (unidade.endereco) {
        document.getElementById('editar_logradouro').value = unidade.endereco.logradouro || '';
        document.getElementById('editar_numero').value = unidade.endereco.numero || '';
        document.getElementById('editar_complemento').value = unidade.endereco.complemento || '';
        document.getElementById('editar_bairro').value = unidade.endereco.bairro || '';
        document.getElementById('editar_localidade').value = unidade.endereco.localidade || '';
        document.getElementById('editar_unidade_da_federacao').value = unidade.endereco.uf || '';
    }

    // Verificar se a propriedade localizacao está definida
    if (unidade.localizacao && unidade.localizacao.coordinates) {
        document.getElementById('editar_latitude').value = unidade.localizacao.coordinates[1] || '';
        document.getElementById('editar_longitude').value = unidade.localizacao.coordinates[0] || '';
    }

    // Abrir o modal de edição
    var modal = new bootstrap.Modal(document.getElementById('modalEditarUnidade'), {
        keyboard: false
    });
    modal.show();
}

function preencherModalEditar(unidade) {
    // Verificar se a unidade está definida
    if (unidade) {
        // Preencher os campos do modal com as informações da unidade
        document.getElementById('nome_unidade').value = unidade.nomeUnidade || '';
        document.getElementById('data-de-cadastro').value = unidade.dataCadastro || '';
        document.getElementById('cep').value = unidade.cep || '';
        document.getElementById('logradouro').value = (unidade.endereco && unidade.endereco.logradouro) || '';
        document.getElementById('numero').value = (unidade.endereco && unidade.endereco.numero) || '';
        document.getElementById('complemento').value = (unidade.endereco && unidade.endereco.complemento) || '';
        document.getElementById('bairro').value = (unidade.endereco && unidade.endereco.bairro) || '';
        document.getElementById('localidade').value = (unidade.endereco && unidade.endereco.localidade) || '';
        document.getElementById('unidade-da-federacao').value = (unidade.endereco && unidade.endereco.uf) || '';
        document.getElementById('latitude').value = (unidade.localizacao && unidade.localizacao.coordinates && unidade.localizacao.coordinates[0]) || '';
        document.getElementById('longitude').value = (unidade.localizacao && unidade.localizacao.coordinates && unidade.localizacao.coordinates[1]) || '';
    } else {
        console.error('Unidade não definida');
    }
}

