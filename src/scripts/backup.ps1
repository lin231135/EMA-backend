param(
  [string]$DbContainer = "ema-db",
  [string]$DbName = "elliesdb",
  [string]$DbUser = "postgres",
  [string]$BackupDir = "./backups"
)
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$file = Join-Path $BackupDir "$($DbName)_$ts.sql.gz"
Write-Host "[EMA] Dumping $DbName from $DbContainer -> $file"
docker exec -i $DbContainer pg_dump -U $DbUser $DbName | gzip > $file
Write-Host "[EMA] Done."