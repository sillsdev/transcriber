Write-Output "{ ""date"": ""$(Get-Date -Format u)"" }" | out-file  "src/buildDate.json" -encoding utf8
