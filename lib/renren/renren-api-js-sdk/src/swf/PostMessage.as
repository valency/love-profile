package
{
	import flash.events.TimerEvent;
	import flash.external.ExternalInterface;
	import flash.net.LocalConnection;
	import flash.utils.Timer;
	
	public class PostMessage extends Object
	{
		private var callback:String;
		private var origin:String;
		private var connection:LocalConnection;
		
		public function PostMessage()
		{
			ExternalInterface.addCallback("postMessage_init", init);
			ExternalInterface.addCallback("postMessage_send", send);
		}
		
		public function recv(msg:Object, origin:String) : void
		{
			var deliverMessage:Function = function (event:TimerEvent) : void
			{
				try
				{
					ExternalInterface.call(callback, {data:msg, origin:origin, transport:'flash'});
				}
				catch (e:Error)
				{
					trace("call " + callback + " error " + e.toString());
				}
			};
			var timer:* = new Timer(1, 1);
			timer.addEventListener(TimerEvent.TIMER, deliverMessage);
			timer.start();
		}
		
		public function extractComponents(origin:String) : String
		{
			if(!origin)
				return null;
			try
			{
				return /(^\w+:\/\/[^\/]*\/)/.exec(origin)[1];
			}
			catch (e:Error)
			{
			}
			return null;
		}
		
		public function getLocaionComponents() : String
		{
			try
			{
				return extractComponents(ExternalInterface.call("window.location.toString"));
			}
			catch (e:Error)
			{
				trace("get current window location error " + e.toString());
			}
			return null;
		}
		
		public function send(msg:Object, targetOrigin:String) : Boolean
		{
			if (!connection)
			{
				trace("local connection has not been initialized.");
				return false;
			}
			try
			{
				connection.send(encodeURIComponent(targetOrigin), "recv", msg, origin);
			}
			catch (e:Error)
			{
				trace("send error " + e.toString() + ". targetOrigin: " + targetOrigin + ", msg: " + msg);
				return false;
			}
			return true;
		}
		
		public function init(cb:String, origin:String) : Boolean
		{
			var ogn:String = extractComponents(origin);
			if (!ogn || ogn != getLocaionComponents())
			{
				trace("init error, origin must be a URL on the current location: " + getLocaionComponents());
				return false;
			}
			else
			{
				callback = cb;
				if (this.origin == origin)                    
					return true;
				try
				{
					connection = new LocalConnection();
					connection.client = this;
					connection.connect(encodeURIComponent(origin));
					this.origin = origin;
				}
				catch (e:Error)
				{
					trace("init local connect error "+ e.toString());
					return false;
				}
				return true;
			}
		}
	}
}
