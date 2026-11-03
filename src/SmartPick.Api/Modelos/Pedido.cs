namespace SmartPick.Api.Modelos;

public class Pedido
{
    public int Id { get; set; }

    public string Codigo => $"ORD-{Id}";
    public string Cliente { get; set; } = "";
    public int Itens { get; set; }
    public decimal PesoKg { get; set; }
    public string Prioridade { get; set; } = "";
    public string? Coletor { get; set; }
    public string Status { get; set; } = "";
    public string? Eta { get; set; }
    public int Progresso { get; set; }
}
