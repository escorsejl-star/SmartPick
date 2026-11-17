namespace SmartPick.Api.Modelos;

public class PosicaoDisponivel
{
    public int Id { get; set; }
    public string Codigo { get; set; } = "";
    public string Prateleira { get; set; } = "";
    public string Corredor { get; set; } = "";
    public int Nivel { get; set; }
    public int Profundidade { get; set; }
    public bool Restrita { get; set; }
}
