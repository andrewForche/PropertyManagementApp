using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Property_Management_Api.Auth;

namespace Property_Management_Api.DataServices;

public sealed class AuthDataService : IAuthDataService
{
    private readonly string _connectionString;

    public AuthDataService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
    }

    public async Task<AuthUserRecord?> GetByEmailAsync(string email, CancellationToken cancellationToken)
    {
        const string authUserSql = """
            SELECT
                AuthUserId,
                Email,
                PasswordHash,
                RoleName,
                IsActive
            FROM AuthUsers
            WHERE Email = @Email
            LIMIT 1;
            """;

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new MySqlCommand(authUserSql, connection);
        command.Parameters.AddWithValue("@Email", email.Trim());

        int authUserId;
        string normalizedEmail;
        string passwordHash;
        string roleName;
        bool isActive;

        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            if (!await reader.ReadAsync(cancellationToken))
            {
                return null;
            }

            authUserId = reader.GetInt32("AuthUserId");
            normalizedEmail = reader.GetString("Email");
            passwordHash = reader.GetString("PasswordHash");
            roleName = reader.GetString("RoleName");
            isActive = reader.GetBoolean("IsActive");
        }

        var tenantId = await GetTenantIdAsync(connection, authUserId, normalizedEmail, cancellationToken);

        return new AuthUserRecord
        {
            AuthUserId = authUserId,
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            RoleName = roleName,
            IsActive = isActive,
            TenantId = tenantId
        };
    }

    private static async Task<int?> GetTenantIdAsync(
        MySqlConnection connection,
        int authUserId,
        string email,
        CancellationToken cancellationToken)
    {
        const string authUserMappingSql = """
            SELECT TenantId
            FROM Tenants
            WHERE AuthUserId = @AuthUserId
            LIMIT 2;
            """;

        await using var authUserCommand = new MySqlCommand(authUserMappingSql, connection);
        authUserCommand.Parameters.AddWithValue("@AuthUserId", authUserId);

        var tenantIds = new List<int>();
        await using (var reader = await authUserCommand.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                tenantIds.Add(reader.GetInt32("TenantId"));
            }
        }

        if (tenantIds.Count == 1)
        {
            return tenantIds[0];
        }

        if (tenantIds.Count > 1)
        {
            throw new InvalidOperationException("Auth user is mapped to more than one tenant record.");
        }

        const string emailFallbackSql = """
            SELECT TenantId
            FROM Tenants
            WHERE Email = @Email
            LIMIT 2;
            """;

        await using var emailCommand = new MySqlCommand(emailFallbackSql, connection);
        emailCommand.Parameters.AddWithValue("@Email", email);

        var fallbackTenantIds = new List<int>();
        await using var fallbackReader = await emailCommand.ExecuteReaderAsync(cancellationToken);
        while (await fallbackReader.ReadAsync(cancellationToken))
        {
            fallbackTenantIds.Add(fallbackReader.GetInt32("TenantId"));
        }

        return fallbackTenantIds.Count == 1 ? fallbackTenantIds[0] : null;
    }
}
