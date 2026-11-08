# Optional Windows-only regeneration. Uses the existing cauldron artwork unchanged.
Add-Type -AssemblyName System.Drawing
$projectDirectory = Split-Path -Parent $PSScriptRoot
$artwork = [System.Drawing.Image]::FromFile((Join-Path $projectDirectory 'public/assets/Cauldron.png'))
try {
    $iconDirectory = Join-Path $projectDirectory 'public/icons'
    New-Item -ItemType Directory -Path $iconDirectory -Force | Out-Null
    foreach ($size in @(192, 512)) {
        $bitmap = [System.Drawing.Bitmap]::new($size, $size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#092519'))
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $ratio = ($size * 0.84) / [Math]::Max($artwork.Width, $artwork.Height)
            $width = [int][Math]::Round($artwork.Width * $ratio)
            $height = [int][Math]::Round($artwork.Height * $ratio)
            $graphics.DrawImage($artwork, [int](($size - $width) / 2), [int](($size - $height) / 2), $width, $height)
            $bitmap.Save((Join-Path $iconDirectory "alchemist-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        }
        finally {
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
}
finally {
    $artwork.Dispose()
}
