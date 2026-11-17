namespace SmartPick.Api.Modelos;

public class NovaCaixa
{
    public string? Codigo { get; set; }
    public string Descricao { get; set; } = "";
    public string? Categoria { get; set; }
    public int Quantidade { get; set; } = 1;
    public int Minimo { get; set; }
    public string? Ean { get; set; }
    public decimal PesoKg { get; set; }
    public decimal AlturaCm { get; set; }
    public decimal LarguraCm { get; set; }
    public decimal ProfundidadeCm { get; set; }

    public string? Validar()
    {
        if (string.IsNullOrWhiteSpace(Descricao))
            return "Informe a descrição da caixa.";
        if (PesoKg <= 0)
            return "O peso precisa ser maior que zero.";
        if (AlturaCm <= 0 || LarguraCm <= 0 || ProfundidadeCm <= 0)
            return "Altura, largura e profundidade precisam ser maiores que zero.";
        if (Quantidade < 0 || Minimo < 0)
            return "Quantidade e mínimo não podem ser negativos.";
        if (!string.IsNullOrEmpty(Ean) && (Ean.Length != 13 || !Ean.All(char.IsDigit)))
            return "O EAN precisa ter 13 números.";
        return null;
    }
}
