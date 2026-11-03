namespace SmartPick.Api.Modelos;

public class DadosPedido
{
    public string Cliente { get; set; } = "";
    public int Itens { get; set; } = 1;
    public decimal PesoKg { get; set; } = 1;
    public string Prioridade { get; set; } = "P3";
    public string? Coletor { get; set; }
    public string Status { get; set; } = "Pendente";
    public string? Eta { get; set; }
    public int Progresso { get; set; }

    static readonly string[] Prioridades = { "P1", "P2", "P3" };
    static readonly string[] Situacoes = { "Pendente", "Iniciado", "Em Andamento", "Concluído" };

    public string? Validar()
    {
        if (string.IsNullOrWhiteSpace(Cliente))
            return "Informe o nome do cliente.";
        if (Itens < 1)
            return "O pedido precisa ter pelo menos 1 item.";
        if (PesoKg <= 0)
            return "O peso precisa ser maior que zero.";
        if (!Prioridades.Contains(Prioridade))
            return "A prioridade precisa ser P1, P2 ou P3.";
        if (!Situacoes.Contains(Status))
            return "Status inválido.";
        if (Progresso < 0 || Progresso > 100)
            return "O progresso precisa ser de 0 a 100.";
        if (!string.IsNullOrEmpty(Eta) && !TimeOnly.TryParse(Eta, out _))
            return "O horário previsto precisa estar no formato 16:30.";
        return null;
    }
}
