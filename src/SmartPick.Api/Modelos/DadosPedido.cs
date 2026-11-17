namespace SmartPick.Api.Modelos;

// Dados que o gestor preenche. Status, coletor e progresso mudam sozinhos pela coleta.
public class DadosPedido
{
    public string Cliente { get; set; } = "";
    public string Prioridade { get; set; } = "P3";
    public string? Eta { get; set; }

    static readonly string[] Prioridades = { "P1", "P2", "P3" };

    public string? Validar()
    {
        if (string.IsNullOrWhiteSpace(Cliente))
            return "Informe o nome do cliente.";
        if (!Prioridades.Contains(Prioridade))
            return "A prioridade precisa ser P1, P2 ou P3.";
        if (!string.IsNullOrEmpty(Eta) && !TimeOnly.TryParse(Eta, out _))
            return "O horário previsto precisa estar no formato 16:30.";
        return null;
    }
}
