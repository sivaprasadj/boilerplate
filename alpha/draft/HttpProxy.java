import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.FilterInputStream;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketException;
import java.net.URL;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.concurrent.Callable;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadFactory;
import java.util.regex.Pattern;

import javax.net.ServerSocketFactory;
import javax.net.SocketFactory;

public class HttpProxy {

  public static void main(final String[] args) throws Exception {
    new HttpProxy().start();
  }

  private ServerSocket serverSocket;
  private ExecutorService es;

  public HttpProxy() {
  }

  public void start() throws Exception {

    console.log("starting http-proxy...");

    final Properties props = loadProperties();
    final int port = Integer.parseInt(props.getProperty("port", "8080") );

    serverSocket = ServerSocketFactory.getDefault().createServerSocket(port);
    console.log("server started at port " + port);

    final List<String> hosts =
        Arrays.asList(props.getProperty("hosts", "").split("[,;\\s]+") );
    console.log("accept hosts: " + hosts);
    final String proxy = props.getProperty("proxy");
    console.log("proxy: " + (proxy != null? proxy : "none") );

    // emulate slow network.
    final NetworkEmulator emu = new NetworkEmulator();
    emu.setBps(5L * 1024 * 1024);
    //emu.setBps(10L * 1024 * 1024);
//    emu.setBps(100L * 1024 * 1024);
    emu.start();

    final HttpContext context = new HttpContext() {

      @Override
      public String getProxy(final String host) {
        if (proxy == null) {
          return DIRECT;
        } else {
          return hosts.contains(host)? DIRECT : proxy;
        }
      }

      @Override
      public HttpStream createStream(final Socket socket) throws IOException {
        ByteInput in = new ByteInput() {
          private final InputStream in =
              new BufferedInputStream(socket.getInputStream() );
          @Override
          public int read() throws IOException {
            return in.read();
          }
         };
        ByteOutput out = new ByteOutput() {
          private final OutputStream out =
              new BufferedOutputStream(socket.getOutputStream() );
          @Override
          public void write(final int b) throws IOException {
            out.write(b);
          }
          @Override
          public void flush() throws IOException {
            out.flush();
          }
        };
        in = emu.wrap(in);
        out = emu.wrap(out);
        return new HttpStream(in, out);
      }
    };

    final int[] id = { 1 };
    es = Executors.newFixedThreadPool(50, new ThreadFactory() {
      @Override
      public Thread newThread(final Runnable r) {
        final Thread t = new Thread(r);
        t.setName("proxy-" + id[0]++);
        return t;
      }
    });
    while (true) {
      es.execute(new HttpSession(context, serverSocket.accept() ) );
    }
  }

  protected Properties loadProperties() throws Exception {
    final Properties props = new Properties();
    final InputStream in =
        getClass().getResourceAsStream("HttpProxy.properties");
    if (in == null) {
      return props;
    }
    try {
      props.load(in);
      return props;
    } finally {
      in.close();
    }
  }

  protected static class NetworkEmulator {
    private static final long FEED_INTERVAL_IN_MILLIS = 50L;
    private final Object lock = new Object();
    private Executor es;
    private long bps = 0;
    private long bufInBits = 0;
    public NetworkEmulator() {
    }
    public long getBps() {
      return bps;
    }
    public void setBps(long bps) {
      final DecimalFormat fmt = new DecimalFormat("###,###,###,###,##0");
      console.log("network speed: " + fmt.format(bps / 8) +
          "[bytes per second] (" +
          fmt.format(bps / 1024 / 1024) + "Mbps)");
      this.bps = bps;
    }
    public void start() {
      es = Executors.newSingleThreadExecutor(new ThreadFactory() {
        @Override
        public Thread newThread(final Runnable r) {
          final Thread t = new Thread(r);
          t.setName("network-feeder");
          return t;
        }
      });
      es.execute(new Runnable() {
        @Override
        public void run() {
          try {
            doTimer();
          } catch(RuntimeException e) {
            throw e;
          } catch(Exception e) {
            throw new RuntimeException(e);
          }
        }
      });
      console.log("timer started.");
    }
    protected void doTimer() throws Exception {
      long lastTime = System.currentTimeMillis();
      while (true) {
        synchronized(lock) {
          final long time = System.currentTimeMillis();
          final long feed = bps * (time - lastTime) / 1000;
          bufInBits = feed;
          lastTime = time;
          lock.notifyAll();
        }
        Thread.sleep(FEED_INTERVAL_IN_MILLIS);
      }
    }
    protected void consume() {
      synchronized(lock) {
        try {
          while (bufInBits < 8) {
            lock.wait();
          }
        } catch(InterruptedException e) {
          throw new RuntimeException(e);
        }
        bufInBits -= 8;
      }
    }
    public ByteInput wrap(final ByteInput in) {
      return new ByteInput() {
        @Override
        public int read() throws IOException {
          consume();
          return in.read();
        }
      };
    }
    public ByteOutput wrap(final ByteOutput out) {
      return new ByteOutput() {
        @Override
        public void write(final int b) throws IOException {
          consume();
          out.write(b);
        }
        @Override
        public void flush() throws IOException {
          out.flush();
        }
      };
    }
  }

  public interface HttpContext {
    String DIRECT = "DIRECT";
    String getProxy(String host);
    HttpStream createStream(Socket socket) throws IOException;
  }

  public interface HttpHandler {
    void handle(HttpContext context,
        HttpStream cltStream, HttpHeader reqHeader) throws Exception;
  }

  protected static abstract class AbstractProxyHandler
  implements HttpHandler {
    private String targetHost;
    private int targetPort;
    private boolean targetProxy;
    protected AbstractProxyHandler() {
    }
    public String getTargetHost() {
      return targetHost;
    }
    public void setTargetHost(String targetHost) {
      this.targetHost = targetHost;
    }
    public int getTargetPort() {
      return targetPort;
    }
    public void setTargetPort(int targetPort) {
      this.targetPort = targetPort;
    }
    public boolean isTargetProxy() {
      return targetProxy;
    }
    public void setTargetProxy(boolean targetProxy) {
      this.targetProxy = targetProxy;
    }
  }

  protected static class ConnectorHandler extends AbstractProxyHandler {

    @Override
    public void handle(
        final HttpContext context,
        final HttpStream cltStream,
        final HttpHeader reqHeader) throws Exception {

      final long startTime = System.currentTimeMillis();

      final Socket svrSocket = SocketFactory.getDefault().
          createSocket(getTargetHost(), getTargetPort() );
      try {

        final HttpStream svrStream = context.createStream(svrSocket);

        if (isTargetProxy() ) {

          svrStream.out.println(reqHeader.getStartLine() );
          for (Entry<String, List<String>> header :
              reqHeader.getHeaders().entrySet() ) {
            for (final String value : header.getValue() ) {
              svrStream.out.println(header.getKey() + ": " + value);
            }
          }
          svrStream.out.println();
          svrStream.out.flush();
        }

        final HttpHeader resHeader;
        if (isTargetProxy() ) {
          resHeader = HttpHeader.readFrom(svrStream.in);
        } else{
          resHeader = new HttpHeader();
          resHeader.setStartLine("HTTP/1.1 200 Connection established");
        }

        console.log(resHeader.getStartLine() );
        if (!resHeader.getHeaders().isEmpty() ) {
          console.log(resHeader.getHeaders().toString() );
        }

        cltStream.out.println(resHeader.getStartLine() );
        for (Entry<String, List<String>> header :
            resHeader.getHeaders().entrySet() ) {
          for (final String value : header.getValue() ) {
            cltStream.out.println(header.getKey() + ": " + value);
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
        buf.append("/req-length: " + reqLen);
        buf.append("/res-length: " + resLen);
        buf.append("/" + time + "ms");
        console.log(buf.toString() );

      } finally {
        svrSocket.close();
      }
    }

    private static int connId = 1;;
    private static final ExecutorService connectorService =
        Executors.newCachedThreadPool(new ThreadFactory() {
          @Override
          public Thread newThread(final Runnable r) {
            final Thread t = new Thread(r);
            t.setName("connector-" + connId++);
            return t;
          }
        });

    protected static Future<Integer> connect(
        final ByteInput in, final ByteOutput out) {
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
                out.write(b);
                out.flush();
                readLen += 1;
              } catch(SocketException e) {
                break;
              }
            }
            return Integer.valueOf(readLen);
        }
      });
    }
  }

  protected static class ProxyHandler extends AbstractProxyHandler {

    private HttpStream cltStream;
    private HttpHeader reqHeader;

    private HttpStream svrStream;
    private HttpHeader resHeader;

    private long startTime;

    public ProxyHandler() {
    }

    @Override
    public void handle(
        final HttpContext context,
        final HttpStream cltStream,
        final HttpHeader reqHeader) throws Exception {

      startTime = System.currentTimeMillis();

      this.cltStream = cltStream;
      this.reqHeader = reqHeader;

      final Socket svrSocket = SocketFactory.getDefault().
          createSocket(getTargetHost(), getTargetPort() );
      try {

        svrStream = context.createStream(svrSocket);

        doRequest();
        doResponse();

      } finally {
        svrSocket.close();
      }
    }

    protected void doRequest() throws Exception {

      svrStream.out.println(reqHeader.getStartLine() );
      int reqContentLength = -1;
      for (Entry<String, List<String>> header :
          reqHeader.getHeaders().entrySet() ) {
        final String key = header.getKey().toLowerCase();
        if (!isTargetProxy() && key.contains("proxy") ) {
          console.log("skip header:" + key);
          continue;
        }
        for (final String value : header.getValue() ) {
          if (key.equals(CONTENT_LENGTH) ) {
            reqContentLength = Integer.parseInt(value);
          }
          svrStream.out.println(header.getKey() + ": " + value);
        }
      }
      svrStream.out.println();
      svrStream.out.flush();
      if (reqContentLength != -1) {
        copyFully(cltStream.in, svrStream.out, reqContentLength);
      }
      svrStream.out.flush();
    }

    protected void doResponse() throws Exception {

      resHeader = HttpHeader.readFrom(svrStream.in);
      console.log(resHeader.getStartLine() );
      console.log(resHeader.getHeaders().toString() );

      cltStream.out.println(resHeader.getStartLine() );
      int resContentLength = -1;
      boolean chunked = false;
      for (Entry<String, List<String>> header :
          resHeader.getHeaders().entrySet() ) {
        final String key = header.getKey().toLowerCase();
        for (final String value : header.getValue() ) {
          if (key.equals(CONTENT_LENGTH) ) {
            resContentLength = Integer.parseInt(value);
          } else if (key.equals(TRANSFER_ENCODING) ) {
            chunked = value.equals(CHUNKED);
          }
          cltStream.out.println(header.getKey() + ": " + value);
        }
      }
      cltStream.out.println();
      cltStream.out.flush();

      int contentLength = 0;
      if (resContentLength != -1) {
        contentLength += copyFully(svrStream.in, cltStream.out, resContentLength);
      } else if (chunked) {
        while (true) {
          final String chunk = svrStream.in.readLine();
          final int chunkSize = Integer.parseInt(chunk, 16);
          cltStream.out.println(chunk);
          contentLength += copyFully(svrStream.in, cltStream.out, chunkSize);
          cltStream.out.println(svrStream.in.readLine() );
          cltStream.out.flush();
          if (chunkSize == 0) {
            break;
          }
        }
      } else {
        contentLength += copyFully(svrStream.in, cltStream.out);
      }
      cltStream.out.flush();

      final long time = System.currentTimeMillis() - startTime;
      final StringBuilder buf = new StringBuilder();
      buf.append("done");
      buf.append("/content-length: " + contentLength);
      buf.append("/" + time + "ms");
      console.log(buf.toString() );
    }
  }

  public static class HttpSession implements Runnable {

    private static final Pattern STR_PAT = Pattern.compile("\\u0020");

    private final HttpContext context;
    private final Socket cltSocket;

    public HttpSession(final HttpContext context, final Socket cltSocket) {
      this.context = context;
      this.cltSocket = cltSocket;
    }

    protected void doSession() throws Exception {
      try {

        final HttpStream cltStream = context.createStream(cltSocket);
        final HttpHeader reqHeader = HttpHeader.readFrom(cltStream.in);
        console.log(reqHeader.getStartLine() );
        console.log(reqHeader.getHeaders().toString() );

        final String[] reqTokens = STR_PAT.split(reqHeader.getStartLine() );
        if (reqTokens.length != 3) {
          throw new IOException("bad start line:" + reqHeader.getStartLine() );
        }
        final String method = reqTokens[0];
        final String path = reqTokens[1];
        final String version = reqTokens[2];

        if (method.equalsIgnoreCase("CONNECT") ) {

          int index = path.indexOf(':');
          if (index == -1) {
            console.error("bad request:" + path);
            return;
          }
          final String host = path.substring(0, index);
          final int port = Integer.parseInt(path.substring(index + 1) );
          final String proxy = context.getProxy(host);

          if (HttpContext.DIRECT.equals(proxy) ) {

            final ConnectorHandler handler = new ConnectorHandler();
            handler.setTargetHost(host);
            handler.setTargetPort(port);
            handler.setTargetProxy(false);
            handler.handle(context, cltStream, reqHeader);

          } else if (proxy != null) {

            final ConnectorHandler handler = new ConnectorHandler();
            setTarget(handler, proxy);
            handler.setTargetProxy(true);
            handler.handle(context, cltStream, reqHeader);

          } else {
            console.error("bad host:" + host);
          }

        } else {

          final URL url = new URL(path);
          final String proxy = context.getProxy(url.getHost() );

          if (HttpContext.DIRECT.equals(proxy) ) {

            // rewrite start line.
            reqHeader.setStartLine(method + " " +
                url.getFile() + " " + version);
            final ProxyHandler handler = new ProxyHandler();
            handler.setTargetHost(url.getHost() );
            handler.setTargetPort(url.getPort() != -1? url.getPort(): 80);
            handler.setTargetProxy(false);
            handler.handle(context, cltStream, reqHeader);

          } else if (proxy != null) {

            final ProxyHandler handler = new ProxyHandler();
            setTarget(handler, proxy);
            handler.setTargetProxy(true);
            handler.handle(context, cltStream, reqHeader);

          } else {
            console.error("bad host:" + url.getHost() );
          }
        }

      } finally {
        cltSocket.close();
      }
    }
    protected void setTarget(AbstractProxyHandler handler, String proxy) {
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
        // ignore
      } catch(EOFException e) {
        // ignore
      } catch(Exception e) {
        throw new RuntimeException(e);
      }
    }
  }
  protected static class HttpHeader {
    private String startLine;
    private Map<String, List<String>> headers =
        new LinkedHashMap<String, List<String>>();
    public HttpHeader() {
    }
    public String getStartLine() {
      return startLine;
    }
    public void setStartLine(String startLine) {
      this.startLine = startLine;
    }
    public Map<String, List<String>> getHeaders() {
      return headers;
    }
    public void setHeaders(Map<String, List<String>> headers) {
      this.headers = headers;
    }
    public static HttpHeader readFrom(PlainInputStream in)
    throws IOException {
      final HttpHeader header = new HttpHeader();
      header.setStartLine(in.readLine() );
      while (true) {
        final String line = in.readLine();
        if (line.length() == 0) {
          break;
        }
        final int index = line.indexOf(':');
        if (index == -1) {
          throw new IOException("unexpected header:" + line);
        }
        final String k = line.substring(0, index).trim();
        final String v = line.substring(index + 1).trim();
        List<String> values = header.getHeaders().get(k);
        if (values == null) {
          values = new ArrayList<String>(1);
          header.getHeaders().put(k, values);
        }
        values.add(v);
      }
      return header;
    }
  }
  public static class HttpStream {
    public final PlainInputStream in;
    public final PlainOutputStream out;
    public HttpStream(final ByteInput in, final ByteOutput out) {
      this.in = new PlainInputStream(in);
      this.out = new PlainOutputStream(out);
    }
  }
  protected static final String CONTENT_LENGTH = "content-length";
  protected static final String TRANSFER_ENCODING = "transfer-encoding";
  protected static final String CHUNKED = "chunked";

  protected static final String US_ASCII = "ISO-8859-1";
  protected static final int CR = '\r';
  protected static final int LF = '\n';

  protected interface ByteInput {
    int read() throws IOException;
  }
  protected interface ByteOutput {
    void write(int b) throws IOException;
    void flush() throws IOException;
  }

  protected static class PlainInputStream implements ByteInput {
    private final ByteInput in;
    public PlainInputStream(final ByteInput in) {
      this.in = in;
    }
    @Override
    public int read() throws IOException {
      return in.read();
    }
    public String readLine() throws IOException {
      final ByteArrayOutputStream bout = new ByteArrayOutputStream();
      try {
        int b;
        while ( (b = read() ) != -1) {
          if (b == CR) {
            b = in.read();
            if (b != LF) {
              throw new IOException("unexpected eol:" + b);
            }
            // <CR><LF>
            break;
          }
          bout.write(b);
        }
      } finally {
        bout.close();
      }
      return new String(bout.toByteArray(), US_ASCII);
    }
  }
  protected static class PlainOutputStream implements ByteOutput {
    private final ByteOutput out;
    public PlainOutputStream(final ByteOutput out) {
      this.out = out;
    }
    public void print(final String line) throws IOException {
      for (byte b : line.getBytes(US_ASCII) ) {
        write(b);
      }
    }
    public void println() throws IOException {
      write(CR);
      write(LF);
    }
    public void println(final String line) throws IOException {
      print(line);
      println();
    }
    @Override
    public void write(int b) throws IOException {
      out.write(b);
    }
    @Override
    public void flush() throws IOException {
      out.flush();
    }
  }
  public static int copyFully(
      final ByteInput in,
      final ByteOutput out, final int length) throws IOException {
    int readLen = 0;
    while (readLen < length) {
      final int b = in.read();
      if (b == -1) {
        throw new EOFException();
      }
      out.write(b);
      readLen += 1;
    }
    return readLen;
  }
  public static int copyFully(
      final ByteInput in,
      final ByteOutput out) throws IOException {
    int readLen = 0;
    while (true) {
      final int b = in.read();
      if (b == -1) {
        break;
      }
      out.write(b);
      readLen += 1;
    }
    return readLen;
  }

  protected static final Console console = new Console() {
    @Override
    public void log(final String msg) {
      out("INFO ", msg);
    }
    @Override
    public void error(final String msg) {
      out("ERROR", msg);
    }
    protected void out(final String level, final String msg) {
      final String timestamp =
          new SimpleDateFormat("yyyy/MM/dd HH:mm:ss.SSS").format(new Date() );
      System.out.println(timestamp + " [" + level +
          "] [" + Thread.currentThread().getName() +  "] - " + msg);
    }
  };
  protected interface Console {
    void log(String msg);
    void error(String msg);
  }
}
