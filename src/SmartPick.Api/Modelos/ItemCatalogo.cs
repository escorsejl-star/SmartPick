namespace SmartPick.Api.Modelos;

public class ItemCatalogo
{
    public int Id { get; set; }
    public string Codigo { get; set; } = "";
    public string Descricao { get; set; } = "";
    public string Categoria { get; set; } = "";
    public int Quantidade { get; set; }
    public int Minimo { get; set; }
    public string Ean { get; set; } = "";
    public decimal PesoKg { get; set; }
    public decimal AlturaCm { get; set; }
    public decimal LarguraCm { get; set; }
    public decimal ProfundidadeCm { get; set; }
    public string? Posicao { get; set; }
    public string? Prateleira { get; set; }
    public string? Corredor { get; set; }
    public int? Nivel { get; set; }
    public bool Restrita { get; set; }
}
