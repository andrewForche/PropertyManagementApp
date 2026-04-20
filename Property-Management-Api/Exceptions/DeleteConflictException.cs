namespace Property_Management_Api.Exceptions;

public sealed class DeleteConflictException : Exception
{
    public DeleteConflictException(string message)
        : base(message)
    {
    }
}
