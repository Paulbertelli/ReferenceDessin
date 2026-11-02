using System.Net.Http.Headers;

namespace ReferenceDessin.Infrastructure.Pinterest;

public sealed class PinterestAuthenticationHandler(
    PinterestAccessTokenProvider accessTokenProvider)
    : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var accessToken =
            await accessTokenProvider.GetAccessTokenAsync(
                cancellationToken);

        request.Headers.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                accessToken);

        return await base.SendAsync(
            request,
            cancellationToken);
    }
}