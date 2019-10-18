package httpproxy.core;

import httpproxy.io.PlainStream;

public interface HttpHandler {
  void handle(HttpContext context, Console console,
      PlainStream cltStream, HttpHeader requestHeader) throws Exception;
}
