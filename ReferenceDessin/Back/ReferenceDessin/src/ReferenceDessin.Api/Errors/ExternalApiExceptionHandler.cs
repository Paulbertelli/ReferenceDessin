using System.Diagnostics;
using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ReferenceDessin.Api.Errors;

public sealed class ExternalApiExceptionHandler(
    ILogger<ExternalApiExceptionHandler> logger,
    IProblemDetailsService problemDetailsService)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var requestTimedOut =
            exception is OperationCanceledException &&
            !httpContext.RequestAborted.IsCancellationRequested;

        var statusCode = exception switch
        {
            HttpRequestException =>
                StatusCodes.Status502BadGateway,

            JsonException =>
                StatusCodes.Status502BadGateway,

            _ when requestTimedOut =>
                StatusCodes.Status504GatewayTimeout,

            _ => (int?)null
        };

        if (statusCode is null)
        {
            return false;
        }

        logger.LogError(
            exception,
            "Une erreur est survenue pendant l'appel au service externe.");

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = statusCode == StatusCodes.Status504GatewayTimeout
                ? "Le service d’images ne répond pas."
                : "Le service d’images est indisponible.",
            Detail = statusCode == StatusCodes.Status504GatewayTimeout
                ? "Pexels a mis trop de temps à répondre."
                : "Les images n’ont pas pu être récupérées auprès de Pexels.",
            Instance = httpContext.Request.Path
        };

        problemDetails.Extensions["traceId"] =
            Activity.Current?.Id ?? httpContext.TraceIdentifier;

        httpContext.Response.StatusCode = statusCode.Value;

        await problemDetailsService.WriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = httpContext,
                ProblemDetails = problemDetails
            });

        return true;
    }
}