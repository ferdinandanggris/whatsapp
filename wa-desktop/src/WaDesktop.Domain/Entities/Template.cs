namespace WaDesktop.Domain.Entities
{
    public class Template
    {
        public string Id { get; set; }
        public string WabaId { get; set; }
        public string Name { get; set; }
        public string Language { get; set; }
        public string Status { get; set; }
        public string Category { get; set; }
        public int? MessageSendTtlSeconds { get; set; }
        public string ParameterFormat { get; set; }
    }
}
