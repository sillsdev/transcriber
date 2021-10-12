using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Xml;
using ICSharpCode.SharpZipLib.Zip;
using Newtonsoft.Json;
using Saxon.Api;


namespace updateLocalization
{
	class Program
	{
		static void Main(string[] args)
		{
			// Press Ctrl+F5 (or go to Debug > Start Without Debugging) to run your app.
            ExtractCrowdIn();
			CreateEnglish20Xlf();
			AddMissing12LangFolders();
			CreateModel();
			CreateReducer();
			CreateEnglishStrings();
			CreateOtherLangStrings();
			CombineStrings();
			CleanUp();
			FollowUp();
		}

        private static void ExtractCrowdIn()
        {
            var info =
                new DirectoryInfo(@"..\..").GetFiles(
                    "SILTranscriberTranslations.zip");
            if (info.Length > 0)
            {
                new FastZip().ExtractZip(info[0].FullName, info[0].DirectoryName,
                    ".*");
            }
        }

        private static void CreateEnglish20Xlf()
		{
			XsltProcess(@"From12To20.xsl", @"TranscriberAdmin-en.xlf");
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
			XsltProcess(@"ToModel.xsl", @"localizeModel.tsx");
		}

		private static void CreateReducer()
		{
			XsltProcess(@"ToReducer.xsl", @"localizationReducer.tsx");
		}

		private static void CreateEnglishStrings()
		{
			XsltProcess(@"MakeStrings-12.xsl", @"TranscriberAdmin-en-1.2.xml");
		}

		private static void CreateOtherLangStrings()
		{
			foreach (var fileInfo in new DirectoryInfo(@"..\..").GetFiles("TranscriberAdmin-*.xlf"))
			{
				var langTag = Path.GetFileNameWithoutExtension(fileInfo.Name).Substring(17);
				var langDir = new DirectoryInfo(@"..\..\" + langTag);
				if (!langDir.Exists) continue;
                var devInputInfo = new FileInfo(@"..\..\" + @"TranscriberAdmin-" + langTag + ".xlf");
                var stylesheetParams = new Dictionary<QName, XdmValue> { {new QName("v2File"), XdmValue.MakeValue(new Uri(devInputInfo.FullName))}};
				XsltProcess(@"MakeStrings-12.xsl", @"TranscriberAdmin-en-1.2-" + langTag + @".xml", langTag + @"\TranscriberAdmin-en-1.2.xliff", stylesheetParams);
			}
		}

		private static void CombineStrings()
        {
			XsltProcess(@"CombineStrings-12.xsl", @"strings.xml");
            const string RelPath = @"..\..\";
			var xmlDoc = new XmlDocument();
			xmlDoc.Load($"{RelPath}strings.xml");
			var json = JsonConvert.SerializeXmlNode(xmlDoc.DocumentElement);
            var guid = Guid.NewGuid().ToString().Split('-')[0];
			using (var sw = new StreamWriter($"{RelPath}strings{guid}.json"))
			{
				sw.Write(json.Substring(11, json.Length - 12));
			}

            var outName = new StreamWriter($"{RelPath}exported-strings-name.json");
            outName.Write($"{{ \"stringsName\": \"strings{guid}.json\" }}");
            outName.Close();
        }

		private static void XsltProcess(string xslName, string outName, string inName = "TranscriberAdmin-en-1.2.xliff", Dictionary<QName, XdmValue> stylesheetParams = null)
		{
			var inputInfo = new FileInfo(@"..\..\" + inName);
			var xsltInfo = new FileInfo(@"..\..\" + xslName);

			// Create a Processor instance
			var processor = new Processor();

			// Load the source
			var input = processor.NewDocumentBuilder().Build(new Uri(inputInfo.FullName));

			// Create a transformer for the stylesheet.
			var transformer = processor.NewXsltCompiler().Compile(new Uri(xsltInfo.FullName)).Load30();

			// Create a serializer, with output to the standard output stream
			var serializer = processor.NewSerializer();

            // Parameters
		    if (stylesheetParams != null)
		    {
                transformer.SetStylesheetParameters(stylesheetParams);
		    }

			using (var textWriter = new StreamWriter(@"..\..\" + outName))
			{
				serializer.SetOutputWriter(textWriter);

				// Transform the source XML and serialize the result document
				transformer.ApplyTemplates(input, serializer);
			}
		}

		private static void CleanUp()
		{
			foreach (var fileInfo in new DirectoryInfo(@"..\..").GetFiles("TranscriberAdmin-*.xlf"))
			{
				var langTag = Path.GetFileNameWithoutExtension(fileInfo.Name).Substring(17);
				var langDir = new DirectoryInfo(@"..\..\" + langTag);
				if (!langDir.Exists) continue;
				new DirectoryInfo(@"..\..\" + langTag).Delete(true);
			}

			foreach (var fileInfo in new DirectoryInfo(@"..\..\").GetFiles(@"*.xml"))
			{
				new FileInfo(fileInfo.FullName).Delete();
			}
		}

		private static void FollowUp()
		{
			var followUpInfo = new FileInfo(@"..\..\UpdateLocalizationFollowUp.bat");
			if (!followUpInfo.Exists) return;
			var comSpec = Environment.GetEnvironmentVariable("ComSpec");
			var process = new Process
			{
				StartInfo = new ProcessStartInfo
				{
					FileName = comSpec,
					Arguments = "/c " + followUpInfo.FullName
				}
			};
			process.Start();
		}

	}
}
