const urlBase = 'http://localhost:4000/api'

async function carregaUnidades() {
    const tabela = document.getElementById('dadosTabela')
    tabela.innerHTML = '' // Limpa antes de carregar
    // Faremos a requisição GET para a nossa API REST
    await fetch(`${urlBase}/unidades`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            // console.table(data)
            data.forEach(unidade => {
                tabela.innerHTML += `
            <tr>
                <td>${unidade.nomeUnidade}</td>
                <td>${unidade.endereco.logradouro}, ${unidade.endereco.numero}, ${unidade.endereco.bairro}, ${unidade.endereco.localidade}/${unidade.endereco.uf} - ${unidade.cep}</td>
                <td>${new Date(unidade.datacadastro)}</td>
                <td>${unidade.localizacao.coordinates[0]} / ${unidade.localizacao.coordinates[1]}</td>
                <td><button class="btn btn-danger btn-sm" onclick='removeUnidade("${unidade._id}")'>🗑 Excluir</button></td>
            </tr>
            `
            });
        })

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
            }
        })
}