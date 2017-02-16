﻿using System;
using System.IO;
using System.Web.Mvc;
using System.Net;

namespace proxy.Controllers
{
    public class ProxyController : Controller
    {

            protected string svcUrl = proxy.SERVER + ":" + GetPort() ;

            public ActionResult Proxy()
            {
                return Content(grabContent(HttpContext.Request.Url.PathAndQuery.Replace("/"+proxy.APPNAME, "")));
            }

            /// <see>http://stackoverflow.com/questions/3447589/copying-http-request-inputstream</see>
            private string grabContent(string url)
            {
                string content;

                // Create a request for the URL. 		
                var req = HttpWebRequest.Create(svcUrl + url);
                req.Method = HttpContext.Request.HttpMethod;

                //-- No need to copy input stream for GET (actually it would throw an exception)
                if (req.Method != "GET")
                {
                    req.ContentType = "application/json";

                    Request.InputStream.Position = 0;  //***** THIS IS REALLY IMPORTANT GOTCHA

                    var requestStream = HttpContext.Request.InputStream;
                    Stream webStream = null;
                    try
                    {
                        //copy incoming request body to outgoing request
                        if (requestStream != null && requestStream.Length > 0)
                        {
                            req.ContentLength = requestStream.Length;
                            webStream = req.GetRequestStream();
                            requestStream.CopyTo(webStream);
                        }
                    }
                    finally
                    {
                        if (null != webStream)
                        {
                            webStream.Flush();
                            webStream.Close();
                        }
                    }
                }

                // If required by the server, set the credentials.
                req.Credentials = CredentialCache.DefaultCredentials;

                // No more ProtocolViolationException!
                using (HttpWebResponse response = (HttpWebResponse)req.GetResponse())
                {
                    // Display the status.
                    //Console.WriteLine(response.StatusDescription);

                    // Get the stream containing content returned by the server.
                    using (Stream dataStream = response.GetResponseStream())
                    {
                        // Open the stream using a StreamReader for easy access.
                        StreamReader reader = new StreamReader(dataStream);
                        // Read the content. 
                        content = reader.ReadToEnd();
                    }
                }

                return content;
            }
        

        public static string GetPort()
        {
            var r = new Random();
            var num = r.Next(0,proxy.PORTS.Length);
            return proxy.PORTS[num];
        }
    }
}