namespace SmartPick.Api.Modelos;

public class PosicaoMapa
{
    public int Id { get; set; }
    public string Codigo { get; set; } = "";
    public string Prateleira { get; set; } = "";
    public string Corredor { get; set; } = "";
    public int Nivel { get; set; }
    public int Profundidade { get; set; }
    public bool Restrita { get; set; }
    public bool Ocupada { get; set; }
    public string? Caixa { get; set; }
    public string? Descricao { get; set; }
    public string? Categoria { get; set; }
    public decimal? PesoKg { get; set; }
    public int? Quantidade { get; set; }
}
