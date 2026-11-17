namespace SmartPick.Api.Modelos;

public class ItemPedido
{
    public int Id { get; set; }
    public int PedidoId { get; set; }
    public int CaixaId { get; set; }
    public string Codigo { get; set; } = "";
    public string Descricao { get; set; } = "";
    public int Quantidade { get; set; }
    public bool Coletado { get; set; }
    public decimal PesoKg { get; set; }
    public string? Posicao { get; set; }
    public string? Prateleira { get; set; }
    public int? Nivel { get; set; }
    public bool Restrita { get; set; }
}

// Um produto na lista que o gestor monta para o pedido
public class ProdutoPedido
{
    public int CaixaId { get; set; }
    public int Quantidade { get; set; }
}

public class PedidoPegar
{
    public string Coletor { get; set; } = "";
}
