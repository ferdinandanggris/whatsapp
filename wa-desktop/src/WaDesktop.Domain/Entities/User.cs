namespace WaDesktop.Domain.Entities
{
    public class User
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string DisplayName { get; set; }
        public string Role { get; set; }
        public long? CompanyId { get; set; }
        public bool IsActive { get; set; }
    }
}
