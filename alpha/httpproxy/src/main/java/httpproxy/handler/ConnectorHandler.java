package httpproxy.handler;

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

  private Console console;

  @Override
  public void handle(
      final HttpContext context,
      final Console console,
      final PlainStream cltStream,
      final HttpHeader requestHeader) throws Exception {

    this.console = console;

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

      final Future<Integer> reqCon =
          connect(cltStream.in, svrStream.out, false);
      final Future<Integer> resCon =
          connect(svrStream.in, cltStream.out, true);

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
      final ByteInput in, final ByteOutput out, final boolean response) {
    return connectorService.submit(new Callable<Integer>() {
      @Override
      public Integer call() throws Exception {
          int readLen = 0;
          while (true) {
            try {
              final int b = in.read();
              if (b == -1) {
                break;
              }
              try {
                out.write(b);
                out.flush();
              } catch(SocketException e) {
                if (response) {
                  console.log("response aborted.");
                  break;
                } else {
                  throw e;
                }
              }
              readLen += 1;
            } catch(SocketException e) {
              console.error(e);
              break;
            }
          }
          return Integer.valueOf(readLen);
      }
    });
  }
}
