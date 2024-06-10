const urlBase = window.location.href.replace(/\/[^\/]*$/, '') + '/api/usuario';

document.getElementById('formUsuario').addEventListener('submit', function (event) {
    event.preventDefault(); // Evita o recarregamento
    const msgModal = new bootstrap.Modal(document.getElementById('modalMensagem'));

    // Obtendo os dados do formulário
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('login').value;
    const senha = document.getElementById('senha').value;

    // Criando o objeto de inclusão
    const dadosUsuario = { nome: nome, email: email, senha: senha };

    // Efetuar o POST para o endpoint
    fetch(`${urlBase}/`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosUsuario)
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            return response.json();
        })
        .then(data => {
            // Verifica se o usuário foi cadastrado
            if (data.acknowledged) { // Se true, inseriu!
                document.getElementById('mensagem').innerHTML = `<span class='text-success'>Usuário criado com sucesso! <br> Por favor, efetue o login. </span>`;
                msgModal.show();
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 5000);
            } else if (data.errors) {
                // Vamos pegar os erros da API
                const errorMessages = data.errors.map(error => error.msg).join('<br>');
                // Alteramos a mensagem no modal
                document.getElementById('mensagem').innerHTML = `<span class='text-danger'>${errorMessages}</span>`;
                msgModal.show();
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('mensagem').innerHTML = `<span class='text-danger'>Erro ao tentar criar o usuário: ${error.message}</span>`;
            msgModal.show();
        });
});
