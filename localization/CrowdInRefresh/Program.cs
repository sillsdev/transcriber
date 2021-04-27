using System;
using System.IO;
using System.IO.Compression;

namespace CrowdInRefresh
{
	class Program
	{
		static void Main(string[] args)
		{
			Console.WriteLine($"Processing [{string.Join(", ", args)}]");
            if (args.Length == 0) throw new FileNotFoundException("No input given");
            RenameFolders(args);
            Console.Write(@"Press Enter to continue...");
            var text = Console.ReadLine();
        }

        private static void RenameFolders(string[] args)
        {
            var name = Path.GetTempFileName();
            File.Delete(name);
            Console.WriteLine($"creating temporary {name}");
            ZipFile.ExtractToDirectory(args[0], name);
            DirectoryInfo di = new DirectoryInfo(name);
            foreach (DirectoryInfo info in di.GetDirectories())
            {
                var part = info.Name.Split('-');
                if (part.Length > 1)
                {
                    info.MoveTo(Path.Combine(name,part[0]));
                }
            }
            var outInfo = new FileInfo(@"..\..\..\..\SILTranscriberTranslations.zip");
            if (outInfo.Exists) File.Delete(outInfo.FullName);
            ZipFile.CreateFromDirectory(name, outInfo.FullName);
            Directory.Delete(name, true);
        }
    }
}
