$ports = @(3005, 8000)

foreach ($port in $ports) {
  $processIds = @()
  $connections = netstat -ano | Select-String ":$port" | Where-Object { $_.ToString() -match "LISTENING" }
  foreach ($line in $connections) {
    $parts = ($line.ToString() -split "\s+") | Where-Object { $_ -ne "" }
    if ($parts.Length -ge 5) {
      $processId = $parts[-1]
      if ($processId -match "^\d+$" -and $processId -ne "0") {
        $processIds += $processId
      }
    }
  }

  $processIds = $processIds | Sort-Object -Unique

  foreach ($processId in $processIds) {
    try {
      Stop-Process -Id ([int]$processId) -Force -ErrorAction Stop
      Write-Host "Stopped PID $processId on port $port"
    } catch {
      Write-Host "Could not stop PID $processId on port $port"
    }
  }
}
