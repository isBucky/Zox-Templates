# Zox Templates & Resources

Este repositório tem o intuito de hospedar os modelos e recursos utilizados pelo CLI [**Zox-CLI**](https://github.com/isBucky/Zox-CLI).

Todos são bem-vindos para contribuir e compartilhar suas opiniões.

**Video exemplo de como é executado:**

<a href="https://www.youtube.com/watch?v=3RJRx2JZ5vE&ab_channel=BuckyDeveloper">
    <img src="https://img.youtube.com/vi/3RJRx2JZ5vE/maxresdefault.jpg" width="500" alt="Exemplo de Uso">></img>
</a>

## Templates (Modelos)

Os modelos são responsáveis por construir a base do projeto, simplificando a configuração de novos projetos.

Para criar um modelo, o processo é bastante simples: basta criar uma pasta no diretório [**Template**](https://github.com/isBucky/Zox-Templates/tree/main/templates/) com o nome desejado para o seu modelo. Feito isso, basta adicionar os seus arquivos ou pastas, e o template estará disponível para uso no **Zox**.

## Resources (Recursos)

Os recursos são elementos que podem ser integrados a qualquer sistema ou projeto de forma modular, evitando a inclusão desnecessária de componentes no início do desenvolvimento. Eles são adicionados conforme a necessidade, mantendo o projeto mais organizado.

Para criar um recurso, o processo é semelhante ao dos [Templates](#templates-modelos): basta criar uma pasta no diretório [Resources](https://github.com/isBucky/Zox-Templates/tree/main/resources) com o nome desejado. Em seguida, adicione seus arquivos ou pastas dentro dessa nova pasta, e eles estarão automaticamente prontos para uso no **Zox**.

## Configurações

Você pode configurar seus modelos e recursos por meio de um arquivo chamado **config-zox.json**. Com ele, é possível criar pastas vazias, modificar o **package.json** (como adicionar scripts, pacotes novos e pacotes de desenvolvimento) e definir valores padrão no `.env`.

Ao criar o arquivo **config-zox.json**, siga as seguintes instruções:

> Caso você estiver usando o **Visual Studio Code**, poderá usar o comando `,config` que criará automaticamente.

```json
{
    "$schema": "../../config-schema.json"
}
```

Dessa forma, o arquivo JSON seguirá um schema que orienta a implementação correta.
