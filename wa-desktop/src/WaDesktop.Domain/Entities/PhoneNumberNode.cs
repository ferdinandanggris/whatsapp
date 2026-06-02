using System.Collections.Generic;

namespace WaDesktop.Domain.Entities
{
    public class PhoneNumberNode
    {
        public string PhoneNumberId { get; set; }
        public string DisplayPhoneNumber { get; set; }
        public string DisplayName { get; set; }
        public List<PhoneNumberNode> Children { get; set; } = new List<PhoneNumberNode>();
    }
}
