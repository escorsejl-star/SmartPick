namespace SmartPick.Api.Modelos;

public class Posicao
{
    public int Id { get; set; }
    public int PrateleiraId { get; set; }
    public string Codigo { get; set; } = "";
    public int Nivel { get; set; }
    public int Profundidade { get; set; }
    public bool Restrita { get; set; }
    public bool Ocupada { get; set; }
}
