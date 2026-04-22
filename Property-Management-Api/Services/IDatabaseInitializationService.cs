namespace Property_Management_Api.Services;

public interface IDatabaseInitializationService
{
    Task InitializeAsync(CancellationToken cancellationToken);
}
