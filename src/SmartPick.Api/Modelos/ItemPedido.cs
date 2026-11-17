namespace SmartPick.Api.Modelos;

public class ItemPedido
{
    public int PedidoId { get; set; }
    public string Codigo { get; set; } = "";
    public string Descricao { get; set; } = "";
    public int Quantidade { get; set; }
    public decimal PesoKg { get; set; }
    public string? Posicao { get; set; }
    public string? Prateleira { get; set; }
    public int? Nivel { get; set; }
    public bool Restrita { get; set; }
}
