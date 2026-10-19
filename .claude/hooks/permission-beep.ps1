# Runs on the PermissionRequest/Notification hooks so a sound plays when Claude Code needs user input.
# Sleep keeps the process alive long enough for the async sound to finish playing before it exits.
[System.Media.SystemSounds]::Asterisk.Play()
Start-Sleep -Milliseconds 1000
