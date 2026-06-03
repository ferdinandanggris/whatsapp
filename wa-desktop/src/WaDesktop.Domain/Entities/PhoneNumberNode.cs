using Newtonsoft.Json;
using System.Collections.Generic;

namespace WaDesktop.Domain.Entities
{
    public class PhoneNumberNode
    {
        [JsonProperty("phone_number_id")]
        public string PhoneNumberId { get; set; }
        [JsonProperty("display_phone_number")]
        public string DisplayPhoneNumber { get; set; }
        [JsonProperty("display_name")]
        public string DisplayName { get; set; }
        [JsonProperty("company_id")]
        public long? CompanyId { get; set; }
        [JsonProperty("company_name")]
        public string CompanyName { get; set; }
        public List<PhoneNumberNode> Children { get; set; } = new List<PhoneNumberNode>();
    }
}
