namespace SmartPick.Api.Modelos;

public class OcupacaoPrateleira
{
    public string Prateleira { get; set; } = "";
    public string Corredor { get; set; } = "";
    public int Total { get; set; }
    public int Ocupadas { get; set; }
}

public class AtividadePedido
{
    public int Id { get; set; }
    public string Codigo => $"ORD-{Id}";
    public string Cliente { get; set; } = "";
    public int Itens { get; set; }
    public string? Coletor { get; set; }
    public string Status { get; set; } = "";
    public int Progresso { get; set; }
    public string Hora { get; set; } = "";
}
