using System;
using System.IO;
using System.Web.Mvc;
using System.Net;
using log4net;

namespace proxy.Controllers
{
    public class ProxyController : Controller
    {

        private static readonly log4net.ILog log =
        log4net.LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        protected string svcUrl = proxy.SERVER + ":" + GetPort();

        public ActionResult Proxy()
        {
            var path = HttpContext.Request.Url.PathAndQuery;
            var wr = grabContent(path.Replace("/" + proxy.APPNAME, ""), HttpContext.Request.Url.Scheme + "://" + HttpContext.Request.Url.Host + path);
            log.Debug("SHIZ:" + wr.content_type);
            return Content(wr.content, wr.content_type);
        }

        /// <see>http://stackoverflow.com/questions/3447589/copying-http-request-inputstream</see>
        private web_response grabContent(string url, string path) {

            web_response myresponse = new web_response();

            // Create a request for the URL.        
            var req = (HttpWebRequest)HttpWebRequest.Create(svcUrl + url);

            req.Referer = path;
            req.Method = HttpContext.Request.HttpMethod;
            log.Debug(req.Method + " " + svcUrl + url);
            //-- No need to copy input stream for GET (actually it would throw an exception)
            if (req.Method != "GET") {

                req.ContentType = "application/json";

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
                catch (Exception ex) {
                    log.Debug(ex.InnerException);
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

            try {

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
                        myresponse.content = reader.ReadToEnd();
                    }
                    myresponse.content_type = response.Headers["Content-Type"];
                }
               
                return myresponse;
            } catch (WebException e) {
                using (WebResponse response = e.Response)
                {
                    HttpWebResponse httpResponse = (HttpWebResponse)response;
                    using (Stream data = response.GetResponseStream())
                    using (var reader = new StreamReader(data))
                    {
                        string text = reader.ReadToEnd();

                        myresponse.content="{'status':'fail', 'message':'" + text + "'}";
                        myresponse.content_type = "application/json";
                        return myresponse;
                    }
                }
            }
        }

        public static string GetPort()
        {
            var r = new Random();
            var num = r.Next(0, proxy.PORTS.Length);
            return proxy.PORTS[num];
        }

        private class web_response{
            public string content {get; set;}
            public string content_type { get; set; }

        }
    }
}
