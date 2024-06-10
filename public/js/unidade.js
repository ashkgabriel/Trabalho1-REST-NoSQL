const urlBase = window.location.href.replace(/\/[^\/]*$/, '') + '/api'
const access_token = localStorage.getItem('token') || null
const resultadoModal = new bootstrap.Modal(document.getElementById('modalMensagem'));

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

    
        const response = await fetch(`${urlBase}/unidades`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access-token': access_token
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
                            <button class="btn btn-success btn-sm" onclick='abrirModalEditar("${unidade._id}")'>✏️ Editar</button>
                        </td>
                    </tr>
                `;
            } else {
                console.error("Data inválida para unidade:", unidade);
            }
        })
}

async function removeUnidade(id) {
    if (confirm('Deseja realmente excluir esta unidade?')) {
        await fetch(`${urlBase}/unidades/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'access-token': access_token
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.deletedCount > 0) {
                    carregaUnidades(); // Atualizamos a UI
                }
            })
            .catch(error => {
                document.getElementById('mensagem').innerHTML = `Erro ao remover a unidade: ${error.message}`;
                resultadoModal.show(); // Exibe o modal com o erro
            });
    }
}

document.getElementById('formUnidades').addEventListener('submit', function (event) {
    event.preventDefault(); // Evita o carregamento
    let unidade = {
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
        }
    }; // Fim do objeto
    salvaUnidade(unidade);
});

async function salvaUnidade(unidade) {
    await fetch(`${urlBase}/unidades`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access-token': access_token
        },
        body: JSON.stringify(unidade)
    })
        .then(response => response.json())
        .then(data => {
            if (data.acknowledged) {
                alert('Unidade incluída com sucesso!');
                // Limpamos o formulário
                document.getElementById('formUnidades').reset();
                // Atualizamos a listagem
                carregaUnidades();
            } else if (data.errors) {
                const errorMessages = data.errors.map(error => error.msg).join('\n');
                document.getElementById('mensagem').innerHTML = `<span class="text-danger">${errorMessages}</span>`;
                resultadoModal.show();
                console.log(errorMessages);
            }
        });
}

async function buscarUnidadePorId(id) {
    try {
        console.log(`Buscando unidade com ID: ${id}`); // Log para depuração
        const response = await fetch(`${urlBase}/unidades/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access-token': access_token
            }
        });
        if (!response.ok) {
            throw new Error(`Erro ao buscar unidade. Status: ${response.status}`);
        }
        const unidade = await response.json();
        console.log('Unidade encontrada:', unidade); // Log para depuração
        return unidade;
    } catch (error) {
        console.error('Erro ao buscar unidade:', error);
        throw error; // Propaga o erro para o chamador da função
    }
}

function preencherOpcoesUnidadeDaFederacao(opcoes) {
    const selectModal = document.getElementById('editar_unidade_da_federacao');
    // Limpa as opções existentes
    selectModal.innerHTML = '';
    // Adiciona as novas opções
    opcoes.forEach(opcao => {
        const option = document.createElement('option');
        option.value = opcao.textContent; // Use opcao.textContent
        option.textContent = opcao.textContent; // Use opcao.textContent
        selectModal.appendChild(option);
    });
}

async function abrirModalEditar(id) {
    try {
        console.log(`Abrindo modal para editar unidade com ID: ${id}`); // Log para depuração
        const unidade = await buscarUnidadePorId(id);

        if (unidade && unidade.length > 0) {
            preencherModalEditar(unidade[0]);
            const opcoesOriginal = Array.from(document.getElementById('unidade-da-federacao').options);
            preencherOpcoesUnidadeDaFederacao(opcoesOriginal);
            // Adicione este trecho para armazenar o ID da unidade na variável global
            idUnidadeEditada = id; // Supondo que idUnidadeEditada seja uma variável global
        } else {
            console.error('Unidade não encontrada ou lista vazia');
        }

        // Abrir o modal de edição
        const modal = new bootstrap.Modal(document.getElementById('modalEditarUnidade'), {
            keyboard: false
        });
        modal.show();
    } catch (error) {
        console.error('Erro ao abrir modal de edição:', error.message);
    }
}

function preencherModalEditar(unidade) {
    console.log(`Preenchendo modal com dados da unidade: ${unidade.nomeUnidade}`); // Log para depuração
    if (unidade) {
        document.getElementById('editar_nome_unidade').value = unidade.nomeUnidade || '';
        document.getElementById('editar_data_de_cadastro').value = unidade.dataCadastro ? new Date(unidade.dataCadastro).toISOString().split('T')[0] : '';
        document.getElementById('editar_cep').value = unidade.cep || '';
        if (unidade.endereco) {
            document.getElementById('editar_logradouro').value = unidade.endereco.logradouro || '';
            document.getElementById('editar_numero').value = unidade.endereco.numero || '';
            document.getElementById('editar_complemento').value = unidade.endereco.complemento || '';
            document.getElementById('editar_bairro').value = unidade.endereco.bairro || '';
            document.getElementById('editar_localidade').value = unidade.endereco.localidade || '';

            // Atualizar o campo select da Unidade da Federação
            const ufSelect = document.getElementById('editar_unidade_da_federacao');
            const ufs = ufSelect.options;
            console.log("Valor da UF na unidade:", unidade.endereco.uf);
            for (let i = 0; i < ufs.length; i++) {
                console.log("Comparando com a opção:", ufs[i].value);
                if (ufs[i].value === unidade.endereco.uf) {
                    console.log("Encontrado valor correspondente. Definindo como selecionado.");
                    ufs[i].selected = true; // Definir a opção como selecionada se corresponder ao valor existente na unidade
                    break;
                }
            }
        }
        if (unidade.localizacao && unidade.localizacao.coordinates) {
            document.getElementById('editar_latitude').value = unidade.localizacao.coordinates[1] || '';
            document.getElementById('editar_longitude').value = unidade.localizacao.coordinates[0] || '';
        }
    } else {
        console.error('Unidade não definida');
    }
}

document.getElementById('btnSalvarAlteracoes').addEventListener('click', function (event) {
    event.preventDefault(); // Evita o envio do formulário (comportamento padrão do botão de envio)

    // Reúne os dados dos campos do modal editar
    let unidadeAtualizada = {
        "nomeUnidade": document.getElementById('editar_nome_unidade').value,
        "dataCadastro": document.getElementById('editar_data_de_cadastro').value,
        "cep": document.getElementById('editar_cep').value,
        "endereco": {
            "logradouro": document.getElementById('editar_logradouro').value,
            "numero": document.getElementById('editar_numero').value,
            "complemento": document.getElementById('editar_complemento').value,
            "bairro": document.getElementById('editar_bairro').value,
            "localidade": document.getElementById('editar_localidade').value,
            "uf": document.getElementById('editar_unidade_da_federacao').value
        },
        "localizacao": {
            "type": "Point",
            "coordinates": [
                document.getElementById('editar_longitude').value,
                document.getElementById('editar_latitude').value
            ]
        },
        "_id": idUnidadeEditada // Usando o ID armazenado na variável global
    };
    console.log(unidadeAtualizada._id);
    // Chama a função para atualizar a unidade
    atualizarUnidade(unidadeAtualizada);
});


async function atualizarUnidade(unidadeAtualizada) {
    const unidadeAtualizadaSemId = { ...unidadeAtualizada };
    delete unidadeAtualizadaSemId._id;

    try {
        const response = await fetch(`${urlBase}/unidades/${unidadeAtualizada._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'access-token': access_token
            },
            body: JSON.stringify(unidadeAtualizadaSemId)
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar unidade');
        }

        const data = await response.json();
        console.log('Unidade atualizada:', data); // Log para depuração

        // Fechar o modal após a atualização bem-sucedida, se necessário
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarUnidade'));
        if (modal) {
            modal.hide();
        }

        // Atualizar a listagem de unidades
        carregaUnidades();
    } catch (error) {
        console.error('Erro ao atualizar unidade:', error.message);
    }
}

// Adicione um ouvinte de evento para o botão de busca
document.getElementById('search-button').addEventListener('click', async () => {
    try {
        // Obtém o valor do filtro do input
        const filtro = document.getElementById('filtroInput').value;

        // Faz a requisição GET para o endpoint de filtragem
        const response = await fetch(`${urlBase}/unidades/filtrar-ubs/${filtro}`);

        // Verifica se a requisição foi bem-sucedida
        if (response.ok) {
            // Converte a resposta para JSON
            const unidades = await response.json();
            // Atualiza a tabela com as unidades filtradas
            atualizaTabela(unidades);
        } else {
            // Se a resposta não foi bem-sucedida, lança um erro
            throw new Error('Erro ao buscar unidades');
        }
    } catch (error) {
        // Em caso de erro, exibe uma mensagem de erro
        console.error('Erro ao buscar unidades:', error);
        // Ou realize qualquer outra ação que desejar em caso de erro
    }
});

document.getElementById('search-button2').addEventListener('click', async () => {
    try {
        // Obtém os valores dos filtros de data
        const data1 = document.getElementById('filtroData1').value;
        const data2 = document.getElementById('filtroData2').value;

        // Faz a requisição GET para o endpoint de filtragem com datas
        const response = await fetch(`${urlBase}/unidades/filtrar-ubs/${data1}/${data2}`);

        // Verifica se a requisição foi bem-sucedida
        if (response.ok) {
            // Converte a resposta para JSON
            const unidades = await response.json();
            // Atualiza a tabela com as unidades filtradas
            atualizaTabela(unidades);
        } else {
            // Se a resposta não foi bem-sucedida, lança um erro
            throw new Error('Erro ao buscar unidades');
        }
    } catch (error) {
        // Em caso de erro, exibe uma mensagem de erro
        console.error('Erro ao buscar unidades:', error);
        // Ou realize qualquer outra ação que desejar em caso de erro
    }
});

function atualizaTabela(unidades) {
    const tabela = document.getElementById('dadosTabela');
    tabela.innerHTML = ''; // Limpa antes de carregar

    unidades.forEach(unidade => {
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
                        <button class="btn btn-success btn-sm" onclick='abrirModalEditar("${unidade._id}")'>✏️ Editar</button>
                    </td>
                </tr>
            `;
        } else {
            console.error("Data inválida para unidade:", unidade);
        }
    });
}
