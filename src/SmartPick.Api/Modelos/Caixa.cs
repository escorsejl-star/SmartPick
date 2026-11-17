namespace SmartPick.Api.Modelos;

public class Caixa
{
    public int Id { get; set; }
    public string? Codigo { get; set; }
    public string Descricao { get; set; } = "";
    public string? Categoria { get; set; }
    public int Quantidade { get; set; }
    public int Minimo { get; set; }
    public string? Ean { get; set; }
    public decimal PesoKg { get; set; }
    public decimal AlturaCm { get; set; }
    public decimal LarguraCm { get; set; }
    public decimal ProfundidadeCm { get; set; }
    public int? PosicaoId { get; set; }
    public DateTime CadastradaEm { get; set; }
}
