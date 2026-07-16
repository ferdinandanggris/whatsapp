using Newtonsoft.Json;

namespace WaDesktop.Domain.Entities
{
    public class Waba
    {
        [JsonProperty("waba_id")]
        public string WabaId { get; set; }
        [JsonProperty("company_id")]
        public string CompanyId { get; set; }
        [JsonProperty("company_name")]
        public string CompanyName { get; set; }
        [JsonProperty("name")]
        public string Name { get; set; }
        
        [JsonProperty("created_at")]
        public string CreatedAt { get; set; }
    }
}
