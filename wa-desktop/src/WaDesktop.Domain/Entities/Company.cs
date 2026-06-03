using Newtonsoft.Json;

namespace WaDesktop.Domain.Entities
{
    public class Company
    {
        [JsonProperty("id")]
        public long Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("created_at")]
        public string CreatedAt { get; set; }
    }
}
