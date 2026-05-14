' DPWH QAS Inventory - Silent Server Starter
' Runs the backend server hidden on startup

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
Set objWMIService = GetObject("winmgmts:{impersonationLevel=impersonate}!\\.\root\cimv2")

' Get project folder
scriptPath = WScript.ScriptFullName
projectFolder = fso.GetParentFolderName(scriptPath)
backendFolder = projectFolder & "\Backend"

' Check if Backend folder exists
If Not fso.FolderExists(backendFolder) Then
    WScript.Echo "Error: Backend folder not found."
    WScript.Quit 1
End If

' Check if server is already running on port 3000
Set colProcesses = objWMIService.ExecQuery("SELECT * FROM Win32_Process WHERE CommandLine LIKE '%node%' AND CommandLine LIKE '%server%'")
If colProcesses.Count > 0 Then
    ' Server already running, exit silently
    WScript.Quit 0
End If

' Start the server hidden
WshShell.CurrentDirectory = backendFolder
WshShell.Run "cmd /c npm start", 0, False

Set WshShell = Nothing
Set fso = Nothing
Set objWMIService = Nothing
