package httpproxy.handler;

import java.net.Socket;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadFactory;

import javax.net.SocketFactory;

import httpproxy.core.Console;
import httpproxy.core.HttpContext;
import httpproxy.core.HttpHeader;
import httpproxy.io.IOUtil;
import httpproxy.io.PlainStream;

/**
 * ConnectorHandler
 * @author kazuhiko arase
 */
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

      svrSocket.setSoTimeout(5000);

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

      final boolean[] shutdown = { false };
      final Future<Integer> reqCon = connect(cltStream, svrStream, shutdown);
      final Future<Integer> resCon = connect(svrStream, cltStream, shutdown);

      final int reqLen = reqCon.get().intValue();
      final int resLen = resCon.get().intValue();

      final long time = System.currentTimeMillis() - startTime;
      final StringBuilder buf = new StringBuilder();
      buf.append("done");
      buf.append("/req-length:");
      buf.append(reqLen);
      buf.append("/res-length:");
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
      final PlainStream inStream, final PlainStream outStream,
      final boolean[] shutdown) {

    return connectorService.submit(new Callable<Integer>() {

      @Override
      public Integer call() throws Exception {

        int len;
        int readLen = 0;

        try {

          while (true) {

            synchronized(shutdown) {
              shutdown[0] |= inStream.socket.isInputShutdown();
              if (shutdown[0]) {
                break;
              }
            }

            if ( (len = inStream.in.available() ) > 0) {
              readLen += IOUtil.copyFully(inStream.in, outStream.out, len);
              outStream.out.flush();
            } else {
              Thread.sleep(50);
            }
          }

        } catch(SocketTimeoutException e) {
          // ignore
        } catch(SocketException e) {
          // ignore
        }

        return Integer.valueOf(readLen);
      }
    });
  }
}
