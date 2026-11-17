using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;

namespace SalaCunaPDI.API.Helpers;

/// <summary>
/// Validador de seguridad para archivos PDF subidos al servidor.
/// Verifica extensión, tamaño máximo, firma binaria (%PDF-) y sanitiza nombres de archivo.
/// </summary>
public static class PdfFileValidator
{
    public const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB
    private static readonly byte[] PdfMagicBytes = { 0x25, 0x50, 0x44, 0x46, 0x2D }; // "%PDF-"

    public static void ValidatePdfFile(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("El archivo proporcionado está vacío o no fue adjuntado.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new ArgumentException($"El archivo excede el tamaño máximo permitido de {MaxFileSizeBytes / (1024 * 1024)} MB.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Solo se permiten archivos con extensión .pdf.");
        }

        // Validación de firma mágica binaria (%PDF-) para prevenir archivos ejecutables renombrados
        using var stream = file.OpenReadStream();
        if (stream.Length < PdfMagicBytes.Length)
        {
            throw new ArgumentException("El archivo no posee una estructura PDF válida.");
        }

        var headerBuffer = new byte[PdfMagicBytes.Length];
        var bytesRead = stream.Read(headerBuffer, 0, PdfMagicBytes.Length);
        if (bytesRead < PdfMagicBytes.Length || !headerBuffer.SequenceEqual(PdfMagicBytes))
        {
            throw new ArgumentException("El contenido binario del archivo no corresponde a un documento PDF válido (firma %PDF- ausente).");
        }
    }

    public static string SanitizeFileName(string originalFileName)
    {
        var nameWithoutExt = Path.GetFileNameWithoutExtension(originalFileName);
        var sanitized = Regex.Replace(nameWithoutExt, @"[^a-zA-Z0-9_\-]", "_");
        if (string.IsNullOrWhiteSpace(sanitized))
        {
            sanitized = "documento";
        }
        if (sanitized.Length > 80)
        {
            sanitized = sanitized[..80];
        }
        return $"{sanitized}.pdf";
    }
}
