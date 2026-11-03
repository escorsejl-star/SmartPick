using Dapper;
using MySqlConnector;
using Microsoft.Extensions.FileProviders;
using SmartPick.Api.Modelos;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(opcoes =>
    opcoes.AddDefaultPolicy(politica => politica.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

DefaultTypeMap.MatchNamesWithUnderscores = true;

var conexao = builder.Configuration.GetConnectionString("SmartPick");

MySqlConnection AbrirConexao() => new MySqlConnection(conexao);

var raiz = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", ".."));
var pastaFront = Directory.Exists(Path.Combine(raiz, "frontend")) ? Path.Combine(raiz, "frontend") : raiz;
if (File.Exists(Path.Combine(pastaFront, "index.html")))
{
    var arquivosFront = new PhysicalFileProvider(pastaFront);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = arquivosFront });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = arquivosFront,
        OnPrepareResponse = contexto => contexto.Context.Response.Headers.CacheControl = "no-cache"
    });
}

app.MapPost("/login", async (PedidoLogin pedido) =>
{
    if (string.IsNullOrWhiteSpace(pedido.Usuario) || string.IsNullOrWhiteSpace(pedido.Senha))
        return Results.BadRequest(new { erro = "Preencha o ID e a senha!" });

    using var db = AbrirConexao();
    var usuario = await db.QuerySingleOrDefaultAsync<Usuario>(
        @"SELECT id, login, nome, perfil FROM usuarios
          WHERE login = @Usuario AND senha_hash = SHA2(@Senha, 256)",
        pedido);

    if (usuario == null)
        return Results.Json(new { erro = "ID ou senha incorretos." }, statusCode: 401);
    if (pedido.Perfil != "" && pedido.Perfil != usuario.Perfil)
        return Results.Json(new { erro = $"Este usuário não tem acesso como {pedido.Perfil}." }, statusCode: 403);

    return Results.Ok(usuario);
});

app.MapGet("/status", async () =>
{
    using var db = AbrirConexao();
    var prateleiras = await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM prateleiras");
    var posicoes = await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM posicoes");
    var caixas = await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM caixas");
    return Results.Ok(new { banco = "ok", prateleiras, posicoes, caixas });
});

app.MapPost("/caixas", async (NovaCaixa nova) =>
{
    var erro = nova.Validar();
    if (erro != null)
        return Results.BadRequest(new { erro });

    using var db = AbrirConexao();
    try
    {
        var id = await db.ExecuteScalarAsync<int>(
            @"INSERT INTO caixas (codigo, descricao, categoria, quantidade, minimo, ean,
                                  peso_kg, altura_cm, largura_cm, profundidade_cm)
              VALUES (NULLIF(@Codigo, ''), @Descricao, NULLIF(@Categoria, ''), @Quantidade, @Minimo, NULLIF(@Ean, ''),
                      @PesoKg, @AlturaCm, @LarguraCm, @ProfundidadeCm);
              SELECT LAST_INSERT_ID();",
            nova);

        var caixa = await db.QuerySingleAsync<Caixa>("SELECT * FROM caixas WHERE id = @id", new { id });
        return Results.Created($"/caixas/{id}", caixa);
    }
    catch (MySqlException e) when (e.ErrorCode == MySqlErrorCode.DuplicateKeyEntry)
    {
        return Results.BadRequest(new { erro = "Já existe uma caixa com esse código." });
    }
});

app.MapGet("/caixas", async () =>
{
    using var db = AbrirConexao();
    var caixas = await db.QueryAsync<Caixa>("SELECT * FROM caixas ORDER BY id");
    return Results.Ok(caixas);
});

app.MapGet("/posicoes/disponiveis", async (int? nivel, int? profundidade) =>
{
    if (nivel is < 1 or > 3)
        return Results.BadRequest(new { erro = "O nível precisa ser 1, 2 ou 3." });
    if (profundidade is < 1 or > 2)
        return Results.BadRequest(new { erro = "A profundidade precisa ser 1 (frente) ou 2 (fundo)." });

    using var db = AbrirConexao();
    var posicoes = await db.QueryAsync<PosicaoDisponivel>(
        @"SELECT po.id, po.codigo, pr.codigo AS prateleira, pr.corredor,
                 po.nivel, po.profundidade, po.restrita
          FROM posicoes po
          JOIN prateleiras pr ON pr.id = po.prateleira_id
          WHERE po.ocupada = FALSE
            AND (@nivel IS NULL OR po.nivel = @nivel)
            AND (@profundidade IS NULL OR po.profundidade = @profundidade)
          ORDER BY po.id",
        new { nivel, profundidade });

    return Results.Ok(posicoes);
});

app.MapPost("/armazenar", async (PedidoArmazenar pedido) =>
{
    using var db = AbrirConexao();
    await db.OpenAsync();

    var caixa = await db.QuerySingleOrDefaultAsync<Caixa>(
        "SELECT * FROM caixas WHERE id = @CaixaId", pedido);
    if (caixa == null)
        return Results.NotFound(new { erro = "Caixa não encontrada." });
    if (caixa.PosicaoId != null)
        return Results.BadRequest(new { erro = "Esta caixa já está armazenada." });

    var posicao = await db.QuerySingleOrDefaultAsync<Posicao>(
        "SELECT * FROM posicoes WHERE id = @PosicaoId", pedido);
    if (posicao == null)
        return Results.NotFound(new { erro = "Posição não encontrada." });
    if (posicao.Ocupada)
        return Results.BadRequest(new { erro = "Esta posição já está ocupada." });

    using var transacao = await db.BeginTransactionAsync();
    await db.ExecuteAsync(
        "UPDATE caixas SET posicao_id = @PosicaoId WHERE id = @CaixaId", pedido, transacao);
    await db.ExecuteAsync(
        "UPDATE posicoes SET ocupada = TRUE WHERE id = @PosicaoId", pedido, transacao);
    await transacao.CommitAsync();

    return Results.Ok(new
    {
        mensagem = $"Caixa {caixa.Id} armazenada na posição {posicao.Codigo}.",
        caixaId = caixa.Id,
        posicaoId = posicao.Id,
        posicao = posicao.Codigo
    });
});

app.MapGet("/catalogo", async () =>
{
    using var db = AbrirConexao();
    var itens = await db.QueryAsync<ItemCatalogo>(
        @"SELECT c.id,
                 COALESCE(c.codigo, CONCAT('CX-', LPAD(c.id, 4, '0'))) AS codigo,
                 c.descricao, COALESCE(c.categoria, 'Sem categoria') AS categoria,
                 c.quantidade, c.minimo, COALESCE(c.ean, '') AS ean,
                 c.peso_kg, c.altura_cm, c.largura_cm, c.profundidade_cm,
                 po.codigo AS posicao, pr.codigo AS prateleira, pr.corredor,
                 po.nivel, COALESCE(po.restrita, FALSE) AS restrita
          FROM caixas c
          LEFT JOIN posicoes po ON po.id = c.posicao_id
          LEFT JOIN prateleiras pr ON pr.id = po.prateleira_id
          ORDER BY c.id");
    return Results.Ok(itens);
});

app.MapPut("/caixas/{id}", async (int id, NovaCaixa dados) =>
{
    var erro = dados.Validar();
    if (erro != null)
        return Results.BadRequest(new { erro });

    using var db = AbrirConexao();
    try
    {
        var alteradas = await db.ExecuteAsync(
            @"UPDATE caixas SET codigo = NULLIF(@Codigo, ''), descricao = @Descricao,
                     categoria = NULLIF(@Categoria, ''), quantidade = @Quantidade, minimo = @Minimo,
                     ean = NULLIF(@Ean, ''), peso_kg = @PesoKg, altura_cm = @AlturaCm,
                     largura_cm = @LarguraCm, profundidade_cm = @ProfundidadeCm
              WHERE id = @id",
            new { dados.Codigo, dados.Descricao, dados.Categoria, dados.Quantidade, dados.Minimo, dados.Ean,
                  dados.PesoKg, dados.AlturaCm, dados.LarguraCm, dados.ProfundidadeCm, id });
        if (alteradas == 0)
            return Results.NotFound(new { erro = "Caixa não encontrada." });

        return Results.Ok(new { mensagem = "Caixa atualizada." });
    }
    catch (MySqlException e) when (e.ErrorCode == MySqlErrorCode.DuplicateKeyEntry)
    {
        return Results.BadRequest(new { erro = "Já existe uma caixa com esse código." });
    }
});

app.MapDelete("/caixas/{id}", async (int id) =>
{
    using var db = AbrirConexao();
    await db.OpenAsync();

    var caixa = await db.QuerySingleOrDefaultAsync<Caixa>("SELECT * FROM caixas WHERE id = @id", new { id });
    if (caixa == null)
        return Results.NotFound(new { erro = "Caixa não encontrada." });

    using var transacao = await db.BeginTransactionAsync();
    await db.ExecuteAsync("DELETE FROM caixas WHERE id = @id", new { id }, transacao);
    if (caixa.PosicaoId != null)
        await db.ExecuteAsync("UPDATE posicoes SET ocupada = FALSE WHERE id = @PosicaoId", caixa, transacao);
    await transacao.CommitAsync();

    return Results.Ok(new { mensagem = "Caixa excluída." });
});

app.MapGet("/pedidos", async () =>
{
    using var db = AbrirConexao();
    var pedidos = await db.QueryAsync<Pedido>(
        @"SELECT id, cliente, itens, peso_kg, prioridade, coletor, status,
                 TIME_FORMAT(eta, '%H:%i') AS eta, progresso
          FROM pedidos ORDER BY id");
    return Results.Ok(pedidos);
});

app.MapPost("/pedidos", async (DadosPedido dados) =>
{
    var erro = dados.Validar();
    if (erro != null)
        return Results.BadRequest(new { erro });

    using var db = AbrirConexao();
    var id = await db.ExecuteScalarAsync<int>(
        @"INSERT INTO pedidos (cliente, itens, peso_kg, prioridade, coletor, status, eta, progresso)
          VALUES (@Cliente, @Itens, @PesoKg, @Prioridade, NULLIF(@Coletor, ''), @Status, NULLIF(@Eta, ''), @Progresso);
          SELECT LAST_INSERT_ID();",
        dados);

    var pedido = await db.QuerySingleAsync<Pedido>(
        @"SELECT id, cliente, itens, peso_kg, prioridade, coletor, status,
                 TIME_FORMAT(eta, '%H:%i') AS eta, progresso
          FROM pedidos WHERE id = @id",
        new { id });
    return Results.Created($"/pedidos/{id}", pedido);
});

app.MapPut("/pedidos/{id}", async (int id, DadosPedido dados) =>
{
    var erro = dados.Validar();
    if (erro != null)
        return Results.BadRequest(new { erro });

    using var db = AbrirConexao();
    var alterados = await db.ExecuteAsync(
        @"UPDATE pedidos SET cliente = @Cliente, itens = @Itens, peso_kg = @PesoKg, prioridade = @Prioridade,
                 coletor = NULLIF(@Coletor, ''), status = @Status, eta = NULLIF(@Eta, ''), progresso = @Progresso
          WHERE id = @id",
        new { dados.Cliente, dados.Itens, dados.PesoKg, dados.Prioridade, dados.Coletor,
              dados.Status, dados.Eta, dados.Progresso, id });
    if (alterados == 0)
        return Results.NotFound(new { erro = "Pedido não encontrado." });

    return Results.Ok(new { mensagem = "Pedido atualizado." });
});

app.MapDelete("/pedidos/{id}", async (int id) =>
{
    using var db = AbrirConexao();
    var excluidos = await db.ExecuteAsync("DELETE FROM pedidos WHERE id = @id", new { id });
    if (excluidos == 0)
        return Results.NotFound(new { erro = "Pedido não encontrado." });

    return Results.Ok(new { mensagem = "Pedido excluído." });
});

app.MapGet("/overview", async () =>
{
    using var db = AbrirConexao();

    var pedidos = await db.QuerySingleAsync(
        @"SELECT COUNT(*) AS total,
                 COALESCE(SUM(status = 'Concluído'), 0) AS concluidos,
                 COALESCE(SUM(status IN ('Iniciado', 'Em Andamento')), 0) AS emAndamento,
                 COALESCE(SUM(status = 'Pendente'), 0) AS pendentes,
                 COUNT(DISTINCT CASE WHEN status IN ('Iniciado', 'Em Andamento') THEN coletor END) AS coletoresAtivos
          FROM pedidos");

    var prateleiras = await db.QueryAsync<OcupacaoPrateleira>(
        @"SELECT pr.codigo AS prateleira, pr.corredor,
                 COUNT(*) AS total, SUM(po.ocupada) AS ocupadas
          FROM prateleiras pr
          JOIN posicoes po ON po.prateleira_id = pr.id
          GROUP BY pr.id, pr.codigo, pr.corredor
          ORDER BY pr.codigo");

    var atividades = await db.QueryAsync<AtividadePedido>(
        @"SELECT id, cliente, itens, coletor, status, progresso,
                 DATE_FORMAT(atualizado_em, '%H:%i') AS hora
          FROM pedidos
          ORDER BY atualizado_em DESC, id DESC
          LIMIT 5");

    return Results.Ok(new
    {
        totalPedidos = (int)pedidos.total,
        concluidos = (int)pedidos.concluidos,
        emAndamento = (int)pedidos.emAndamento,
        pendentes = (int)pedidos.pendentes,
        coletoresAtivos = (int)pedidos.coletoresAtivos,
        prateleiras,
        atividades
    });
});

app.Run();
