using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using Property_Management_Api.Auth;

namespace Property_Management_Api.Services;

public sealed class DatabaseInitializationService : IDatabaseInitializationService
{
    private readonly string _connectionString;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<DatabaseInitializationService> _logger;

    public DatabaseInitializationService(
        IConfiguration configuration,
        IPasswordHasher passwordHasher,
        ILogger<DatabaseInitializationService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await EnsureAuthUsersTableAsync(connection, cancellationToken);
        await EnsureTenantAuthUserMappingAsync(connection, cancellationToken);
        await SeedAuthUsersAsync(connection, cancellationToken);
        await EnsureTenantSeedLinkAsync(connection, cancellationToken);
    }

    private static async Task EnsureAuthUsersTableAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS AuthUsers (
                AuthUserId INT NOT NULL AUTO_INCREMENT,
                Email VARCHAR(200) NOT NULL,
                PasswordHash VARCHAR(500) NOT NULL,
                RoleName ENUM('Admin', 'Contractor', 'Landlord', 'Tenant') NOT NULL,
                IsActive BOOLEAN NOT NULL DEFAULT TRUE,
                CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (AuthUserId),
                CONSTRAINT UX_AuthUsers_Email UNIQUE (Email)
            );
            """;

        await using var command = new MySqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task EnsureTenantAuthUserMappingAsync(
        MySqlConnection connection,
        CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, "Tenants", cancellationToken))
        {
            return;
        }

        if (!await ColumnExistsAsync(connection, "Tenants", "AuthUserId", cancellationToken))
        {
            const string addColumnSql = """
                ALTER TABLE Tenants
                ADD COLUMN AuthUserId INT NULL;
                """;

            await using var addColumnCommand = new MySqlCommand(addColumnSql, connection);
            await addColumnCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        if (!await ForeignKeyExistsAsync(connection, "Tenants", "FK_Tenants_AuthUsers", cancellationToken))
        {
            const string addForeignKeySql = """
                ALTER TABLE Tenants
                ADD CONSTRAINT FK_Tenants_AuthUsers
                FOREIGN KEY (AuthUserId) REFERENCES AuthUsers (AuthUserId)
                ON DELETE SET NULL
                ON UPDATE CASCADE;
                """;

            await using var addForeignKeyCommand = new MySqlCommand(addForeignKeySql, connection);
            await addForeignKeyCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        if (!await IndexExistsAsync(connection, "Tenants", "IX_Tenants_AuthUserId", cancellationToken))
        {
            const string addIndexSql = """
                CREATE UNIQUE INDEX IX_Tenants_AuthUserId
                ON Tenants (AuthUserId);
                """;

            await using var addIndexCommand = new MySqlCommand(addIndexSql, connection);
            await addIndexCommand.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    private async Task SeedAuthUsersAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        var seedUsers = new[]
        {
            new SeedAuthUser("admin@property.local", "Admin123!", UserRoles.Admin),
            new SeedAuthUser("landlord@property.local", "Landlord123!", UserRoles.Landlord),
            new SeedAuthUser("contractor@property.local", "Contractor123!", UserRoles.Contractor),
            new SeedAuthUser("tenant@property.local", "Tenant123!", UserRoles.Tenant)
        };

        foreach (var user in seedUsers)
        {
            const string upsertSql = """
                INSERT INTO AuthUsers (
                    Email,
                    PasswordHash,
                    RoleName,
                    IsActive
                )
                VALUES (
                    @Email,
                    @PasswordHash,
                    @RoleName,
                    TRUE
                )
                ON DUPLICATE KEY UPDATE
                    PasswordHash = VALUES(PasswordHash),
                    RoleName = VALUES(RoleName),
                    IsActive = VALUES(IsActive);
                """;

            await using var command = new MySqlCommand(upsertSql, connection);
            command.Parameters.AddWithValue("@Email", user.Email);
            command.Parameters.AddWithValue("@PasswordHash", _passwordHasher.HashPassword(user.Password));
            command.Parameters.AddWithValue("@RoleName", user.RoleName);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    private async Task EnsureTenantSeedLinkAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        if (!await TableExistsAsync(connection, "Tenants", cancellationToken))
        {
            return;
        }

        const string tenantAuthUserSql = """
            SELECT
                AuthUserId,
                Email,
                PasswordHash,
                RoleName,
                IsActive
            FROM AuthUsers
            WHERE Email = 'tenant@property.local'
            LIMIT 1;
            """;

        int authUserId;
        string email;
        string passwordHash;
        string roleName;
        bool isActive;

        await using (var command = new MySqlCommand(tenantAuthUserSql, connection))
        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            if (!await reader.ReadAsync(cancellationToken))
            {
                _logger.LogWarning("Tenant seed auth user was not found after seeding.");
                return;
            }

            authUserId = reader.GetInt32("AuthUserId");
            email = reader.GetString("Email");
            passwordHash = reader.GetString("PasswordHash");
            roleName = reader.GetString("RoleName");
            isActive = reader.GetBoolean("IsActive");
        }

        const string existingMappedTenantSql = """
            SELECT TenantId
            FROM Tenants
            WHERE AuthUserId = @AuthUserId
            LIMIT 1;
            """;

        await using (var mappedTenantCommand = new MySqlCommand(existingMappedTenantSql, connection))
        {
            mappedTenantCommand.Parameters.AddWithValue("@AuthUserId", authUserId);
            var mappedTenantId = await mappedTenantCommand.ExecuteScalarAsync(cancellationToken);
            if (mappedTenantId is not null)
            {
                _logger.LogInformation(
                    "Tenant auth user already linked. Email={Email}, AuthUserId={AuthUserId}, TenantId={TenantId}, IsActive={IsActive}, RoleName={RoleName}, PasswordHashLength={PasswordHashLength}",
                    email,
                    authUserId,
                    Convert.ToInt32(mappedTenantId),
                    isActive,
                    roleName,
                    passwordHash.Length);
                return;
            }
        }

        const string matchingEmailTenantSql = """
            SELECT TenantId
            FROM Tenants
            WHERE Email = @Email
            ORDER BY TenantId
            LIMIT 1;
            """;

        await using var matchingTenantCommand = new MySqlCommand(matchingEmailTenantSql, connection);
        matchingTenantCommand.Parameters.AddWithValue("@Email", email);
        var tenantIdValue = await matchingTenantCommand.ExecuteScalarAsync(cancellationToken);

        if (tenantIdValue is null)
        {
            const string firstAvailableTenantSql = """
                SELECT TenantId
                FROM Tenants
                WHERE AuthUserId IS NULL
                ORDER BY TenantId
                LIMIT 1;
                """;

            await using var firstAvailableTenantCommand = new MySqlCommand(firstAvailableTenantSql, connection);
            tenantIdValue = await firstAvailableTenantCommand.ExecuteScalarAsync(cancellationToken);
        }

        if (tenantIdValue is null)
        {
            _logger.LogWarning(
                "Tenant auth user exists but no tenant record is available to link. Email={Email}, AuthUserId={AuthUserId}, IsActive={IsActive}, RoleName={RoleName}",
                email,
                authUserId,
                isActive,
                roleName);
            return;
        }

        var tenantId = Convert.ToInt32(tenantIdValue);

        const string updateTenantSql = """
            UPDATE Tenants
            SET
                AuthUserId = @AuthUserId,
                Email = @Email
            WHERE TenantId = @TenantId;
            """;

        await using var updateTenantCommand = new MySqlCommand(updateTenantSql, connection);
        updateTenantCommand.Parameters.AddWithValue("@AuthUserId", authUserId);
        updateTenantCommand.Parameters.AddWithValue("@Email", email);
        updateTenantCommand.Parameters.AddWithValue("@TenantId", tenantId);
        await updateTenantCommand.ExecuteNonQueryAsync(cancellationToken);

        _logger.LogInformation(
            "Tenant auth user linked to tenant record. Email={Email}, AuthUserId={AuthUserId}, TenantId={TenantId}, IsActive={IsActive}, RoleName={RoleName}, PasswordHashLength={PasswordHashLength}",
            email,
            authUserId,
            tenantId,
            isActive,
            roleName,
            passwordHash.Length);
    }

    private static async Task<bool> TableExistsAsync(
        MySqlConnection connection,
        string tableName,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                  AND table_name = @TableName
            );
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TableName", tableName);

        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 1;
    }

    private static async Task<bool> ColumnExistsAsync(
        MySqlConnection connection,
        string tableName,
        string columnName,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = @TableName
                  AND column_name = @ColumnName
            );
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TableName", tableName);
        command.Parameters.AddWithValue("@ColumnName", columnName);

        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 1;
    }

    private static async Task<bool> ForeignKeyExistsAsync(
        MySqlConnection connection,
        string tableName,
        string constraintName,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM information_schema.table_constraints
                WHERE table_schema = DATABASE()
                  AND table_name = @TableName
                  AND constraint_name = @ConstraintName
                  AND constraint_type = 'FOREIGN KEY'
            );
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TableName", tableName);
        command.Parameters.AddWithValue("@ConstraintName", constraintName);

        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 1;
    }

    private static async Task<bool> IndexExistsAsync(
        MySqlConnection connection,
        string tableName,
        string indexName,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = @TableName
                  AND index_name = @IndexName
            );
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@TableName", tableName);
        command.Parameters.AddWithValue("@IndexName", indexName);

        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 1;
    }

    private sealed record SeedAuthUser(string Email, string Password, string RoleName);
}
