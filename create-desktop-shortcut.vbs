Set shell = CreateObject("WScript.Shell")
Set link = shell.CreateShortcut("C:\Users\Admin\Desktop\Kasir Toko Bangunan.lnk")
link.TargetPath = "D:\Kuliah\Project\kasir-toko-bangunan\release\win-unpacked\Kasir Toko Bangunan.exe"
link.Arguments = ""
link.WorkingDirectory = "D:\Kuliah\Project\kasir-toko-bangunan\release\win-unpacked"
link.Description = "Buka aplikasi desktop Kasir Toko Bangunan"
link.IconLocation = "C:\Windows\System32\shell32.dll,14"
link.Save
WScript.Echo "Shortcut target: " & link.TargetPath
