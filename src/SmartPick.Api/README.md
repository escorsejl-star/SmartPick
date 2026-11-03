# SmartPick.Api

Back-end do SmartPick feito em C# (.NET 8) com MySQL.

## Banco de dados

O script `banco/banco.sql` cria o banco `smartpick` com as tabelas e alguns dados de exemplo:

- `prateleiras` - prateleiras P1 a P6 e o corredor de cada uma
- `posicoes` - lugares de cada prateleira (nível 1 a 3, frente ou fundo) e se está ocupado
- `caixas` - produtos com peso, medidas e a posição onde estão guardados
- `pedidos` - pedidos de coleta
- `usuarios` - login do sistema

Rodar o script de novo apaga o banco e cria tudo do zero.

## Como rodar

Precisa ter o MySQL e o .NET 8 instalados.

1. Criar o banco:

```
mysql -u root -p < banco/banco.sql
```

2. Criar o arquivo `appsettings.Development.json` nesta pasta com a senha do seu MySQL (ele não vai pro git):

```json
{
  "ConnectionStrings": {
    "SmartPick": "Server=localhost;Port=3306;Database=smartpick;User=root;Password=SUA_SENHA"
  }
}
```

3. Rodar:

```
dotnet run
```

A API sobe em http://localhost:5000. Para ver se conectou no banco, abrir http://localhost:5000/status.

Usuários de teste: `GT-1001` e `OP-2847`, senha `1234`.
