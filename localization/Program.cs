using System;
using System.IO;
using System.Xml;
using Saxon.Api;


namespace updateLocalization
{
	class Program
	{
		static void Main(string[] args)
		{
			// Press Ctrl+F5 (or go to Debug > Start Without Debugging) to run your app.
			CreateEnglish20Xlf();
			AddMissing12LangFolders();
			CreateModel();
			CreateReducer();
			CreateEnglishStrings();
			CreateOtherLangStrings();
			CombineStrings();
		}

		private static void CreateEnglish20Xlf()
		{
			var xslt = new FileInfo(@"..\..\From12To20.xsl");
			var input = new FileInfo(@"..\..\TranscriberAdmin-en-1.2.xliff");
			var output = new FileInfo(@"..\..\TranscriberAdmin-en.xlf");

			// Compile stylesheet
			var processor = new Processor();
			var compiler = processor.NewXsltCompiler();
			var executable = compiler.Compile(new Uri(xslt.FullName));
			var transformer = executable.Load();

			// Do transformation to a destination
			var destination = new DomDestination();
			using (var inputStream = input.OpenRead())
			{
				transformer.SetInputStream(inputStream, new Uri(input.DirectoryName));
				transformer.Run(destination);
			}

			// Save result to a file
			destination.XmlDocument.Save(output.FullName);
		}

		private static void AddMissing12LangFolders()
		{
			foreach (var fileInfo in new DirectoryInfo(@"..\..").GetFiles("TranscriberAdmin-*.xlf"))
			{
				var langTag = Path.GetFileNameWithoutExtension(fileInfo.Name).Substring(17);
				if (langTag == "en") continue;
				var langDir = new DirectoryInfo(@"..\..\" + langTag);
				if (!langDir.Exists)
				{
					langDir.Create();
					var dataFile = new StreamReader(@"..\..\TranscriberAdmin-en-1.2.xliff");
					var data = dataFile.ReadToEnd();
					dataFile.Close();
					var result = data.Replace(@"target-language=""en""", @"target-language=""" + langTag + @"""");
					var outData = new StreamWriter(@"..\..\" + langTag + @"\TranscriberAdmin-en-1.2.xliff");
					outData.Write(result);
					outData.Close();
				}
			}
		}

		private static void CreateModel()
		{
			var xslt = new FileInfo(@"..\..\ToModel.xsl");
			var input = new FileInfo(@"..\..\TranscriberAdmin-en-1.2.xliff");
			var output = new FileInfo(@"..\..\localizeModel.tsx");

			// Compile stylesheet
			var processor = new Processor();
			var compiler = processor.NewXsltCompiler();
			var executable = compiler.Compile(new Uri(xslt.FullName));
			var transformer = executable.Load();

			// Do transformation to a destination
			var destination = new DomDestination();
			using (var inputStream = input.OpenRead())
			{
				transformer.SetInputStream(inputStream, new Uri(input.DirectoryName));
				try
				{
					transformer.Run(destination);
				}
				catch (DynamicError e)
				{
					Console.WriteLine(e.LineNumber);
				}
			}

			// Save result to a file
			destination.XmlDocument.Save(output.FullName);
		}

		private static void CreateReducer()
		{
			var xslt = new FileInfo(@"..\..\ToReducer.xsl");
			var input = new FileInfo(@"..\..\TranscriberAdmin-en-1.2.xliff");
			var output = new FileInfo(@"..\..\localizationReducer.tsx");

			// Compile stylesheet
			var processor = new Processor();
			var compiler = processor.NewXsltCompiler();
			var executable = compiler.Compile(new Uri(xslt.FullName));
			var transformer = executable.Load();

			// Do transformation to a destination
			var destination = new DomDestination();
			using (var inputStream = input.OpenRead())
			{
				transformer.SetInputStream(inputStream, new Uri(input.DirectoryName));
				transformer.Run(destination);
			}

			// Save result to a file
			destination.XmlDocument.Save(output.FullName);
		}

		private static void CreateEnglishStrings()
		{
			var xslt = new FileInfo(@"..\..\MakeStrings-12.xsl");
			var input = new FileInfo(@"..\..\TranscriberAdmin-en-1.2.xliff");
			var output = new FileInfo(@"..\..\TranscriberAdmin-en-1.2.xml");

			// Compile stylesheet
			var processor = new Processor();
			var compiler = processor.NewXsltCompiler();
			var executable = compiler.Compile(new Uri(xslt.FullName));
			var transformer = executable.Load();

			// Do transformation to a destination
			var destination = new DomDestination();
			using (var inputStream = input.OpenRead())
			{
				transformer.SetInputStream(inputStream, new Uri(input.DirectoryName));
				transformer.Run(destination);
			}

			// Save result to a file
			destination.XmlDocument.Save(output.FullName);
		}

		private static void CreateOtherLangStrings()
		{
			foreach (var fileInfo in new DirectoryInfo(@"..\..").GetFiles("TranscriberAdmin-*.xlf"))
			{
				var langTag = Path.GetFileNameWithoutExtension(fileInfo.Name).Substring(17);
				var langDir = new DirectoryInfo(@"..\..\" + langTag);
				if (langDir.Exists)
				{
					var xslt = new FileInfo(@"..\..\MakeStrings-12.xsl");
					var input = new FileInfo(@"..\..\" + langTag + @"\TranscriberAdmin-en-1.2.xliff");
					var output = new FileInfo(@"..\..\TranscriberAdmin-en-1.2-" + langTag + @".xml");

					// Compile stylesheet
					var processor = new Processor();
					var compiler = processor.NewXsltCompiler();
					var executable = compiler.Compile(new Uri(xslt.FullName));
					var transformer = executable.Load();

					// Do transformation to a destination
					var destination = new DomDestination();
					using (var inputStream = input.OpenRead())
					{
						transformer.SetInputStream(inputStream, new Uri(input.DirectoryName));
						transformer.Run(destination);
					}

					// Save result to a file
					destination.XmlDocument.Save(output.FullName);
				}
			}
		}

		private static void CombineStrings()
		{
			var xslt = new FileInfo(@"..\..\CombineStrings-12.xsl");
			var input = new FileInfo(@"..\..\TranscriberAdmin-en-1.2.xliff");
			var output = new FileInfo(@"..\..\strings.xml");

			// Compile stylesheet
			var processor = new Processor();
			var compiler = processor.NewXsltCompiler();
			var executable = compiler.Compile(new Uri(xslt.FullName));
			var transformer = executable.Load();

			// Do transformation to a destination
			var destination = new DomDestination();
			using (var inputStream = input.OpenRead())
			{
				transformer.SetInputStream(inputStream, new Uri(input.DirectoryName));
				transformer.Run(destination);
			}

			// Save result to a file
			destination.XmlDocument.Save(output.FullName);
		}


	}
}
