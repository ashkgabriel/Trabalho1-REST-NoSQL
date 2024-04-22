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
                        <td><button class="btn btn-danger btn-sm" onclick='removeUnidade("${unidade._id}")'>🗑 Excluir</button></td>
                    </tr>
                `;
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


