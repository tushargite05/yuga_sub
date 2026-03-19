namespace YugaSubstrate.Models;

/// <summary>
/// Time windows for the substrate workflow (mirrors <c>WINDOWS</c> in wwwroot/js/substrateApp.js).
/// </summary>
public static class SubstrateTimeWindows
{
    public static IReadOnlyList<string> Labels { get; } =
    [
        "10 min",
        "30 min",
        "1 hour",
        "2 hour",
        "3 hour",
        "4 hour",
        "6 hour",
        "24 hour",
        "1 day",
    ];
}
