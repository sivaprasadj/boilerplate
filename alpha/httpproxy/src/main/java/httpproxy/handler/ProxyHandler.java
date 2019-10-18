package httpproxy.handler;

import java.net.Socket;
import java.net.SocketException;
import java.util.Map;

import javax.net.SocketFactory;

import httpproxy.core.Constants;
import httpproxy.core.HttpContext;
import httpproxy.core.HttpHeader;
import httpproxy.core.Util;
import httpproxy.io.IOUtil;
import httpproxy.io.PlainStream;

public class ProxyHandler extends AbstractProxyHandler {

  private PlainStream cltStream;
  private HttpHeader requestHeader;

  private PlainStream svrStream;
  private HttpHeader responseHeader;

  private long startTime;

  public ProxyHandler() {
  }

  @Override
  public void handle(
      final HttpContext context,
      final PlainStream cltStream,
      final HttpHeader requestHeader) throws Exception {

    startTime = System.currentTimeMillis();

    this.cltStream = cltStream;
    this.requestHeader = requestHeader;

    final Socket svrSocket = SocketFactory.getDefault().
        createSocket(getTargetHost(), getTargetPort() );
    try {

      svrStream = context.createStream(svrSocket);

      doRequest(context);
      doResponse(context);

    } finally {
      svrSocket.close();
    }
  }

  protected Map<?, ?> createDetail(final String name, final Object value) {
    return Util.map("targetHost", getTargetHost(),
        "targetPort", Integer.valueOf(getTargetPort() ),
        "targetProxy", Boolean.valueOf(isTargetProxy() ),
        name, value);
  }
  protected void doRequest(final HttpContext context) throws Exception {

    context.getEventTarget().trigger("beforerequest",
        createDetail("requestHeader", requestHeader) );

    svrStream.out.println(requestHeader.getStartLine() );
    int reqContentLength = -1;
    for (String key : requestHeader.getHeaderNames() ) {
      final String lcKey = key.toLowerCase();
      if (!isTargetProxy() && lcKey.equals(Constants.PROXY_CONNECTION) ) {
        console.log("skip header: " + key);
        continue;
      }
      for (final String value : requestHeader.getHeaderValues(key) ) {
        if (lcKey.equals(Constants.CONTENT_LENGTH) ) {
          reqContentLength = Integer.parseInt(value);
        }
        svrStream.out.println(key + ": " + value);
      }
    }
    svrStream.out.println();
    svrStream.out.flush();
    if (reqContentLength != -1) {
      IOUtil.copyFully(cltStream.in, svrStream.out, reqContentLength);
    }
    svrStream.out.flush();
  }

  protected void doResponse(final HttpContext context) throws Exception {

    responseHeader = HttpHeader.readFrom(svrStream.in);

    {
      final int i1 = responseHeader.getStartLine().indexOf('\u0020');
      final int i2 = responseHeader.getStartLine().indexOf('\u0020', i1 + 1);
      if (i1 == -1 || i2 == -1) {
        console.error("bad res start line:" + responseHeader.getStartLine() );
      }
      responseHeader.setAttribute("version",
          responseHeader.getStartLine().substring(0, i1) );
      responseHeader.setAttribute("status",
          Integer.valueOf(responseHeader.getStartLine().substring(i1 + 1, i2) ) );

      if (!isTargetProxy() ) {
        responseHeader.setHeader(Constants.PROXY_CONNECTION, "close");
      }
    }

    context.getEventTarget().trigger("beforeresponse",
        createDetail("responseHeader", responseHeader) );

    console.log(responseHeader.getStartLine() );
    console.log(responseHeader.getHeadersAsString() );

    int resContentLength = -1;
    boolean chunked = false;

    try {
      cltStream.out.println(responseHeader.getStartLine() );
      for (final String key : responseHeader.getHeaderNames() ) {
        final String lcKey = key.toLowerCase();
        for (final String value : responseHeader.getHeaderValues(key) ) {
          if (lcKey.equals(Constants.CONTENT_LENGTH) ) {
            resContentLength = Integer.parseInt(value);
          } else if (lcKey.equals(Constants.TRANSFER_ENCODING) ) {
            chunked = value.equals(Constants.CHUNKED);
          }
          cltStream.out.println(key + ": " + value);
        }
      }
      cltStream.out.println();
      cltStream.out.flush();
    } catch(SocketException e) {
      // ignore
      console.log("response aborted.");
      return;
    }

    int contentLength = 0;
    if (resContentLength != -1) {
      contentLength += IOUtil.copyFully(
          svrStream.in, cltStream.out, resContentLength);
    } else if (chunked) {
      while (true) {
        final String chunk = svrStream.in.readLine();
        final int chunkSize = Integer.parseInt(chunk, 16);
        cltStream.out.println(chunk);
        contentLength += IOUtil.copyFully(svrStream.in, cltStream.out, chunkSize);
        cltStream.out.println(svrStream.in.readLine() );
        cltStream.out.flush();
        if (chunkSize == 0) {
          break;
        }
      }
    } else {
      contentLength += IOUtil.copyFully(svrStream.in, cltStream.out);
    }
    cltStream.out.flush();

    final long time = System.currentTimeMillis() - startTime;
    final StringBuilder buf = new StringBuilder();
    buf.append("done");
    buf.append("/content-length: ");
    buf.append(contentLength);
    buf.append("/");
    buf.append(time);
    buf.append("ms");
    console.log(buf.toString() );
  }
}
