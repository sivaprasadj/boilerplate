package httpproxy.core;

import java.io.EOFException;
import java.io.IOException;
import java.net.Socket;
import java.net.SocketException;
import java.net.URL;
import java.util.Map;
import java.util.regex.Pattern;

import httpproxy.handler.AbstractProxyHandler;
import httpproxy.handler.ConnectorHandler;
import httpproxy.handler.ProxyHandler;
import httpproxy.io.PlainStream;

public class HttpSession extends HttpObject implements Runnable {

  private static final String DIRECT = "DIRECT";

  private static final Pattern STR_PAT = Pattern.compile("\\u0020");

  private final HttpContext context;
  private final Socket cltSocket;

  public HttpSession(final HttpContext context, final Socket cltSocket) {
    this.context = context;
    this.cltSocket = cltSocket;
  }

  protected void doSession() throws Exception {
    try {

      final PlainStream cltStream = context.createStream(cltSocket);
      final HttpHeader requestHeader = HttpHeader.readFrom(cltStream.in);
      console.log(requestHeader.getStartLine() );
      console.log(requestHeader.getHeadersAsString() );

      final String[] reqTokens = STR_PAT.split(requestHeader.getStartLine() );
      if (reqTokens.length != 3) {
        throw new IOException("bad req start line:" + requestHeader.getStartLine() );
      }
      final String method = reqTokens[0];
      final String path = reqTokens[1];
      final String version = reqTokens[2];

      requestHeader.setAttribute("method", method);
      requestHeader.setAttribute("path", path);
      requestHeader.setAttribute("version", version);

      if (method.equalsIgnoreCase("CONNECT") ) {

        int index = path.indexOf(':');
        if (index == -1) {
          console.error("bad request:" + path);
          return;
        }
        final String host = path.substring(0, index);
        final int port = Integer.parseInt(path.substring(index + 1) );
        final Map<?,?> proxyInfo = Util.map(
            "host", host,
            "port", Integer.valueOf(port) );
        context.getEventTarget().trigger("getproxy", proxyInfo);
        final String proxy = (String)proxyInfo.get("proxy");

        if (DIRECT.equals(proxy) ) {

          final ConnectorHandler handler = new ConnectorHandler();
          handler.setTargetHost(host);
          handler.setTargetPort(port);
          handler.setTargetProxy(false);
          handler.handle(context, cltStream, requestHeader);

        } else if (proxy != null) {

          final ConnectorHandler handler = new ConnectorHandler();
          setTarget(handler, proxy);
          handler.setTargetProxy(true);
          handler.handle(context, cltStream, requestHeader);

        } else {
          console.error("bad host:" + host);
        }

      } else {

        final URL url = new URL(path);
        final Map<?,?> proxyInfo = Util.map(
            "host", url.getHost(),
            "port", Integer.valueOf(url.getPort() ) );
        context.getEventTarget().trigger("getproxy", proxyInfo);
        final String proxy = (String)proxyInfo.get("proxy");

        if (DIRECT.equals(proxy) ) {

          // rewrite start line.
          requestHeader.setStartLine(method + " " +
              url.getFile() + " " + version);
          final ProxyHandler handler = new ProxyHandler();
          handler.setTargetHost(url.getHost() );
          handler.setTargetPort(url.getPort() != -1? url.getPort(): 80);
          handler.setTargetProxy(false);
          handler.handle(context, cltStream, requestHeader);

        } else if (proxy != null) {

          final ProxyHandler handler = new ProxyHandler();
          setTarget(handler, proxy);
          handler.setTargetProxy(true);
          handler.handle(context, cltStream, requestHeader);

        } else {
          console.error("bad host:" + url.getHost() );
        }
      }

    } finally {
      cltSocket.close();
    }
  }

  protected static void setTarget(
      final AbstractProxyHandler handler, final String proxy) {
    final int index = proxy.indexOf(':');
    final String host = index != -1? proxy.substring(0, index) : proxy;
    final int port = index != -1?
        Integer.parseInt(proxy.substring(index + 1) ) : 8080;
    handler.setTargetHost(host);
    handler.setTargetPort(port);
  }

  @Override
  public void run() {
    try {
      doSession();
    } catch(RuntimeException e) {
      throw e;
    } catch(SocketException e) {
      console.error(e);
    } catch(EOFException e) {
      console.error(e);
    } catch(Exception e) {
      throw new RuntimeException(e);
    }
  }
}
