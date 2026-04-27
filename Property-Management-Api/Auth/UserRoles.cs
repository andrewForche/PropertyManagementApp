namespace Property_Management_Api.Auth;

public static class UserRoles
{
    public const string Admin = "Admin";
    public const string Contractor = "Contractor";
    public const string Landlord = "Landlord";
    public const string Tenant = "Tenant";

    public static readonly string[] All =
    [
        Admin,
        Contractor,
        Landlord,
        Tenant
    ];
}
