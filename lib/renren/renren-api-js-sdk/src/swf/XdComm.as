package 
{
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.external.ExternalInterface;
	import flash.net.*;
	import flash.system.Security;    
	
	public class XdComm extends Sprite
	{
		private var _cache:SharedObject;
		private var postMessage:PostMessage;
		private var _cacheContext:String = "unknown";
		private static var requestIdCount:int = 0;
		
		public function XdComm()
		{
			Security.allowDomain("*");
			Security.allowInsecureDomain("*");
			addEventListener(Event.ENTER_FRAME, init);
		}
		
		private function init(event:Event) : void
		{
			removeEventListener(Event.ENTER_FRAME, init);
			postMessage = new PostMessage();
			ExternalInterface.addCallback("sendXdHttpRequest", sendXdHttpRequest);
			ExternalInterface.addCallback("setCache", setCache);
			ExternalInterface.addCallback("getCache", getCache);
			ExternalInterface.addCallback("setCacheContext", setCacheContext);
			ExternalInterface.addCallback("clearAllCache", clearAllCache);
			ExternalInterface.call(stage.loaderInfo.parameters.onReady || "Renren_OnFlashXdCommReady");
		}
		
		public function sendXdHttpRequest(method:String, url:String, params:String, headers:Object, callback:String = "Renren_OnHttpResult", reqId:String = "") : String
		{
			if (url.indexOf("https://") != 0 && url.indexOf("http://") != 0)
			{
				url = "http://" + url;
			}
			var req:* = new URLRequest(url);
			req.method = method;
			req.data = params;
			if (headers != null)
			{
				for(var k:String in headers){
					var v:String = headers[k];
					req.requestHeaders.push(new URLRequestHeader(k, v));
				}
			}
			var loader:URLLoader = new URLLoader();
			if(reqId == "")
				reqId = new String(XdComm.requestIdCount++);
			loader.addEventListener(Event.COMPLETE, function (event:Event) : void
				{
					ExternalInterface.call(callback, reqId, loader.data.toString());
				});
			try	{
				loader.load(req);
			} catch(e:Error){
				trace("send XdHttpRequest error " + e.toString());
				return null;
			}
			return reqId;
		}
		
		private function get cache() : SharedObject
		{
			if (_cache == null)
			{
				_cache = SharedObject.getLocal("cache");
			}
			return _cache;
		}
		
		private function get contextCache() : Object
		{
			var context:* = cache.data[_cacheContext];
			if (context == null)
			{
				context = new Object();
				cache.data[_cacheContext] = context;
			}
			return context;
		}
		
		private function setCacheContext(cacheContext:String = "unknown") : void
		{           
			_cacheContext = cacheContext;
		}
		
		private function getCache(name:String) : String
		{
			return contextCache[name];
		}
		
		private function setCache(name:String, value:String) : void
		{
			
			contextCache[name] = value;
			cache.flush();
		}
		
		private function clearAllCache() : void
		{
			cache.clear();
			cache.flush();
		}
		
	}
}
