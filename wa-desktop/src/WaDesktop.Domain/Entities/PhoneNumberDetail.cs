
using Newtonsoft.Json;
using System.Collections.Generic;

namespace WaDesktop.Domain.Entities
{
    public class PhoneNumberDetail
    {
        [JsonProperty("phone_number_id")]
        public string PhoneNumberId { get; set; }
        [JsonProperty("display_name")]
        public string DisplayName { get; set; }
        [JsonProperty("display_phone_number")]
        public string DisplayPhone { get; set; }
        [JsonProperty("quality_rating")]
        public string QualityRating { get; set; }
        [JsonProperty("description")]
        public string Description { get; set; }
        [JsonProperty("email")]
        public string Email { get; set; }
        [JsonProperty("about")]
        public string About { get; set; }
        [JsonProperty("address")]
        public string Address { get; set; }
        [JsonProperty("vertical")]
        public string Vertical { get; set; }
        [JsonProperty("websites")]
        public List<string> Websites { get; set; }
        [JsonProperty("profile_picture_url")]
        public string ProfilePictureUrl { get; set; }
        [JsonProperty("company_id")]
        public long? CompanyId { get; set; }
        [JsonProperty("company_name")]
        public string CompanyName { get; set; }
        [JsonProperty("created_at")]
        public string CreatedAt { get; set; }
        [JsonProperty("updated_at")]
        public string UpdatedAt { get; set; }
    }
}


