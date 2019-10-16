package httpproxy.core;

import java.io.IOException;
import java.net.Socket;

import httpproxy.event.EventTarget;
import httpproxy.io.PlainStream;

public interface HttpContext {
  PlainStream createStream(Socket socket) throws IOException;
  EventTarget getEventTarget();
}
