using Newtonsoft.Json;

namespace WaDesktop.Domain.Entities
{
    public class User
    {
        [JsonProperty("id")]
        public string Id { get; set; }
        [JsonProperty("email")]
        public string Email { get; set; }
        [JsonProperty("display_name")]
        public string DisplayName { get; set; }
        [JsonProperty("role")]
        public string Role { get; set; }
        [JsonProperty("company_id")]
        public long? CompanyId { get; set; }
        [JsonProperty("is_active")]
        public bool IsActive { get; set; }
    }
}
