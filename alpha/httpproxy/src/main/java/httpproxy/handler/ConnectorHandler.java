package httpproxy.handler;

import java.io.IOException;
import java.net.Socket;
import java.net.SocketException;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadFactory;

import javax.net.SocketFactory;

import httpproxy.core.Console;
import httpproxy.core.HttpContext;
import httpproxy.core.HttpHeader;
import httpproxy.io.ByteInput;
import httpproxy.io.ByteOutput;
import httpproxy.io.PlainStream;

public class ConnectorHandler extends AbstractProxyHandler {

  @Override
  public void handle(
      final HttpContext context,
      final Console console,
      final PlainStream cltStream,
      final HttpHeader requestHeader) throws Exception {

    final long startTime = System.currentTimeMillis();

    final Socket svrSocket = SocketFactory.getDefault().
        createSocket(getTargetHost(), getTargetPort() );
    try {

      final PlainStream svrStream = context.createStream(svrSocket);

      if (isTargetProxy() ) {

        svrStream.out.println(requestHeader.getStartLine() );
        for (final String key : requestHeader.getHeaderNames() ) {
          for (final String value : requestHeader.getHeaderValues(key) ) {
            svrStream.out.println(key + ": " + value);
          }
        }
        svrStream.out.println();
        svrStream.out.flush();
      }

      final HttpHeader responseHeader;
      if (isTargetProxy() ) {
        responseHeader = HttpHeader.readFrom(svrStream.in);
      } else{
        responseHeader = new HttpHeader();
        responseHeader.setStartLine("HTTP/1.1 200 Connection established");
      }

      console.log(responseHeader.getStartLine() );
      if (responseHeader.getHeaderNames().iterator().hasNext() ) {
        console.log(responseHeader.getHeadersAsString() );
      }

      cltStream.out.println(responseHeader.getStartLine() );
      for (final String key : responseHeader.getHeaderNames() ) {
        for (final String value : responseHeader.getHeaderValues(key) ) {
          cltStream.out.println(key + ": " + value);
        }
      }
      cltStream.out.println();
      cltStream.out.flush();

      final Future<Integer> reqCon = connect(cltStream.in, svrStream.out);
      final Future<Integer> resCon = connect(svrStream.in, cltStream.out);

      final int reqLen = reqCon.get().intValue();
      final int resLen = resCon.get().intValue();

      final long time = System.currentTimeMillis() - startTime;
      final StringBuilder buf = new StringBuilder();
      buf.append("done");
      buf.append("/req-length: ");
      buf.append(reqLen);
      buf.append("/res-length: ");
      buf.append(resLen);
      buf.append("/");
      buf.append(time);
      buf.append("ms");
      console.log(buf.toString() );

    } finally {
      svrSocket.close();
    }
  }

  private static int connId = 1;
  private static final ExecutorService connectorService =
      Executors.newCachedThreadPool(new ThreadFactory() {
        @Override
        public Thread newThread(final Runnable r) {
          final Thread t = new Thread(r);
          t.setName("connector-" + connId++);
          return t;
        }
      });

  protected Future<Integer> connect(
      final ByteInput in, final ByteOutput out) {
    return connectorService.submit(new Callable<Integer>() {
      protected boolean isShutdown() throws IOException {
        return in.isShutdown() && out.isShutdown();
      }
      
      @Override
      public Integer call() throws Exception {

        final byte[] buf = new byte[8192];
        int readLen = 0;

        while (true) {
          try {

            final int len = in.read(buf);
            if (len == -1) {
              break;
            }

            if (isShutdown() ) {
              break;
            }

            out.write(buf, 0, len);
            out.flush();
            readLen += len;

            if (isShutdown() ) {
              break;
            }

          } catch(SocketException e) {
            break;
          }
        }

        return Integer.valueOf(readLen);
      }
    });
  }
}
