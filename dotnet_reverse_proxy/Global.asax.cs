using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.Configuration;
using log4net;

namespace proxy
{

    public class proxy : HttpApplication
    {
        
        public static string SERVER = ConfigurationManager.AppSettings["SERVER"];

        public static string[] PORTS = ConfigurationManager.AppSettings["PORTS"].Split(',');

        public static string APPNAME = ConfigurationManager.AppSettings["APPNAME"];

        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                "*", // Anything
                "{*.}", 
                new { controller = "Proxy", action = "Proxy"} // Parameter defaults
            );
        }

        protected void Application_Start()
        {

            log4net.Config.XmlConfigurator.Configure();

            AreaRegistration.RegisterAllAreas();

            RegisterRoutes(RouteTable.Routes);
        }

    }
}