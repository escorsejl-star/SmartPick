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

app.MapGet("/mapa", async () =>
{
    using var db = AbrirConexao();
    var posicoes = await db.QueryAsync<PosicaoMapa>(
        @"SELECT po.id, po.codigo, pr.codigo AS prateleira, pr.corredor,
                 po.nivel, po.profundidade, po.restrita, po.ocupada,
                 COALESCE(c.codigo, CONCAT('CX-', LPAD(c.id, 4, '0'))) AS caixa, c.descricao,
                 c.categoria, c.peso_kg, c.quantidade
          FROM posicoes po
          JOIN prateleiras pr ON pr.id = po.prateleira_id
          LEFT JOIN caixas c ON c.posicao_id = po.id
          ORDER BY pr.codigo, po.nivel DESC, po.profundidade");
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
    var posicao = await db.QuerySingleOrDefaultAsync<Posicao>(
        "SELECT * FROM posicoes WHERE id = @PosicaoId", pedido);
    if (posicao == null)
        return Results.NotFound(new { erro = "Posição não encontrada." });
    if (posicao.Ocupada)
        return Results.BadRequest(new { erro = "Esta posição já está ocupada." });
    if (caixa.PesoKg >= 20 && posicao.Nivel == 3)
        return Results.BadRequest(new { erro = "Caixa com 20 kg ou mais não pode ficar no nível 3." });

    using var transacao = await db.BeginTransactionAsync();
    // se a caixa já estava em outra posição, essa posição fica livre de novo
    await db.ExecuteAsync(
        "UPDATE posicoes SET ocupada = FALSE WHERE id = @PosicaoId", new { caixa.PosicaoId }, transacao);
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

// Tira a caixa da prateleira. Ela continua no catálogo, só fica sem posição.
app.MapPost("/caixas/{id}/tirar-da-prateleira", async (int id) =>
{
    using var db = AbrirConexao();
    await db.OpenAsync();

    var caixa = await db.QuerySingleOrDefaultAsync<Caixa>(
        "SELECT * FROM caixas WHERE id = @id", new { id });
    if (caixa == null)
        return Results.NotFound(new { erro = "Caixa não encontrada." });
    if (caixa.PosicaoId == null)
        return Results.BadRequest(new { erro = "Esta caixa já está sem prateleira." });

    using var transacao = await db.BeginTransactionAsync();
    await db.ExecuteAsync(
        "UPDATE posicoes SET ocupada = FALSE WHERE id = @PosicaoId", new { caixa.PosicaoId }, transacao);
    await db.ExecuteAsync(
        "UPDATE caixas SET posicao_id = NULL WHERE id = @id", new { id }, transacao);
    await transacao.CommitAsync();

    return Results.Ok(new { mensagem = "Caixa retirada da prateleira." });
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

// Produtos de todos os pedidos, com a posição de cada um no armazém
app.MapGet("/pedidos/itens", async () =>
{
    using var db = AbrirConexao();
    var itens = await db.QueryAsync<ItemPedido>(
        @"SELECT pi.id, pi.pedido_id, c.id AS caixa_id,
                 COALESCE(c.codigo, CONCAT('CX-', LPAD(c.id, 4, '0'))) AS codigo,
                 c.descricao, pi.quantidade, pi.coletado, c.peso_kg,
                 po.codigo AS posicao, pr.codigo AS prateleira, po.nivel,
                 COALESCE(po.restrita, FALSE) AS restrita
          FROM pedido_itens pi
          JOIN caixas c ON c.id = pi.caixa_id
          LEFT JOIN posicoes po ON po.id = c.posicao_id
          LEFT JOIN prateleiras pr ON pr.id = po.prateleira_id
          ORDER BY pi.pedido_id, pi.id");
    return Results.Ok(itens);
});

// Refaz as contas do pedido a partir dos produtos dele: total de itens, peso,
// progresso e status. O status anda sozinho conforme o coletor coleta.
async Task AtualizarPedido(MySqlConnection db, int id)
{
    await db.ExecuteAsync(
        @"UPDATE pedidos p SET
            itens = (SELECT COALESCE(SUM(pi.quantidade), 0) FROM pedido_itens pi WHERE pi.pedido_id = p.id),
            peso_kg = (SELECT COALESCE(SUM(pi.quantidade * c.peso_kg), 0)
                       FROM pedido_itens pi JOIN caixas c ON c.id = pi.caixa_id WHERE pi.pedido_id = p.id),
            progresso = (SELECT COALESCE(ROUND(100 * SUM(pi.coletado * pi.quantidade) / SUM(pi.quantidade)), 0)
                         FROM pedido_itens pi WHERE pi.pedido_id = p.id)
          WHERE p.id = @id",
        new { id });

    var faltam = await db.ExecuteScalarAsync<int>(
        "SELECT COUNT(*) FROM pedido_itens WHERE pedido_id = @id AND coletado = FALSE", new { id });
    var coletados = await db.ExecuteScalarAsync<int>(
        "SELECT COUNT(*) FROM pedido_itens WHERE pedido_id = @id AND coletado = TRUE", new { id });

    if (coletados > 0 && faltam == 0)
        await db.ExecuteAsync("UPDATE pedidos SET status = 'Concluído', progresso = 100 WHERE id = @id", new { id });
    else if (coletados > 0)
        await db.ExecuteAsync("UPDATE pedidos SET status = 'Em Andamento' WHERE id = @id", new { id });
}

// Pedido novo sempre começa como Pendente e sem produtos
app.MapPost("/pedidos", async (DadosPedido dados) =>
{
    var erro = dados.Validar();
    if (erro != null)
        return Results.BadRequest(new { erro });

    using var db = AbrirConexao();
    var id = await db.ExecuteScalarAsync<int>(
        @"INSERT INTO pedidos (cliente, itens, peso_kg, prioridade, status, eta, progresso)
          VALUES (@Cliente, 0, 0, @Prioridade, 'Pendente', NULLIF(@Eta, ''), 0);
          SELECT LAST_INSERT_ID();",
        dados);

    return Results.Created($"/pedidos/{id}", new { id });
});

app.MapPut("/pedidos/{id}", async (int id, DadosPedido dados) =>
{
    var erro = dados.Validar();
    if (erro != null)
        return Results.BadRequest(new { erro });

    using var db = AbrirConexao();
    var alterados = await db.ExecuteAsync(
        @"UPDATE pedidos SET cliente = @Cliente, prioridade = @Prioridade, eta = NULLIF(@Eta, '')
          WHERE id = @id",
        new { dados.Cliente, dados.Prioridade, dados.Eta, id });
    if (alterados == 0)
        return Results.NotFound(new { erro = "Pedido não encontrado." });

    return Results.Ok(new { mensagem = "Pedido atualizado." });
});

// Troca a lista de produtos do pedido. Só vale antes de a coleta começar.
app.MapPut("/pedidos/{id}/itens", async (int id, List<ProdutoPedido> produtos) =>
{
    foreach (var produto in produtos)
        if (produto.Quantidade < 1)
            return Results.BadRequest(new { erro = "A quantidade precisa ser pelo menos 1." });

    using var db = AbrirConexao();
    await db.OpenAsync();

    var status = await db.ExecuteScalarAsync<string>("SELECT status FROM pedidos WHERE id = @id", new { id });
    if (status == null)
        return Results.NotFound(new { erro = "Pedido não encontrado." });
    if (status != "Pendente" && status != "Iniciado")
        return Results.BadRequest(new { erro = "Não dá para mudar os produtos depois que a coleta começou." });

    using var transacao = await db.BeginTransactionAsync();
    await db.ExecuteAsync("DELETE FROM pedido_itens WHERE pedido_id = @id", new { id }, transacao);
    foreach (var produto in produtos)
        await db.ExecuteAsync(
            "INSERT INTO pedido_itens (pedido_id, caixa_id, quantidade) VALUES (@id, @CaixaId, @Quantidade)",
            new { id, produto.CaixaId, produto.Quantidade }, transacao);
    await transacao.CommitAsync();

    await AtualizarPedido(db, id);
    return Results.Ok(new { mensagem = "Produtos do pedido atualizados." });
});

// O coletor escolhe o pedido: Pendente vira Iniciado
app.MapPost("/pedidos/{id}/pegar", async (int id, PedidoPegar dados) =>
{
    if (string.IsNullOrWhiteSpace(dados.Coletor))
        return Results.BadRequest(new { erro = "Informe o coletor." });

    using var db = AbrirConexao();
    var pedido = await db.QuerySingleOrDefaultAsync<Pedido>(
        "SELECT id, cliente, itens, status FROM pedidos WHERE id = @id", new { id });
    if (pedido == null)
        return Results.NotFound(new { erro = "Pedido não encontrado." });
    if (pedido.Status != "Pendente")
        return Results.BadRequest(new { erro = "Este pedido já foi escolhido por outro coletor." });
    if (pedido.Itens == 0)
        return Results.BadRequest(new { erro = "Este pedido ainda não tem produtos." });

    await db.ExecuteAsync(
        "UPDATE pedidos SET coletor = @Coletor, status = 'Iniciado' WHERE id = @id",
        new { dados.Coletor, id });
    return Results.Ok(new { mensagem = "Pedido iniciado." });
});

// O coletor coleta um produto: o pedido vira Em Andamento e, no último, Concluído
app.MapPost("/pedidos/{id}/itens/{itemId}/coletar", async (int id, int itemId) =>
{
    using var db = AbrirConexao();
    await db.OpenAsync();

    var status = await db.ExecuteScalarAsync<string>("SELECT status FROM pedidos WHERE id = @id", new { id });
    if (status != "Iniciado" && status != "Em Andamento")
        return Results.BadRequest(new { erro = "Este pedido não está em coleta." });

    var item = await db.QuerySingleOrDefaultAsync<ProdutoPedido>(
        @"SELECT caixa_id, quantidade FROM pedido_itens
          WHERE id = @itemId AND pedido_id = @id AND coletado = FALSE",
        new { itemId, id });
    if (item == null)
        return Results.BadRequest(new { erro = "Produto não encontrado ou já coletado." });

    // marca como coletado e tira as unidades do estoque
    await db.ExecuteAsync("UPDATE pedido_itens SET coletado = TRUE WHERE id = @itemId", new { itemId });
    await db.ExecuteAsync(
        "UPDATE caixas SET quantidade = GREATEST(quantidade - @Quantidade, 0) WHERE id = @CaixaId", item);

    await AtualizarPedido(db, id);
    return Results.Ok(new { mensagem = "Produto coletado." });
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
